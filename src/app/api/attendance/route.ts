import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const date = req.nextUrl.searchParams.get('date');
    const employeeId = req.nextUrl.searchParams.get('employeeId');
    const month = req.nextUrl.searchParams.get('month');
    const year = req.nextUrl.searchParams.get('year');

    let query = `
      SELECT 
        a.*,
        e.full_name as employee_name,
        e.nik,
        e.avatar_url,
        d.name as department_name,
        p.title as position_title
      FROM attendances a
      JOIN employees e ON a.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    } else if (month && year) {
      query += ` AND strftime('%m', a.date) = ? AND strftime('%Y', a.date) = ?`;
      params.push(String(month).padStart(2, '0'), String(year));
    } else if (!employeeId) {
      // Default to today if no date and no employeeId is specified
      const today = new Date().toISOString().split('T')[0];
      query += ` AND a.date = ?`;
      params.push(today);
    }

    if (employeeId) {
      query += ` AND a.employee_id = ?`;
      params.push(employeeId);
    }

    query += ` ORDER BY a.date DESC, a.clock_in DESC, e.full_name ASC`;

    const attendances = db.prepare(query).all(...params);

    // Summary counts
    const summary = {
      total: attendances.length,
      onTime: attendances.filter((a: any) => a.status === 'on_time').length,
      late: attendances.filter((a: any) => a.status === 'late').length,
      earlyLeave: attendances.filter((a: any) => a.status === 'early_leave').length,
      absent: attendances.filter((a: any) => a.status === 'absent').length,
    };

    return NextResponse.json({ date: date || null, summary, attendances });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
