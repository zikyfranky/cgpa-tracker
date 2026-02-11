// Course from courses.json
export interface Course {
  code: string;
  title: string;
  units: number;
}

// Grade definition
export interface GradeInfo {
  grade: string;
  desc: string;
  min: number;
  max: number;
  points: number;
}

// Degree classification
export interface Classification {
  label: string;
  short: string;
  min: number;
  max: number;
  color: string;
}

// Stored grade data for a course
export interface GradeEntry {
  ca?: number;
  exam?: number;
  grade?: string;
}

// Semester GPA result
export interface SemesterResult {
  gpa: number;
  totalQP: number;
  totalUnits: number;
  allFilled: boolean;
  hasAny: boolean;
}

// Cumulative GPA result
export interface CGPAResult {
  cgpa: number;
  totalQP: number;
  totalUnits: number;
  hasAny: boolean;
}

// Session GPA result (same shape as CGPA but for one level)
export interface SessionResult {
  gpa: number;
  totalQP: number;
  totalUnits: number;
  hasAny: boolean;
}

// Course data config per level
export interface LevelData {
  session: string;
  semesters: Record<string, Course[]>;
}

// Full course data map
export type CourseDataMap = Record<string, LevelData>;

// Semester max units map
export type SemesterMaxMap = Record<string, number>;

// Carryover info (for pending/added C/Os)
export interface CarryoverInfo {
  code: string;
  title: string;
  units: number;
  origLevel: string;
  origSem: string;
  coKey: string;
}

// Pending carryover (with fit info)
export interface PendingCarryover extends CarryoverInfo {
  fits: boolean;
}

// Added carryover for a semester
export interface AddedCarryover extends CarryoverInfo {}

// Graded course (for insights)
export interface GradedCourse extends Course {
  level: string;
  sem: string;
  grade: string;
  points: number;
  desc: string;
}

// Upcoming unfilled course
export interface UpcomingCourse extends Course {
  level: string;
  sem: string;
}

// Suggested scores
export interface SuggestedScores {
  ca: number;
  exam: number;
  total: number;
}

// App state
export interface AppState {
  activeTab: string;
  inputMode: 'scores' | 'grade';
  currentLevel: string;
  currentSemester: string;
  upcomingFilter: string;
  grades: Record<string, GradeEntry>;
  carryovers: Record<string, string>;
}
