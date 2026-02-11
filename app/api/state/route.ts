import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server/jwt';
import { query } from '@/lib/server/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rows = await query<any[]>('SELECT * FROM user_state WHERE user_id = ?', [user.userId]);
  if (rows.length === 0) {
    return NextResponse.json({
      activeTab: 'overview',
      inputMode: 'scores',
      currentLevel: '100',
      currentSemester: 'First Semester',
      upcomingFilter: 'all',
      grades: {},
      carryovers: {},
    });
  }

  const s = rows[0];
  return NextResponse.json({
    activeTab: s.active_tab || 'overview',
    inputMode: s.input_mode || 'scores',
    currentLevel: s.current_level || '100',
    currentSemester: s.current_semester || 'First Semester',
    upcomingFilter: s.upcoming_filter || 'all',
    grades: typeof s.grades === 'string' ? JSON.parse(s.grades) : (s.grades || {}),
    carryovers: typeof s.carryovers === 'string' ? JSON.parse(s.carryovers) : (s.carryovers || {}),
  });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { activeTab, inputMode, currentLevel, currentSemester, upcomingFilter, grades, carryovers } = body;

  await query(
    `INSERT INTO user_state (user_id, active_tab, input_mode, current_level, current_semester, upcoming_filter, grades, carryovers)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       active_tab = VALUES(active_tab),
       input_mode = VALUES(input_mode),
       current_level = VALUES(current_level),
       current_semester = VALUES(current_semester),
       upcoming_filter = VALUES(upcoming_filter),
       grades = VALUES(grades),
       carryovers = VALUES(carryovers)`,
    [
      user.userId,
      activeTab || 'overview',
      inputMode || 'scores',
      currentLevel || '100',
      currentSemester || 'First Semester',
      upcomingFilter || 'all',
      JSON.stringify(grades || {}),
      JSON.stringify(carryovers || {}),
    ]
  );

  return NextResponse.json({ success: true });
}
