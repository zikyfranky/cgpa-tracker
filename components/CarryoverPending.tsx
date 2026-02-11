'use client';

import { PendingCarryover, CourseDataMap } from '@/lib/types';
import { getSortedLevels, canFitInSemester } from '@/lib/carryovers';

interface CarryoverPendingProps {
  pendingCOs: PendingCarryover[];
  level: string;
  sem: string;
  totalSemUnits: number;
  semMax: number;
  carryovers: Record<string, string>;
  courseData: CourseDataMap;
  onAdd: (coKey: string, targetLevel: string, targetSem: string) => void;
}

export default function CarryoverPending({
  pendingCOs, level, sem, totalSemUnits, semMax,
  carryovers, courseData, onAdd
}: CarryoverPendingProps) {
  if (pendingCOs.length === 0) return null;

  return (
    <div className="co-pending">
      <div className="co-pending-title">&#x1f504; Pending Carryover(s)</div>
      {pendingCOs.map(co => {
        const canFit = co.fits;
        let cascadeTarget: string | null = null;
        if (!canFit) {
          const levels = getSortedLevels(courseData);
          const idx = levels.indexOf(level);
          for (let i = idx + 1; i < levels.length; i++) {
            if (courseData[levels[i]].semesters[sem] &&
                canFitInSemester(levels[i], sem, co.units, carryovers, courseData)) {
              cascadeTarget = levels[i] + 'L';
              break;
            }
          }
        }

        return (
          <div key={co.coKey} className="co-item">
            <div className="co-item-info">
              <span className="co-tag">C/O from {co.origLevel}L</span>
              <span className="course-code" style={{ fontSize: '0.85rem' }}>{co.code}</span>
              <span style={{ color: 'var(--text)' }}>{co.title}</span>
              <span className="course-units">{co.units}</span>
            </div>
            {canFit ? (
              <button
                className="co-add-btn"
                onClick={() => onAdd(co.coKey, level, sem)}
              >
                ADD ({totalSemUnits + co.units}/{semMax})
              </button>
            ) : (
              <span className="co-cascade-note">
                Exceeds {semMax} units{cascadeTarget ? ` → Cascades to ${cascadeTarget}` : ' → No slot available'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
