import { GradeInfo, Classification } from './types';

// FUTMinna 5-Point Grading System (2024/2025 Student Handbook, p.81)
export const GRADES: GradeInfo[] = [
  { grade: 'A', desc: 'Excellent',  min: 70, max: 100, points: 5 },
  { grade: 'B', desc: 'Very Good',  min: 60, max: 69,  points: 4 },
  { grade: 'C', desc: 'Good',       min: 50, max: 59,  points: 3 },
  { grade: 'D', desc: 'Fair',       min: 45, max: 49,  points: 2 },
  { grade: 'E', desc: 'Poor',       min: 40, max: 44,  points: 1 },
  { grade: 'F', desc: 'Fail',       min: 0,  max: 39,  points: 0 },
];

// Degree Classification (2024/2025 Student Handbook, p.84)
export const CLASSIFICATIONS: Classification[] = [
  { label: "First Class Honours",                    short: "1st Class",  min: 4.50, max: 5.00, color: "#00b894" },
  { label: "Second Class Honours (Upper Division)",  short: "2:1",        min: 3.50, max: 4.49, color: "#00cec9" },
  { label: "Second Class Honours (Lower Division)",  short: "2:2",        min: 2.40, max: 3.49, color: "#fdcb6e" },
  { label: "Third Class Honours",                    short: "3rd Class",  min: 1.50, max: 2.39, color: "#e17055" },
  { label: "Pass",                                   short: "Pass",       min: 1.00, max: 1.49, color: "#d63031" },
  { label: "Fail",                                   short: "Fail",       min: 0,    max: 0.99, color: "#636e72" },
];

// Honours lists (2024/2025 Student Handbook, p.84)
export const VC_LIST_MIN = 4.50;   // Vice Chancellor's List
export const DEANS_LIST_MIN = 4.00; // Dean's List (per session)

// Department display names
export const DEPT_NAMES: Record<string, string> = {
  GPH: 'Geophysics', PHY: 'Physics', CHM: 'Chemistry', MTH: 'Mathematics',
  GST: 'General Studies', GEY: 'Geology', COS: 'Computer Science', ENT: 'Entrepreneurship',
};

// Improvement tips per department
export const DEPT_TIPS: Record<string, string> = {
  PHY: 'Focus on understanding core formulas and doing more practice problems. Physics practicals are easy marks — aim for full scores there.',
  CHM: 'Revise reaction mechanisms and practice balancing equations. Lab work is your friend for easy marks.',
  MTH: 'Mathematics is cumulative — revisit fundamentals you missed earlier. Practice past questions consistently.',
  GPH: 'This is your core department. Prioritise geophysics courses heavily — they carry the most weight on your transcript. Form study groups and consult lecturers.',
  GEY: 'Geology benefits from visual learning — use diagrams, field notes, and maps. Attend field trips and practicals.',
  GST: 'General studies are usually the easiest to score high in. Read the recommended texts and attend lectures consistently.',
  COS: 'Practice coding regularly and work through examples. Computing is hands-on — the more you practice, the better.',
  ENT: 'Entrepreneurship courses favour real-world examples. Focus on business plan writing and case studies.',
};

export const DEFAULT_TIP = 'Review past questions and focus on understanding core concepts rather than rote memorisation.';

// Storage keys
export const STATE_STORAGE_KEY = 'cgpa_tracker_isaac_futminna';
export const AUTH_STORAGE_KEY = 'cgpa_tracker_auth_hash';
