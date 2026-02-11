import { CourseDataMap, GradeEntry } from './types';
import { getCourseGrade } from './calculations';
import { getAllFailedForCarryover, getSortedLevels } from './carryovers';
import { getGlobalMaxUnits } from './courseData';

/**
 * Augments the base courseData with virtual overflow levels for unadded carryovers.
 *
 * If there are failed courses (grade F) that haven't been added as carryovers
 * anywhere, and there's no defined level beyond the last one, this creates
 * virtual levels (400L, 500L, etc.) with empty course arrays so the COs
 * appear as pending there. Uses globalMaxUnits for these levels.
 *
 * Also preserves virtual levels where COs have already been added.
 */
export function buildEffectiveCourseData(
  baseCourseData: CourseDataMap,
  grades: Record<string, GradeEntry>,
  carryovers: Record<string, string>
): CourseDataMap {
  // Deep-ish copy of base data
  const effective: CourseDataMap = {};
  for (const [level, data] of Object.entries(baseCourseData)) {
    effective[level] = {
      session: data.session,
      semesters: { ...data.semesters },
    };
  }

  const levels = getSortedLevels(baseCourseData);
  const lastLevelNum = levels.length > 0 ? parseInt(levels[levels.length - 1]) : 0;
  const globalMax = getGlobalMaxUnits();

  // Track which virtual levels+semesters are needed
  const virtualLevelSems: Record<string, Set<string>> = {};

  // 1. Virtual levels that already have added carryovers (must persist)
  for (const targetVal of Object.values(carryovers)) {
    const [targetLevel, targetSem] = targetVal.split('|');
    if (!baseCourseData[targetLevel]) {
      if (!virtualLevelSems[targetLevel]) virtualLevelSems[targetLevel] = new Set();
      virtualLevelSems[targetLevel].add(targetSem);
    }
  }

  // 2. Virtual levels needed for unadded COs
  const allFailed = getAllFailedForCarryover(baseCourseData, grades, getCourseGrade);
  const unadded = allFailed.filter(f => !carryovers[f.coKey]);

  if (unadded.length > 0) {
    // Group by semester type
    const byFirst = unadded.filter(f => f.origSem === 'First Semester');
    const bySecond = unadded.filter(f => f.origSem === 'Second Semester');

    const firstUnits = byFirst.reduce((s, c) => s + c.units, 0);
    const secondUnits = bySecond.reduce((s, c) => s + c.units, 0);

    // How many virtual levels needed so ALL COs can eventually fit?
    const firstNeeded = firstUnits > 0 ? Math.ceil(firstUnits / globalMax) : 0;
    const secondNeeded = secondUnits > 0 ? Math.ceil(secondUnits / globalMax) : 0;
    const needed = Math.max(firstNeeded, secondNeeded);

    for (let i = 0; i < needed; i++) {
      const lvl = String(lastLevelNum + (i + 1) * 100);
      if (!virtualLevelSems[lvl]) virtualLevelSems[lvl] = new Set();
      if (byFirst.length > 0) virtualLevelSems[lvl].add('First Semester');
      if (bySecond.length > 0) virtualLevelSems[lvl].add('Second Semester');
    }
  }

  // 3. Add all virtual levels to effective courseData
  for (const [lvl, sems] of Object.entries(virtualLevelSems)) {
    if (!effective[lvl]) {
      effective[lvl] = { session: 'Carryover', semesters: {} };
    }
    for (const sem of sems) {
      if (!effective[lvl].semesters[sem]) {
        effective[lvl].semesters[sem] = [];
      }
    }
  }

  return effective;
}
