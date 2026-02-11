import { CourseDataMap, Course, CarryoverInfo, PendingCarryover, AddedCarryover, GradeEntry } from './types';
import { getGradeFromScore, getGradeByLetter } from './grading';
import { getMaxUnits } from './courseData';

// Strip FUTM- prefix and parenthetical suffixes to get base course code
export function getBaseCode(code: string): string {
  return code.replace(/^FUTM-/, '').replace(/\(.*?\)/g, '').trim();
}

// Find a course in COURSE_DATA at a specific level+semester
export function findCourseInData(code: string, level: string, sem: string, courseData: CourseDataMap): Course | null {
  const courses = courseData[level] && courseData[level].semesters[sem];
  if (!courses) return null;
  return courses.find(c => c.code === code) || null;
}

// Check if a course already has a carryover entry in COURSE_DATA at a later level
export function isAlreadyCarriedInData(code: string, origLevel: string, courseData: CourseDataMap): boolean {
  const baseCode = getBaseCode(code);
  const levels = Object.keys(courseData).sort((a, b) => parseInt(a) - parseInt(b));
  const origIdx = levels.indexOf(origLevel);
  for (let i = origIdx + 1; i < levels.length; i++) {
    for (const sem of Object.keys(courseData[levels[i]].semesters)) {
      for (const c of courseData[levels[i]].semesters[sem]) {
        if (getBaseCode(c.code) === baseCode) return true;
      }
    }
  }
  return false;
}

// C/O grade key for grades state
export function coGradeKey(targetLevel: string, targetSem: string, code: string): string {
  return 'CO:' + targetLevel + '-' + targetSem + '-' + code;
}

// Get grade result for an added carryover
export function getCoGrade(
  targetLevel: string,
  targetSem: string,
  code: string,
  grades: Record<string, GradeEntry>
): ReturnType<typeof getGradeFromScore> {
  const key = coGradeKey(targetLevel, targetSem, code);
  const data = grades[key];
  if (!data) return null;
  const ca = data.ca !== undefined ? parseFloat(String(data.ca)) : NaN;
  const exam = data.exam !== undefined ? parseFloat(String(data.exam)) : NaN;
  if (!isNaN(ca) && !isNaN(exam)) return getGradeFromScore(ca + exam);
  if (data.grade) return getGradeByLetter(data.grade);
  return null;
}

// Get total for an added carryover
export function getCoTotal(
  targetLevel: string,
  targetSem: string,
  code: string,
  grades: Record<string, GradeEntry>
): number | null {
  const key = coGradeKey(targetLevel, targetSem, code);
  const data = grades[key];
  if (!data) return null;
  if (data.ca !== undefined && data.exam !== undefined) {
    const ca = parseFloat(String(data.ca));
    const exam = parseFloat(String(data.exam));
    if (isNaN(ca) || isNaN(exam)) return null;
    return ca + exam;
  }
  if (data.grade) {
    const g = getGradeByLetter(data.grade);
    return g ? Math.round((g.min + g.max) / 2) : null;
  }
  return null;
}

// Get registered units from COURSE_DATA for a semester
export function getRegisteredUnits(level: string, sem: string, courseData: CourseDataMap): number {
  if (!courseData[level] || !courseData[level].semesters[sem]) return 0;
  return courseData[level].semesters[sem].reduce((s, c) => s + c.units, 0);
}

// Get units from added carryovers targeting a specific semester
export function getAddedCOUnits(
  level: string,
  sem: string,
  carryovers: Record<string, string>,
  courseData: CourseDataMap
): number {
  let units = 0;
  for (const [coKey, targetVal] of Object.entries(carryovers)) {
    if (targetVal === level + '|' + sem) {
      const [code, origLevel, origSem] = coKey.split('|');
      const origCourse = findCourseInData(code, origLevel, origSem, courseData);
      if (origCourse) units += origCourse.units;
    }
  }
  return units;
}

// Total units for a semester (registered + added C/Os)
export function getTotalSemUnits(
  level: string,
  sem: string,
  carryovers: Record<string, string>,
  courseData: CourseDataMap
): number {
  return getRegisteredUnits(level, sem, courseData) + getAddedCOUnits(level, sem, carryovers, courseData);
}

// Can a course fit in this semester?
export function canFitInSemester(
  level: string,
  sem: string,
  units: number,
  carryovers: Record<string, string>,
  courseData: CourseDataMap
): boolean {
  return getTotalSemUnits(level, sem, carryovers, courseData) + units <= getMaxUnits(level, sem);
}

// Get sorted level keys
export function getSortedLevels(courseData: CourseDataMap): string[] {
  return Object.keys(courseData).sort((a, b) => parseInt(a) - parseInt(b));
}

// Ordering index for a level+semester (lower = earlier)
function semIdx(level: string, sem: string): number {
  return parseInt(level) * 10 + (sem === 'First Semester' ? 0 : 1);
}

