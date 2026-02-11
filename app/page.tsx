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
  const {
    isAuthenticated, matricNumber,
    handleRegister, handleLogin, lock, getRememberedMatric,
  } = useAuth();
  const {
    state, loaded, showSave,
    loadState, doCleanup, resetLoaded,
    setTab, setMode, setCurrentPosition, setUpcomingFilter,
    setScore, setGrade, clearLevel,
    addCarryover, removeCarryover,
  } = useAppState();

  const baseCourseData = getCourseData();
  const courseData = useMemo(
    () => buildEffectiveCourseData(baseCourseData, state.grades, state.carryovers),
    [baseCourseData, state.grades, state.carryovers]
  );

  // Load state when authenticated (keyed by matric number)
  useEffect(() => {
    if (isAuthenticated && matricNumber && !loaded) {
      loadState(matricNumber);
    }
  }, [isAuthenticated, matricNumber, loaded, loadState]);

  // Cleanup carryovers when authenticated and loaded
  useEffect(() => {
    if (isAuthenticated && loaded) {
      doCleanup();
    }
  }, [isAuthenticated, loaded, doCleanup]);

  // Reset state when user locks
  const handleLock = () => {
    resetLoaded();
    lock();
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        rememberedMatric={getRememberedMatric()}
        onRegister={handleRegister}
        onLogin={handleLogin}
      />
    );
  }

  if (!loaded) {
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
        onClearLevel={clearLevel}
        onAddCarryover={addCarryover}
        onRemoveCarryover={removeCarryover}
        onLock={handleLock}
      />
      <SaveIndicator show={showSave} />
    </>
  );
}
