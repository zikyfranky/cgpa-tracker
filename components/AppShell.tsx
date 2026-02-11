'use client';

import { AppState, CourseDataMap } from '@/lib/types';
import { getClassification } from '@/lib/grading';
import { calcCGPA, countFilledCourses, getTotalCredits } from '@/lib/calculations';
import Header from './Header';
import Dashboard from './Dashboard';
import TabNav from './TabNav';
import OverviewTab from './OverviewTab';
import LevelTab from './LevelTab';

interface AppShellProps {
  state: AppState;
  courseData: CourseDataMap;
  matricNumber: string;
  onSetTab: (tab: string) => void;
  onSetMode: (mode: 'scores' | 'grade') => void;
  onSetCurrentPosition: (level: string, sem: string) => void;
  onSetUpcomingFilter: (val: string) => void;
  onSetScore: (key: string, field: 'ca' | 'exam', value: string) => void;
  onSetGrade: (key: string, grade: string) => void;
  onClearLevel: (level: string) => void;
  onAddCarryover: (coKey: string, targetLevel: string, targetSem: string) => void;
  onRemoveCarryover: (coKey: string) => void;
  onLock: () => void;
}

export default function AppShell({
  state, courseData, matricNumber,
  onSetTab, onSetMode, onSetCurrentPosition, onSetUpcomingFilter,
  onSetScore, onSetGrade, onClearLevel,
  onAddCarryover, onRemoveCarryover, onLock
}: AppShellProps) {
  const cgpaData = calcCGPA(courseData, state.grades, state.carryovers);
  const classification = getClassification(cgpaData.cgpa);
  const { filled, total } = countFilledCourses(courseData, state.grades, state.carryovers);
  const totalCredits = getTotalCredits(courseData, state.carryovers);

  return (
    <div className="app">
      <Header
        courseData={courseData}
        matricNumber={matricNumber}
        currentLevel={state.currentLevel}
        currentSemester={state.currentSemester}
        onPositionChange={onSetCurrentPosition}
        onLock={onLock}
      />

      <Dashboard
        cgpaData={cgpaData}
        classification={classification}
        filled={filled}
        total={total}
        totalCredits={totalCredits}
      />

      <TabNav
        activeTab={state.activeTab}
        courseData={courseData}
        grades={state.grades}
        carryovers={state.carryovers}
        onSetTab={onSetTab}
      />

      {state.activeTab === 'overview' ? (
        <OverviewTab
          cgpaData={cgpaData}
          grades={state.grades}
          carryovers={state.carryovers}
          courseData={courseData}
          currentLevel={state.currentLevel}
          currentSemester={state.currentSemester}
          upcomingFilter={state.upcomingFilter}
          onSetUpcomingFilter={onSetUpcomingFilter}
        />
      ) : (
        <LevelTab
          level={state.activeTab}
          inputMode={state.inputMode}
          grades={state.grades}
          carryovers={state.carryovers}
          courseData={courseData}
          currentLevel={state.currentLevel}
          currentSemester={state.currentSemester}
          onSetMode={onSetMode}
          onClearLevel={onClearLevel}
          onSetScore={onSetScore}
          onSetGrade={onSetGrade}
          onAddCarryover={onAddCarryover}
          onRemoveCarryover={onRemoveCarryover}
        />
      )}

      {/* Footer */}
      <div className="footer">
        FUTMinna 5-Point Grading System (2024/2025 Handbook)<br />
        A Excellent (70-100) = 5pts &bull; B Very Good (60-69) = 4pts &bull; C Good (50-59) = 3pts &bull; D Fair (45-49) = 2pts &bull; E Poor (40-44) = 1pt &bull; F Fail (0-39) = 0pts<br />
        CA out of 30 &bull; Exam out of 70 &bull; VC List: 4.50+ &bull; Dean&apos;s List: 4.00+
      </div>
      <div className="copyright">
        &copy; {new Date().getFullYear()} &bull; Made with ❤️ by Isaac Frank
      </div>
    </div>
  );
}
