import { CourseDataMap, SemesterMaxMap } from './types';

// Module-level state (populated by fetchCourseData)
let COURSE_DATA: CourseDataMap = {};
let SEMESTER_MAX: SemesterMaxMap = {};
let GLOBAL_MAX_UNITS = 24;
let GLOBAL_MIN_UNITS = 16;
let _loaded = false;

// Fetch course data from the API (called once on app load)
export async function fetchCourseData(): Promise<CourseDataMap> {
  try {
    const res = await fetch('/api/courses');
    if (!res.ok) throw new Error('Failed to fetch courses');
    const config = await res.json();

    GLOBAL_MAX_UNITS = config.globalMaxUnits || 24;
    GLOBAL_MIN_UNITS = config.globalMinUnits || 16;
    COURSE_DATA = {};
    SEMESTER_MAX = config.semesterMax || {};

    // The API returns { levels: { "100": { session, semesters: { ... } } } }
    for (const [level, data] of Object.entries(config.levels) as [string, any][]) {
      COURSE_DATA[level] = { session: data.session, semesters: {} };
      for (const [sem, courses] of Object.entries(data.semesters) as [string, any][]) {
        COURSE_DATA[level].semesters[sem] = courses;
      }
    }

    _loaded = true;
    return COURSE_DATA;
  } catch (err) {
    console.error('Failed to load course data from API:', err);
    return COURSE_DATA;
  }
}

export function getCourseData(): CourseDataMap {
  return COURSE_DATA;
}

export function isCourseDataLoaded(): boolean {
  return _loaded;
}

export function getSemesterMax(): SemesterMaxMap {
  return SEMESTER_MAX;
}

export function getGlobalMaxUnits(): number {
  return GLOBAL_MAX_UNITS;
}

export function getGlobalMinUnits(): number {
  return GLOBAL_MIN_UNITS;
}

export function getMaxUnits(level: string, sem: string): number {
  return SEMESTER_MAX[level + '|' + sem] || GLOBAL_MAX_UNITS;
}
