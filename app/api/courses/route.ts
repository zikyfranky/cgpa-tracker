import { NextResponse } from 'next/server';
import { query } from '@/lib/server/db';

export async function GET() {
  try {
    // Get global settings
    const settings = await query<any[]>('SELECT setting_key, setting_value FROM settings');
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.setting_key] = s.setting_value;

    const globalMaxUnits = parseInt(settingsMap.globalMaxUnits || '24');
    const globalMinUnits = parseInt(settingsMap.globalMinUnits || '16');

    // Get levels with semesters and courses
    const levels = await query<any[]>('SELECT * FROM levels ORDER BY sort_order, level_number');
    const semesters = await query<any[]>('SELECT s.*, l.level_number FROM semesters s JOIN levels l ON s.level_id = l.id ORDER BY l.sort_order, s.semester_name');
    const courses = await query<any[]>('SELECT c.*, s.id as semester_id FROM courses c JOIN semesters s ON c.semester_id = s.id ORDER BY c.sort_order, c.code');

    // Build the courseData structure matching what the frontend expects
    const courseData: Record<string, any> = {};

    for (const level of levels) {
      const lvlKey = String(level.level_number);
      courseData[lvlKey] = { session: level.session_name, semesters: {} };
    }

    // Build semester max map
    const semesterMaxMap: Record<string, number> = {};
    const semIdToInfo: Record<number, { levelNumber: number; semName: string }> = {};

    for (const sem of semesters) {
      const lvlKey = String(sem.level_number);
      if (courseData[lvlKey]) {
        courseData[lvlKey].semesters[sem.semester_name] = [];
        semesterMaxMap[`${lvlKey}|${sem.semester_name}`] = sem.max_units;
        semIdToInfo[sem.id] = { levelNumber: sem.level_number, semName: sem.semester_name };
      }
    }

    // Add courses to their semesters
    for (const course of courses) {
      const info = semIdToInfo[course.semester_id];
      if (info) {
        const lvlKey = String(info.levelNumber);
        if (courseData[lvlKey]?.semesters[info.semName]) {
          courseData[lvlKey].semesters[info.semName].push({
            code: course.code,
            title: course.title,
            units: course.units,
          });
        }
      }
    }

    return NextResponse.json({
      globalMaxUnits,
      globalMinUnits,
      levels: courseData,
      semesterMax: semesterMaxMap,
    });
  } catch (err: any) {
    console.error('Courses fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
