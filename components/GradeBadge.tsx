'use client';

interface GradeBadgeProps {
  grade: string | null;
}

export default function GradeBadge({ grade }: GradeBadgeProps) {
  const gradeClass = grade ? `grade-${grade}` : 'grade-none';
  return (
    <span className={`grade-badge ${gradeClass}`}>
      {grade || '—'}
    </span>
  );
}
