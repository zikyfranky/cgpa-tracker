'use client';

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppState } from '@/hooks/useAppState';
import { getCourseData } from '@/lib/courseData';
import { buildEffectiveCourseData } from '@/lib/effectiveData';
import LoginScreen from '@/components/LoginScreen';
import AppShell from '@/components/AppShell';
import SaveIndicator from '@/components/SaveIndicator';

export default function Home() {
  const { isAuthenticated, isSetup, handleSetup, handleLogin, lock } = useAuth();
  const {
    state, loaded, showSave,
    loadState, doCleanup,
    setTab, setMode, setCurrentPosition, setUpcomingFilter,
    setScore, setGrade, clearLevel,
    addCarryover, removeCarryover,
  } = useAppState();

  const baseCourseData = getCourseData();
  // Build effective course data with virtual overflow levels for unadded carryovers
  const courseData = useMemo(
    () => buildEffectiveCourseData(baseCourseData, state.grades, state.carryovers),
    [baseCourseData, state.grades, state.carryovers]
  );

  // Load state when authenticated
  useEffect(() => {
    if (isAuthenticated && !loaded) {
      loadState();
    }
  }, [isAuthenticated, loaded, loadState]);

  // Cleanup carryovers on each render when authenticated
  useEffect(() => {
    if (isAuthenticated && loaded) {
      doCleanup();
    }
  }, [isAuthenticated, loaded, doCleanup]);

  if (!isAuthenticated) {
    return (
      <LoginScreen
        isSetupMode={isSetup()}
        onSetup={handleSetup}
        onLogin={handleLogin}
      />
    );
  }

  if (!loaded) {
    return null; // Loading state
  }

  return (
    <>
      <AppShell
        state={state}
        courseData={courseData}
        onSetTab={setTab}
        onSetMode={setMode}
        onSetCurrentPosition={setCurrentPosition}
        onSetUpcomingFilter={setUpcomingFilter}
        onSetScore={setScore}
        onSetGrade={setGrade}
        onClearLevel={clearLevel}
        onAddCarryover={addCarryover}
        onRemoveCarryover={removeCarryover}
        onLock={lock}
      />
      <SaveIndicator show={showSave} />
    </>
  );
}
