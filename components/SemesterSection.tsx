'use client';

import { Course, GradeEntry, SemesterResult, CourseDataMap, AddedCarryover, PendingCarryover } from '@/lib/types';
import { getClassification } from '@/lib/grading';
import { getKey, getCourseGrade, getCourseTotal } from '@/lib/calculations';
import { coGradeKey, getCoGrade, getCoTotal, getTotalSemUnits, getAddedCOsForSem, getPendingCOsForSem } from '@/lib/carryovers';
import { getMaxUnits } from '@/lib/courseData';
import CourseRow from './CourseRow';
import CarryoverRow from './CarryoverRow';
import CarryoverPending from './CarryoverPending';

interface SemesterSectionProps {
  level: string;
  sem: string;
  session: string;
  courses: Course[];
  result: SemesterResult;
  inputMode: 'scores' | 'grade';
  grades: Record<string, GradeEntry>;
  carryovers: Record<string, string>;
  courseData: CourseDataMap;
  currentLevel: string;
  currentSemester: string;
  onSetScore: (key: string, field: 'ca' | 'exam', value: string) => void;
  onSetGrade: (key: string, grade: string) => void;
  onAddCarryover: (coKey: string, targetLevel: string, targetSem: string) => void;
  onRemoveCarryover: (coKey: string) => void;
}

export default function SemesterSection({
  level, sem, session, courses, result, inputMode,
  grades, carryovers, courseData, currentLevel, currentSemester,
  onSetScore, onSetGrade, onAddCarryover, onRemoveCarryover
}: SemesterSectionProps) {
  const gpaColor = result.hasAny ? getClassification(result.gpa).color : 'var(--muted)';
  const totalSemUnits = getTotalSemUnits(level, sem, carryovers, courseData);
  const semMax = getMaxUnits(level, sem);
  const unitClass = totalSemUnits > semMax ? 'full' : totalSemUnits >= (semMax - 2) ? 'warn' : 'ok';

  const addedCOs = getAddedCOsForSem(level, sem, carryovers, courseData);
  const pendingCOs = getPendingCOsForSem(level, sem, carryovers, courseData, grades, getCourseGrade, currentLevel, currentSemester);

  const regUnits = courses.reduce((s, c) => s + c.units, 0);
  const coUnitsAdded = addedCOs.reduce((s, c) => s + c.units, 0);
  const dispTotalUnits = regUnits + coUnitsAdded;

  return (
    <div className="semester-section">
      <div className="semester-header">
        <h3>{sem} &mdash; {session}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className={`unit-counter ${unitClass}`}>{totalSemUnits} / {semMax} units</span>
          <span
            className="semester-gpa"
            style={{
              background: result.hasAny ? gpaColor + '22' : 'rgba(255,255,255,0.05)',
              color: gpaColor,
              border: `1px solid ${gpaColor}44`,
            }}
          >
            GPA: {result.hasAny ? result.gpa.toFixed(2) : '—'}
          </span>
        </div>
      </div>

      <div className="overflow-x">
        <table className="course-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Title</th>
              <th>Units</th>
              {inputMode === 'scores' ? (
                <><th>CA /30</th><th>Exam /70</th><th>Total</th></>
              ) : (
                <><th>Grade</th><th>Suggested CA/Exam</th></>
              )}
              <th>Grade</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {/* Regular courses */}
            {courses.map(c => {
              const key = getKey(level, sem, c.code);
              const gradeData = grades[key] || {};
              const gradeResult = getCourseGrade(level, sem, c.code, grades);
              const total = getCourseTotal(level, sem, c.code, grades);
              return (
                <CourseRow
                  key={c.code}
                  course={c}
                  gradeKey={key}
                  gradeData={gradeData}
                  gradeResult={gradeResult}
                  total={total}
                  inputMode={inputMode}
                  onSetScore={onSetScore}
                  onSetGrade={onSetGrade}
                />
              );
            })}

            {/* Added carryover courses */}
            {addedCOs.map(co => {
              const gKey = coGradeKey(level, sem, co.code);
              const gradeData = grades[gKey] || {};
              const gradeResult = getCoGrade(level, sem, co.code, grades);
              const total = getCoTotal(level, sem, co.code, grades);
              return (
                <CarryoverRow
                  key={co.coKey}
                  co={co}
                  gradeKey={gKey}
                  gradeData={gradeData}
                  gradeResult={gradeResult}
                  total={total}
                  inputMode={inputMode}
                  onSetScore={onSetScore}
                  onSetGrade={onSetGrade}
                  onRemove={onRemoveCarryover}
                />
              );
            })}

            {/* Totals row */}
            <tr className="total-row">
              <td colSpan={2}>
                Semester Total
                {coUnitsAdded > 0 && (
                  <span style={{ color: 'var(--warning)', fontSize: '0.8rem' }}> (incl. {coUnitsAdded} C/O units)</span>
                )}
              </td>
              <td><span className="course-units">{dispTotalUnits}</span></td>
              <td colSpan={inputMode === 'scores' ? 3 : 2}></td>
              <td style={{ color: gpaColor }}>
                <strong>{result.hasAny ? result.gpa.toFixed(2) : '—'}</strong>
              </td>
              <td>{result.hasAny ? result.totalQP : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pending carryovers */}
      <CarryoverPending
        pendingCOs={pendingCOs}
        level={level}
        sem={sem}
        totalSemUnits={totalSemUnits}
        semMax={semMax}
        carryovers={carryovers}
        courseData={courseData}
        onAdd={onAddCarryover}
      />
    </div>
  );
}
