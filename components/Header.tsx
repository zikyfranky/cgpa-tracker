'use client';

import { CourseDataMap } from '@/lib/types';

interface HeaderProps {
  courseData: CourseDataMap;
  matricNumber: string;
  currentLevel: string;
  currentSemester: string;
  onPositionChange: (level: string, sem: string) => void;
  onLock: () => void;
}

export default function Header({ courseData, matricNumber, currentLevel, currentSemester, onPositionChange, onLock }: HeaderProps) {
  const handleChange = (val: string) => {
    const [lvl, sem] = val.split('|');
    onPositionChange(lvl, sem);
  };

  return (
    <div className="header">
      <button className="lock-btn" onClick={onLock} title="Lock app">&#x1f512; Lock</button>
      <h1>{matricNumber} <span>CGPA</span> Tracker</h1>
      <p>Federal University of Technology, Minna &bull; Nigerian Grading System</p>
      <div style={{ marginTop: '14px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Currently in:</span>
        <select
          className="grade-select"
          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
          value={`${currentLevel}|${currentSemester}`}
          onChange={(e) => handleChange(e.target.value)}
        >
          {Object.keys(courseData)
            .filter(lvl => courseData[lvl].session !== 'Carryover')
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map(lvl =>
              Object.keys(courseData[lvl].semesters).map(sem => (
                <option key={`${lvl}|${sem}`} value={`${lvl}|${sem}`}>
                  {lvl}L {sem} ({courseData[lvl].session})
                </option>
              ))
          )}
        </select>
      </div>
    </div>
  );
}
