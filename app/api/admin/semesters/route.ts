import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server/jwt';
import { query } from '@/lib/server/db';

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { semesterId, maxUnits } = await req.json();

    if (!semesterId || maxUnits === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: semesterId, maxUnits' },
        { status: 400 }
      );
    }

    const parsed = parseInt(maxUnits);
    if (isNaN(parsed) || parsed < 1 || parsed > 50) {
      return NextResponse.json(
        { error: 'Max units must be between 1 and 50' },
        { status: 400 }
      );
    }

    await query(
      'UPDATE semesters SET max_units = ? WHERE id = ?',
      [parsed, semesterId]
    );

    return NextResponse.json({ success: true, semesterId, maxUnits: parsed });
  } catch (err: any) {
    console.error('Update semester error:', err);
    return NextResponse.json(
      { error: 'Failed to update semester' },
      { status: 500 }
    );
  }
}
