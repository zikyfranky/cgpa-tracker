'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { fetchCourseData } from '@/lib/courseData';
import { buildEffectiveCourseData } from '@/lib/effectiveData';
import { CourseDataMap } from '@/lib/types';
import LoginScreen from '@/components/LoginScreen';
import AppShell from '@/components/AppShell';
import SaveIndicator from '@/components/SaveIndicator';

export default function Home() {
  const {
    isAuthenticated, matricNumber, checking,
    handleRegister, handleLogin, lock, getRememberedMatric,
  } = useAuth();
  const {
    state, loaded, showSave,
    loadState, doCleanup, resetLoaded,
    setTab, setMode, setCurrentPosition, setUpcomingFilter,
    setScore, setGrade, clearLevel,
    addCarryover, removeCarryover,
  } = useAppState();

  const [baseCourseData, setBaseCourseData] = useState<CourseDataMap>({});
  const [coursesLoaded, setCoursesLoaded] = useState(false);

  // Fetch course data from API on mount
  useEffect(() => {
    fetchCourseData().then(data => {
      setBaseCourseData(data);
      setCoursesLoaded(true);
    });
  }, []);

  const courseData = useMemo(
    () => buildEffectiveCourseData(baseCourseData, state.grades, state.carryovers),
    [baseCourseData, state.grades, state.carryovers]
  );

  // Load state when authenticated and courses are loaded
  useEffect(() => {
    if (isAuthenticated && !loaded && coursesLoaded) {
      loadState();
    }
  }, [isAuthenticated, loaded, coursesLoaded, loadState]);

  // Cleanup carryovers when authenticated and loaded
  useEffect(() => {
    if (isAuthenticated && loaded && coursesLoaded) {
      doCleanup(baseCourseData);
    }
    // Only run on load, not on every courseData change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loaded, coursesLoaded]);

  // Reset state when user locks
  const handleLock = useCallback(async () => {
    resetLoaded();
    await lock();
  }, [resetLoaded, lock]);

  // Wrap clearLevel to pass courseData
  const handleClearLevel = useCallback((level: string) => {
    clearLevel(level, courseData);
  }, [clearLevel, courseData]);

  // Show nothing while checking auth session
  if (checking) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <LoginScreen
        rememberedMatric={getRememberedMatric()}
        onRegister={handleRegister}
        onLogin={handleLogin}
      />
    );
  }

  if (!loaded || !coursesLoaded) {
    return null;
  }

  return (
    <>
      <AppShell
        state={state}
        courseData={courseData}
        matricNumber={matricNumber}
        onSetTab={setTab}
        onSetMode={setMode}
        onSetCurrentPosition={setCurrentPosition}
        onSetUpcomingFilter={setUpcomingFilter}
        onSetScore={setScore}
        onSetGrade={setGrade}
        onClearLevel={handleClearLevel}
        onAddCarryover={addCarryover}
        onRemoveCarryover={removeCarryover}
        onLock={handleLock}
      />
      <SaveIndicator show={showSave} />
    </>
  );
}
