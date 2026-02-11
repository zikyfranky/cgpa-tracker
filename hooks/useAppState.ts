'use client';

import { useState, useCallback, useRef } from 'react';
import { AppState, CourseDataMap } from '@/lib/types';
import { getGradeFromScore, suggestScores } from '@/lib/grading';
import { cleanupCarryovers } from '@/lib/carryovers';
import { getCourseGrade } from '@/lib/calculations';

const DEFAULT_STATE: AppState = {
  activeTab: 'overview',
  inputMode: 'scores',
  currentLevel: '100',
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
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const courseDataRef = useRef<CourseDataMap | null>(null);

  // Allow passing courseData for cleanup operations
  const setCourseDataRef = useCallback((cd: CourseDataMap) => {
    courseDataRef.current = cd;
  }, []);

  // Load state from the database
  const loadState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState({
          activeTab: data.activeTab || 'overview',
          inputMode: data.inputMode || 'scores',
          currentLevel: data.currentLevel || '100',
          currentSemester: data.currentSemester || 'First Semester',
          upcomingFilter: data.upcomingFilter || 'all',
          grades: data.grades || {},
          carryovers: data.carryovers || {},
        });
      }
    } catch {
      // Use default state on error
    }
    setLoaded(true);
  }, []);

  // Save state to database (debounced)
  const saveState = useCallback((newState: AppState) => {
    // Show save indicator immediately
    setShowSave(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setShowSave(false), 1500);

    // Debounce the actual API call to avoid flooding
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      }).catch(() => {});
    }, 500);
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
  const doCleanup = useCallback((courseData: CourseDataMap) => {
    setState(prev => {
      const result = cleanupCarryovers(prev.grades, prev.carryovers, courseData, getCourseGrade);
      if (result) {
        const next = { ...prev, grades: result.grades, carryovers: result.carryovers };
        saveState(next);
        return next;
      }
      return prev;
    });
  }, [saveState]);

  // Reset loaded state (for when user locks/switches account)
  const resetLoaded = useCallback(() => {
    setLoaded(false);
    setState(DEFAULT_STATE);
  }, []);

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

  const clearLevel = useCallback((level: string, courseData: CourseDataMap) => {
    updateState(prev => {
      const data = courseData[level];
      if (!data) return prev;
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
    resetLoaded,
    setCourseDataRef,
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
