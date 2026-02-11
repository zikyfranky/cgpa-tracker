'use client';

import { GradeEntry, CGPAResult, CourseDataMap } from '@/lib/types';
import { getClassification } from '@/lib/grading';
import { calcSemesterGPA, getCourseGrade } from '@/lib/calculations';
import InsightsPanel from './InsightsPanel';

interface OverviewTabProps {
  cgpaData: CGPAResult;
  grades: Record<string, GradeEntry>;
  carryovers: Record<string, string>;
  courseData: CourseDataMap;
  currentLevel: string;
  currentSemester: string;
  upcomingFilter: string;
  onSetUpcomingFilter: (val: string) => void;
}

export default function OverviewTab({
  cgpaData, grades, carryovers, courseData,
  currentLevel, currentSemester, upcomingFilter, onSetUpcomingFilter
}: OverviewTabProps) {
  // Only show real academic levels in overview (not virtual carryover levels)
  const levelKeys = Object.keys(courseData)
    .filter(lvl => courseData[lvl].session !== 'Carryover')
    .sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <>
      {/* Semester GPA comparison */}
      <div className="semester-section">
        <div className="semester-header">
          <h3>Semester GPA Breakdown</h3>
        </div>
        <div className="overflow-x">
          <table className="course-table">
            <thead>
              <tr>
                <th>Level</th>
                <th>Semester</th>
                <th>Courses</th>
                <th>Credits</th>
                <th>GPA</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {levelKeys.map(level => {
                const data = courseData[level];
                return Object.keys(data.semesters).map(sem => {
                  const result = calcSemesterGPA(level, sem, courseData, grades, carryovers);
                  const courses = data.semesters[sem];
                  const filledCount = courses.filter(c => getCourseGrade(level, sem, c.code, grades)).length;
                  const gpaColor = result.hasAny ? getClassification(result.gpa).color : 'var(--muted)';
                  const totalCourseUnits = courses.reduce((s, c) => s + c.units, 0);
                  return (
                    <tr key={`${level}-${sem}`}>
                      <td><span className={`level-${level}`}>{level}L</span></td>
                      <td>{sem}</td>
                      <td>{filledCount}/{courses.length}</td>
                      <td>{result.totalUnits}/{totalCourseUnits}</td>
                      <td style={{ fontWeight: 700, color: gpaColor }}>
                        {result.hasAny ? result.gpa.toFixed(2) : '—'}
                      </td>
                      <td>
                        {result.allFilled ? (
                          <span style={{ color: 'var(--success)' }}>Complete</span>
                        ) : result.hasAny ? (
                          <span style={{ color: 'var(--warning)' }}>Partial</span>
                        ) : (
                          <span style={{ color: 'var(--muted)' }}>Empty</span>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <InsightsPanel
        cgpaData={cgpaData}
        grades={grades}
        courseData={courseData}
        currentLevel={currentLevel}
        currentSemester={currentSemester}
        upcomingFilter={upcomingFilter}
        onSetUpcomingFilter={onSetUpcomingFilter}
      />
    </>
  );
}
