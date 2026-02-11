'use client';

import { GradeEntry, CourseDataMap } from '@/lib/types';
import { getClassification } from '@/lib/grading';
import { calcSemesterGPA, calcSessionGPA } from '@/lib/calculations';
import SemesterSection from './SemesterSection';

interface LevelTabProps {
  level: string;
  inputMode: 'scores' | 'grade';
  grades: Record<string, GradeEntry>;
  carryovers: Record<string, string>;
  courseData: CourseDataMap;
  currentLevel: string;
  currentSemester: string;
  onSetMode: (mode: 'scores' | 'grade') => void;
  onClearLevel: (level: string) => void;
  onSetScore: (key: string, field: 'ca' | 'exam', value: string) => void;
  onSetGrade: (key: string, grade: string) => void;
  onAddCarryover: (coKey: string, targetLevel: string, targetSem: string) => void;
  onRemoveCarryover: (coKey: string) => void;
}

export default function LevelTab({
  level, inputMode, grades, carryovers, courseData,
  currentLevel, currentSemester,
  onSetMode, onClearLevel, onSetScore, onSetGrade,
  onAddCarryover, onRemoveCarryover
}: LevelTabProps) {
  const data = courseData[level];
  const sessionResult = calcSessionGPA(level, courseData, grades, carryovers);
  const sems = Object.keys(data.semesters);
  const sem1 = calcSemesterGPA(level, sems[0], courseData, grades, carryovers);
  const sem2 = sems[1] ? calcSemesterGPA(level, sems[1], courseData, grades, carryovers) : null;
  const sessionColor = sessionResult.hasAny ? getClassification(sessionResult.gpa).color : 'var(--muted)';
  const sessionClass = sessionResult.hasAny ? getClassification(sessionResult.gpa) : null;

  return (
    <>
      {/* Mode toggle and actions */}
      <div className="action-row">
        <div className="mode-toggle">
          <button
            className={`mode-btn ${inputMode === 'scores' ? 'active' : ''}`}
            onClick={() => onSetMode('scores')}
          >
            Enter CA &amp; Exam
          </button>
          <button
            className={`mode-btn ${inputMode === 'grade' ? 'active' : ''}`}
            onClick={() => onSetMode('grade')}
          >
            Enter Grade
          </button>
        </div>
        <button className="clear-btn" onClick={() => onClearLevel(level)}>
          Clear {level}L Grades
        </button>
      </div>

      {/* Session CGPA summary */}
      <div className="semester-section" style={{ marginBottom: '20px' }}>
        <div className="semester-header" style={{ borderBottom: 'none' }}>
          <h3>{level}L Session CGPA &mdash; {data.session}</h3>
        </div>
        <div style={{ display: 'flex', gap: '16px', padding: '0 20px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{
            flex: 1, minWidth: '140px', textAlign: 'center', padding: '14px',
            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
            border: `1px solid ${sessionColor}33`,
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Session CGPA</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: sessionColor, margin: '4px 0' }}>
              {sessionResult.hasAny ? sessionResult.gpa.toFixed(2) : '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: sessionColor }}>
              {sessionClass ? sessionClass.label : 'No grades yet'}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>1st Semester</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: sem1.hasAny ? getClassification(sem1.gpa).color : 'var(--muted)', margin: '4px 0' }}>
              {sem1.hasAny ? sem1.gpa.toFixed(2) : '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{sem1.totalUnits} units graded</div>
          </div>
          {sem2 && (
            <div style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>2nd Semester</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: sem2.hasAny ? getClassification(sem2.gpa).color : 'var(--muted)', margin: '4px 0' }}>
                {sem2.hasAny ? sem2.gpa.toFixed(2) : '—'}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{sem2.totalUnits} units graded</div>
            </div>
          )}
        </div>
      </div>

      {/* Semester sections */}
      {sems.map(sem => {
        const result = calcSemesterGPA(level, sem, courseData, grades, carryovers);
        return (
          <SemesterSection
            key={sem}
            level={level}
            sem={sem}
            session={data.session}
            courses={data.semesters[sem]}
            result={result}
            inputMode={inputMode}
            grades={grades}
            carryovers={carryovers}
            courseData={courseData}
            currentLevel={currentLevel}
            currentSemester={currentSemester}
            onSetScore={onSetScore}
            onSetGrade={onSetGrade}
            onAddCarryover={onAddCarryover}
            onRemoveCarryover={onRemoveCarryover}
          />
        );
      })}
    </>
  );
}
