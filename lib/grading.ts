import { GradeInfo, Classification, SuggestedScores } from './types';
import { GRADES, CLASSIFICATIONS } from './constants';

export function getGradeFromScore(total: number | null | undefined): GradeInfo | null {
  if (total === null || total === undefined || isNaN(total)) return null;
  for (const g of GRADES) {
    if (total >= g.min && total <= g.max) return g;
  }
  return GRADES[5]; // F
}

export function getGradeByLetter(letter: string): GradeInfo | null {
  return GRADES.find(g => g.grade === letter) || null;
}

export function getClassification(cgpa: number): Classification {
  for (const c of CLASSIFICATIONS) {
    if (cgpa >= c.min && cgpa <= c.max) return c;
  }
  return CLASSIFICATIONS[5]; // Fail
}

export function suggestScores(grade: string): SuggestedScores | null {
  const g = getGradeByLetter(grade);
  if (!g) return null;
  const mid = Math.round((g.min + g.max) / 2);
  const ca = Math.min(30, Math.round(mid * 0.3));
  const exam = mid - ca;
  return { ca, exam, total: mid };
}
