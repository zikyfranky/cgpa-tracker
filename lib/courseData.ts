import { CourseDataMap, SemesterMaxMap } from './types';
import coursesJson from '../public/courses.json';

let COURSE_DATA: CourseDataMap = {};
let SEMESTER_MAX: SemesterMaxMap = {};
let GLOBAL_MAX_UNITS = 24;
let GLOBAL_MIN_UNITS = 16;

// Parse courses.json at module load time
function initCourseData() {
  const config = coursesJson as any;
  GLOBAL_MAX_UNITS = config.globalMaxUnits || 24;
  GLOBAL_MIN_UNITS = config.globalMinUnits || 16;
  COURSE_DATA = {};
  SEMESTER_MAX = {};

  for (const [level, data] of Object.entries(config.levels) as [string, any][]) {
    COURSE_DATA[level] = { session: data.session, semesters: {} };
    for (const [sem, semData] of Object.entries(data.semesters) as [string, any][]) {
      COURSE_DATA[level].semesters[sem] = semData.courses;
      SEMESTER_MAX[level + '|' + sem] = semData.maxUnits || GLOBAL_MAX_UNITS;
    }
  }
}

initCourseData();

export function getCourseData(): CourseDataMap {
  return COURSE_DATA;
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
