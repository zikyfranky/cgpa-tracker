'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, GradeEntry } from '@/lib/types';
import { STATE_STORAGE_KEY } from '@/lib/constants';
import { getCourseData } from '@/lib/courseData';
import { getGradeFromScore } from '@/lib/grading';
import { suggestScores } from '@/lib/grading';
import { cleanupCarryovers } from '@/lib/carryovers';
import { getCourseGrade } from '@/lib/calculations';

const DEFAULT_STATE: AppState = {
  activeTab: 'overview',
  inputMode: 'scores',
  currentLevel: '300',
  currentSemester: 'First Semester',
  upcomingFilter: 'all',
  grades: {},
  carryovers: {},
};

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [showSave, setShowSave] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load state from localStorage
  const loadState = useCallback(() => {
    try {
      const saved = localStorage.getItem(STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState({
          activeTab: parsed.activeTab || 'overview',
          inputMode: parsed.inputMode || 'scores',
          currentLevel: parsed.currentLevel || '300',
          currentSemester: parsed.currentSemester || 'First Semester',
          upcomingFilter: parsed.upcomingFilter || 'all',
          grades: parsed.grades || {},
          carryovers: parsed.carryovers || {},
        });
      }
    } catch (e) {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: AppState) => {
    try {
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify({
        ...newState,
        lastSaved: new Date().toISOString(),
      }));
      setShowSave(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setShowSave(false), 1500);
    } catch (e) {
      // Ignore
    }
  }, []);

  // Update helper
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, [saveState]);

  // Cleanup carryovers
  const doCleanup = useCallback(() => {
    setState(prev => {
      const courseData = getCourseData();
      const result = cleanupCarryovers(prev.grades, prev.carryovers, courseData, getCourseGrade);
      if (result) {
        const next = { ...prev, grades: result.grades, carryovers: result.carryovers };
        saveState(next);
        return next;
      }
      return prev;
    });
  }, [saveState]);

  // Actions
  const setTab = useCallback((tab: string) => {
    updateState(prev => ({ ...prev, activeTab: tab }));
  }, [updateState]);

  const setMode = useCallback((mode: 'scores' | 'grade') => {
    updateState(prev => ({ ...prev, inputMode: mode }));
  }, [updateState]);

  const setCurrentPosition = useCallback((level: string, sem: string) => {
    updateState(prev => ({ ...prev, currentLevel: level, currentSemester: sem }));
  }, [updateState]);

  const setUpcomingFilter = useCallback((val: string) => {
    updateState(prev => ({ ...prev, upcomingFilter: val }));
  }, [updateState]);

  const setScore = useCallback((key: string, field: 'ca' | 'exam', value: string) => {
    updateState(prev => {
      const newGrades = { ...prev.grades };
      if (!newGrades[key]) newGrades[key] = {};
      const num = value === '' ? undefined : parseFloat(value);
      if (field === 'ca' && num !== undefined && (num < 0 || num > 30)) return prev;
      if (field === 'exam' && num !== undefined && (num < 0 || num > 70)) return prev;
      newGrades[key] = { ...newGrades[key], [field]: num };

      // Auto-sync grade from CA+Exam
      const ca = newGrades[key].ca !== undefined ? parseFloat(String(newGrades[key].ca)) : NaN;
      const exam = newGrades[key].exam !== undefined ? parseFloat(String(newGrades[key].exam)) : NaN;
      if (!isNaN(ca) && !isNaN(exam)) {
        const g = getGradeFromScore(ca + exam);
        newGrades[key] = { ...newGrades[key], grade: g ? g.grade : undefined };
      } else {
        newGrades[key] = { ...newGrades[key], grade: undefined };
      }

      return { ...prev, grades: newGrades };
    });
  }, [updateState]);

  const setGrade = useCallback((key: string, grade: string) => {
    updateState(prev => {
      const newGrades = { ...prev.grades };
      if (grade === '') {
        delete newGrades[key];
      } else {
        newGrades[key] = { ...newGrades[key], grade };
        const suggested = suggestScores(grade);
        if (suggested) {
          newGrades[key] = { ...newGrades[key], ca: suggested.ca, exam: suggested.exam };
        }
      }
      return { ...prev, grades: newGrades };
    });
  }, [updateState]);

  const clearLevel = useCallback((level: string) => {
    updateState(prev => {
      const courseData = getCourseData();
      const data = courseData[level];
      if (!data) return prev; // Virtual level — no regular courses to clear
      const newGrades = { ...prev.grades };
      for (const sem of Object.keys(data.semesters)) {
        for (const c of data.semesters[sem]) {
          delete newGrades[`${level}-${sem}-${c.code}`];
        }
      }
      return { ...prev, grades: newGrades };
    });
  }, [updateState]);

  const addCarryover = useCallback((coKey: string, targetLevel: string, targetSem: string) => {
    updateState(prev => {
      const newCarryovers = { ...prev.carryovers, [coKey]: targetLevel + '|' + targetSem };
      return { ...prev, carryovers: newCarryovers };
    });
  }, [updateState]);

  const removeCarryover = useCallback((coKey: string) => {
    updateState(prev => {
      const newGrades = { ...prev.grades };
      const newCarryovers = { ...prev.carryovers };
      if (newCarryovers[coKey]) {
        const [tLvl, tSem] = newCarryovers[coKey].split('|');
        const [code] = coKey.split('|');
        delete newGrades['CO:' + tLvl + '-' + tSem + '-' + code];
        delete newCarryovers[coKey];
      }
      return { ...prev, grades: newGrades, carryovers: newCarryovers };
    });
  }, [updateState]);

  return {
    state,
    loaded,
    showSave,
    loadState,
    doCleanup,
    setTab,
    setMode,
    setCurrentPosition,
    setUpcomingFilter,
    setScore,
    setGrade,
    clearLevel,
    addCarryover,
    removeCarryover,
  };
}