// Find the first available slot for a carryover.
// Respects currentLevel/currentSemester: skips semesters the user has already passed.
export function findCarryoverSlot(
  origLevel: string,
  origSem: string,
  courseUnits: number,
  carryovers: Record<string, string>,
  courseData: CourseDataMap,
  currentLevel?: string,
  currentSemester?: string
): { targetLevel: string; targetSem: string; fits: boolean } | null {
  const levels = getSortedLevels(courseData);
  const origIdx = levels.indexOf(origLevel);
  const currentSemIdx = (currentLevel && currentSemester)
    ? semIdx(currentLevel, currentSemester)
    : 0;

  // First pass: find the first slot that is both after origin AND not before current position
  for (let i = origIdx + 1; i < levels.length; i++) {
    const tLvl = levels[i];
    if (!courseData[tLvl].semesters[origSem]) continue;
    // Skip semesters the user has already passed
    if (semIdx(tLvl, origSem) < currentSemIdx) continue;
    if (canFitInSemester(tLvl, origSem, courseUnits, carryovers, courseData)) {
      return { targetLevel: tLvl, targetSem: origSem, fits: true };
    }
  }

  // No room — show at the first eligible level (at or after current) marked as overflow
  for (let i = origIdx + 1; i < levels.length; i++) {
    const tLvl = levels[i];
    if (!courseData[tLvl].semesters[origSem]) continue;
    if (semIdx(tLvl, origSem) < currentSemIdx) continue;
    return { targetLevel: tLvl, targetSem: origSem, fits: false };
  }

  return null;
}

// Clean up carryovers whose original course is no longer F
// Returns new grades & carryovers if changed, or null if no change
export function cleanupCarryovers(
  grades: Record<string, GradeEntry>,
  carryovers: Record<string, string>,
  courseData: CourseDataMap,
  getCourseGradeFn: (level: string, sem: string, code: string, grades: Record<string, GradeEntry>) => any
): { grades: Record<string, GradeEntry>; carryovers: Record<string, string> } | null {
  let changed = false;
  const newGrades = { ...grades };
  const newCarryovers = { ...carryovers };

  for (const coKey of Object.keys(newCarryovers)) {
    const [code, origLevel, origSem] = coKey.split('|');
    const g = getCourseGradeFn(origLevel, origSem, code, newGrades);
    if (!g || g.grade !== 'F') {
      const [tLvl, tSem] = newCarryovers[coKey].split('|');
      delete newGrades[coGradeKey(tLvl, tSem, code)];
      delete newCarryovers[coKey];
      changed = true;
    }
  }

  return changed ? { grades: newGrades, carryovers: newCarryovers } : null;
}

// Get all courses that have F and need carryover
export function getAllFailedForCarryover(
  courseData: CourseDataMap,
  grades: Record<string, GradeEntry>,
  getCourseGradeFn: (level: string, sem: string, code: string, grades: Record<string, GradeEntry>) => any
): CarryoverInfo[] {
  const failed: CarryoverInfo[] = [];
  for (const level of getSortedLevels(courseData)) {
    for (const sem of Object.keys(courseData[level].semesters)) {
      for (const c of courseData[level].semesters[sem]) {
        const g = getCourseGradeFn(level, sem, c.code, grades);
        if (g && g.grade === 'F' && !isAlreadyCarriedInData(c.code, level, courseData)) {
          const coKey = c.code + '|' + level + '|' + sem;
          failed.push({
            code: c.code,
            title: c.title,
            units: c.units,
            origLevel: level,
            origSem: sem,
            coKey,
          });
        }
      }
    }
  }
  return failed;
}

// Get pending carryovers for a given semester.
// A CO shows at EVERY level after its origin (same semester type) until added.
export function getPendingCOsForSem(
  level: string,
  sem: string,
  carryovers: Record<string, string>,
  courseData: CourseDataMap,
  grades: Record<string, GradeEntry>,
  getCourseGradeFn: (level: string, sem: string, code: string, grades: Record<string, GradeEntry>) => any,
  currentLevel?: string,
  currentSemester?: string
): PendingCarryover[] {
  const allFailed = getAllFailedForCarryover(courseData, grades, getCourseGradeFn);
  const pending: PendingCarryover[] = [];
  const levels = getSortedLevels(courseData);
  const thisIdx = levels.indexOf(level);

  for (const f of allFailed) {
    // Already added somewhere? Don't show as pending anywhere
    if (carryovers[f.coKey]) continue;
    // Must be same semester type
    if (f.origSem !== sem) continue;
    // Must be at a level after the origin
    const origIdx = levels.indexOf(f.origLevel);
    if (thisIdx <= origIdx) continue;
    // Check if it fits in this specific level+sem
    const fits = canFitInSemester(level, sem, f.units, carryovers, courseData);
    pending.push({ ...f, fits });
  }
  return pending;
}

// Get added carryovers for a given semester
export function getAddedCOsForSem(
  level: string,
  sem: string,
  carryovers: Record<string, string>,
  courseData: CourseDataMap
): AddedCarryover[] {
  const added: AddedCarryover[] = [];
  for (const [coKey, targetVal] of Object.entries(carryovers)) {
    if (targetVal === level + '|' + sem) {
      const [code, origLevel, origSem] = coKey.split('|');
      const origCourse = findCourseInData(code, origLevel, origSem, courseData);
      if (origCourse) {
        added.push({
          code: origCourse.code,
          title: origCourse.title,
          units: origCourse.units,
          origLevel,
          origSem,
          coKey,
        });
      }
    }
  }
  return added;
}
