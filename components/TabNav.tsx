'use client';

import { CourseDataMap, GradeEntry } from '@/lib/types';
import { getClassification } from '@/lib/grading';
import { calcCGPA, calcSessionGPA } from '@/lib/calculations';

interface TabNavProps {
  activeTab: string;
  courseData: CourseDataMap;
  grades: Record<string, GradeEntry>;
  carryovers: Record<string, string>;
  onSetTab: (tab: string) => void;
}

export default function TabNav({ activeTab, courseData, grades, carryovers, onSetTab }: TabNavProps) {
  const cgpaData = calcCGPA(courseData, grades, carryovers);
  const overviewGpa = cgpaData.hasAny ? cgpaData.cgpa.toFixed(2) : '—';
  const overviewColor = cgpaData.hasAny ? getClassification(cgpaData.cgpa).color : 'var(--muted)';

  interface TabItem {
    id: string;
    label: string;
    gpa: string;
    color: string;
  }

  const tabItems: TabItem[] = [
    { id: 'overview', label: 'Overview', gpa: overviewGpa, color: overviewColor },
  ];

  const sortedLevels = Object.keys(courseData).sort((a, b) => parseInt(a) - parseInt(b));
  for (const lvl of sortedLevels) {
    const sGpa = calcSessionGPA(lvl, courseData, grades, carryovers);
    const sColor = sGpa.hasAny ? getClassification(sGpa.gpa).color : 'var(--muted)';
    tabItems.push({
      id: lvl,
      label: `${lvl}L (${courseData[lvl].session})`,
      gpa: sGpa.hasAny ? sGpa.gpa.toFixed(2) : '—',
      color: sColor,
    });
  }

  return (
    <div className="tabs">
      {tabItems.map(t => (
        <button
          key={t.id}
          className={`tab ${activeTab === t.id ? 'active' : ''}`}
          onClick={() => onSetTab(t.id)}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', lineHeight: 1.3 }}
        >
          <span>{t.label}</span>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: activeTab === t.id ? 'white' : t.color,
            opacity: t.gpa === '—' ? 0.5 : 1,
          }}>
            {t.gpa}
          </span>
        </button>
      ))}
    </div>
  );
}
