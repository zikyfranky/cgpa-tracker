import { GradeEntry, SemesterResult, CGPAResult, SessionResult, CourseDataMap, Course } from './types';
import { getGradeFromScore, getGradeByLetter } from './grading';
import { getAddedCOsForSem, getCoGrade, getAddedCOUnits } from './carryovers';

// Get storage key for a course
export function getKey(level: string, sem: string, code: string): string {
  return `${level}-${sem}-${code}`;
}

// Get grade result for a regular course
export function getCourseGrade(
  level: string,
  sem: string,
  code: string,
  grades: Record<string, GradeEntry>
): ReturnType<typeof getGradeFromScore> {
  const key = getKey(level, sem, code);
  const data = grades[key];
  if (!data) return null;
  const ca = data.ca !== undefined ? parseFloat(String(data.ca)) : NaN;
  const exam = data.exam !== undefined ? parseFloat(String(data.exam)) : NaN;
  if (!isNaN(ca) && !isNaN(exam)) return getGradeFromScore(ca + exam);
  if (data.grade) return getGradeByLetter(data.grade);
  return null;
}

// Get total score for a course
export function getCourseTotal(
  level: string,
  sem: string,
  code: string,
  grades: Record<string, GradeEntry>
): number | null {
  const key = getKey(level, sem, code);
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

// Calculate GPA for a single semester
export function calcSemesterGPA(
  level: string,
  sem: string,
  courseData: CourseDataMap,
  grades: Record<string, GradeEntry>,
  carryovers: Record<string, string>
): SemesterResult {
  const courses = courseData[level].semesters[sem];
  let totalQP = 0;
  let totalUnits = 0;
  let allFilled = true;

  for (const c of courses) {
    const g = getCourseGrade(level, sem, c.code, grades);
    if (g) {
      totalQP += g.points * c.units;
      totalUnits += c.units;
    } else {
      allFilled = false;
    }
  }

  // Include added carryover courses targeting this semester
  const addedCOs = getAddedCOsForSem(level, sem, carryovers, courseData);
  for (const co of addedCOs) {
    const g = getCoGrade(level, sem, co.code, grades);
    if (g) {
      totalQP += g.points * co.units;
      totalUnits += co.units;
    } else {
      allFilled = false;
    }
  }

  if (totalUnits === 0) return { gpa: 0, totalQP, totalUnits, allFilled: false, hasAny: false };
  return { gpa: totalQP / totalUnits, totalQP, totalUnits, allFilled, hasAny: true };
}

// Calculate cumulative GPA across all levels
export function calcCGPA(
  courseData: CourseDataMap,
  grades: Record<string, GradeEntry>,
  carryovers: Record<string, string>
): CGPAResult {
  let totalQP = 0;
  let totalUnits = 0;
  let hasAny = false;

  for (const level of Object.keys(courseData)) {
    for (const sem of Object.keys(courseData[level].semesters)) {
      const result = calcSemesterGPA(level, sem, courseData, grades, carryovers);
      totalQP += result.totalQP;
      totalUnits += result.totalUnits;
      if (result.hasAny) hasAny = true;
    }
  }

  if (totalUnits === 0) return { cgpa: 0, totalQP, totalUnits, hasAny: false };
  return { cgpa: totalQP / totalUnits, totalQP, totalUnits, hasAny };
}

// Calculate session GPA for a single level
export function calcSessionGPA(
  level: string,
  courseData: CourseDataMap,
  grades: Record<string, GradeEntry>,
  carryovers: Record<string, string>
): SessionResult {
  const data = courseData[level];
  let totalQP = 0;
  let totalUnits = 0;
  let hasAny = false;

  for (const sem of Object.keys(data.semesters)) {
    const result = calcSemesterGPA(level, sem, courseData, grades, carryovers);
    totalQP += result.totalQP;
    totalUnits += result.totalUnits;
    if (result.hasAny) hasAny = true;
  }

  if (totalUnits === 0) return { gpa: 0, totalQP, totalUnits, hasAny: false };
  return { gpa: totalQP / totalUnits, totalQP, totalUnits, hasAny };
}

// Count filled vs total courses
export function countFilledCourses(
  courseData: CourseDataMap,
  grades: Record<string, GradeEntry>,
  carryovers: Record<string, string>
): { filled: number; total: number } {
  let filled = 0;
  let total = 0;

  for (const level of Object.keys(courseData)) {
    for (const sem of Object.keys(courseData[level].semesters)) {
      for (const c of courseData[level].semesters[sem]) {
        total++;
        if (getCourseGrade(level, sem, c.code, grades)) filled++;
      }
      const addedCOs = getAddedCOsForSem(level, sem, carryovers, courseData);
      for (const co of addedCOs) {
        total++;
        if (getCoGrade(level, sem, co.code, grades)) filled++;
      }
    }
  }

  return { filled, total };
}

// Get total credit units across all levels
export function getTotalCredits(
  courseData: CourseDataMap,
  carryovers: Record<string, string>
): number {
  let total = 0;
  for (const level of Object.keys(courseData)) {
    for (const sem of Object.keys(courseData[level].semesters)) {
      for (const c of courseData[level].semesters[sem]) {
        total += c.units;
      }
      total += getAddedCOUnits(level, sem, carryovers, courseData);
    }
  }
  return total;
}

// Returns ordering index for a level+semester (lower = earlier)
export function semIndex(level: string, sem: string): number {
  const l = parseInt(level);
  const s = sem === 'First Semester' ? 0 : 1;
  return l * 10 + s;
}

// Is this semester at or after the current position?
export function isUpcoming(level: string, sem: string, currentLevel: string, currentSemester: string): boolean {
  return semIndex(level, sem) >= semIndex(currentLevel, currentSemester);
}

// Is this semester strictly in the future (after current)?
export function isFuture(level: string, sem: string, currentLevel: string, currentSemester: string): boolean {
  return semIndex(level, sem) > semIndex(currentLevel, currentSemester);
}

// Check if a course passes the upcoming filter
export function passesUpcomingFilter(level: string, sem: string, upcomingFilter: string): boolean {
  if (upcomingFilter === 'all') return true;
  if (upcomingFilter.includes('|')) {
    const [fLvl, fSem] = upcomingFilter.split('|');
    return level === fLvl && sem === fSem;
  }
  return level === upcomingFilter;
}
