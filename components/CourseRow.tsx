'use client';

import { Course, GradeEntry, GradeInfo } from '@/lib/types';
import { GRADES } from '@/lib/constants';
import { getClassification } from '@/lib/grading';
import GradeBadge from './GradeBadge';

interface CourseRowProps {
  course: Course;
  gradeKey: string;
  gradeData: GradeEntry;
  gradeResult: GradeInfo | null;
  total: number | null;
  inputMode: 'scores' | 'grade';
  onSetScore: (key: string, field: 'ca' | 'exam', value: string) => void;
  onSetGrade: (key: string, grade: string) => void;
}

export default function CourseRow({
  course, gradeKey, gradeData, gradeResult, total,
  inputMode, onSetScore, onSetGrade
}: CourseRowProps) {
  return (
    <tr>
      <td><span className="course-code">{course.code}</span></td>
      <td className="course-title" title={course.title}>{course.title}</td>
      <td><span className="course-units">{course.units}</span></td>

      {inputMode === 'scores' ? (
        <>
          <td>
            <input
              type="number"
              className="score-input"
              min={0}
              max={30}
              placeholder="0"
              value={gradeData.ca !== undefined ? gradeData.ca : ''}
              onChange={(e) => onSetScore(gradeKey, 'ca', e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              className="score-input"
              min={0}
              max={70}
              placeholder="0"
              value={gradeData.exam !== undefined ? gradeData.exam : ''}
              onChange={(e) => onSetScore(gradeKey, 'exam', e.target.value)}
            />
          </td>
          <td style={{ fontWeight: 600, color: total !== null ? 'var(--text)' : 'var(--muted)' }}>
            {total !== null ? total : '—'}
          </td>
        </>
      ) : (
        <>
          <td>
            <select
              className="grade-select"
              value={gradeData.grade || ''}
              onChange={(e) => onSetGrade(gradeKey, e.target.value)}
            >
              <option value="">—</option>
              {GRADES.map(g => (
                <option key={g.grade} value={g.grade}>
                  {g.grade} – {g.desc} ({g.min}-{g.max})
                </option>
              ))}
            </select>
          </td>
          <td>
            {gradeData.ca !== undefined && gradeData.exam !== undefined ? (
              <div className="suggested">
                CA: <span>{gradeData.ca}</span> | Exam: <span>{gradeData.exam}</span> | Total: <span>{parseFloat(String(gradeData.ca)) + parseFloat(String(gradeData.exam))}</span>
              </div>
            ) : (
              <span style={{ color: 'var(--muted)' }}>—</span>
            )}
          </td>
        </>
      )}

      <td><GradeBadge grade={gradeResult ? gradeResult.grade : null} /></td>
      <td style={{
        fontWeight: 600,
        color: gradeResult ? getClassification(gradeResult.points).color : 'var(--muted)',
      }}>
        {gradeResult ? gradeResult.points : '—'}
      </td>
    </tr>
  );
}
