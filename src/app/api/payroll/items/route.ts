import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const periodId = req.nextUrl.searchParams.get('periodId');
    const employeeId = req.nextUrl.searchParams.get('employeeId');

    let query = `
      SELECT 
        pi.*,
        p.month,
        p.year,
        p.working_days,
        p.is_locked,
        e.nik,
        e.full_name,
        e.avatar_url,
        e.daily_meal_allowance,
        e.daily_transport_allowance,
        d.name as department_name,
        pos.title as position_title
      FROM payroll_items pi
      JOIN payroll_periods p ON pi.period_id = p.id
      JOIN employees e ON pi.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions pos ON e.position_id = pos.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (periodId) {
      query += ` AND pi.period_id = ?`;
      params.push(periodId);
    }

    if (employeeId) {
      query += ` AND pi.employee_id = ?`;
      params.push(employeeId);
    }

    query += ` ORDER BY e.id ASC`;

    const items = db.prepare(query).all(...params);

    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
