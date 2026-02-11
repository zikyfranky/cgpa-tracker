import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/server/jwt';
import { query } from '@/lib/server/db';

interface Level {
  id: number;
  levelNumber: number;
  sessionName: string;
  semesters: Semester[];
}

interface Semester {
  id: number;
  semesterName: string;
  maxUnits: number;
  courses: Course[];
}

interface Course {
  id: number;
  code: string;
  title: string;
  units: number;
  sortOrder: number;
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    // Get all levels
    const levels = await query<any[]>(
      'SELECT id, level_number, session_name FROM levels ORDER BY sort_order, level_number'
    );

    // Get all semesters
    const semesters = await query<any[]>(
      'SELECT id, level_id, semester_name, max_units FROM semesters ORDER BY level_id, id'
    );

    // Get all courses
    const courses = await query<any[]>(
      'SELECT id, semester_id, code, title, units, sort_order FROM courses ORDER BY semester_id, sort_order'
    );

    // Build response structure
    const levelData: Level[] = levels.map((level) => {
      const levelSemesters: Semester[] = semesters
        .filter((sem) => sem.level_id === level.id)
        .map((sem) => ({
          id: sem.id,
          semesterName: sem.semester_name,
          maxUnits: sem.max_units,
          courses: courses
            .filter((c) => c.semester_id === sem.id)
            .map((c) => ({
              id: c.id,
              code: c.code,
              title: c.title,
              units: c.units,
              sortOrder: c.sort_order,
            })),
        }));

      return {
        id: level.id,
        levelNumber: level.level_number,
        sessionName: level.session_name,
        semesters: levelSemesters,
      };
    });

    return NextResponse.json({ levels: levelData });
  } catch (err: any) {
    console.error('Fetch admin courses error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { semesterId, code, title, units } = await req.json();

    if (!semesterId || !code || !title || units === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: semesterId, code, title, units' },
        { status: 400 }
      );
    }

    // Get the highest sort order for this semester
    const maxSort = await query<any[]>(
      'SELECT MAX(sort_order) as max_sort FROM courses WHERE semester_id = ?',
      [semesterId]
    );
    const nextSortOrder = (maxSort[0]?.max_sort || 0) + 1;

    // Insert the new course
    const result = await query<any>(
      `INSERT INTO courses (semester_id, code, title, units, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [semesterId, code, title, units, nextSortOrder]
    );

    // Return the created course
    const courseId = (result as any).insertId;
    return NextResponse.json(
      {
        id: courseId,
        code,
        title,
        units,
        sortOrder: nextSortOrder,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Create course error:', err);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { courseId, code, title, units } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const params: any[] = [];

    if (code !== undefined) {
      updates.push('code = ?');
      params.push(code);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (units !== undefined) {
      updates.push('units = ?');
      params.push(units);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    params.push(courseId);

    await query(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return NextResponse.json({ success: true, courseId });
  } catch (err: any) {
    console.error('Update course error:', err);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing courseId' },
        { status: 400 }
      );
    }

    await query('DELETE FROM courses WHERE id = ?', [courseId]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete course error:', err);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}
