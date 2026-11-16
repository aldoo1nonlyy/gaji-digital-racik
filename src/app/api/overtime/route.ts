import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateOvertimePay } from '@/lib/payroll-engine';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const status = req.nextUrl.searchParams.get('status');
    const employeeId = req.nextUrl.searchParams.get('employeeId');

    let query = `
      SELECT 
        ot.*,
        e.full_name as employee_name,
        e.nik,
        e.avatar_url,
        e.basic_salary,
        e.fixed_allowance,
        d.name as department_name,
        p.title as position_title,
        approver.full_name as approver_name
      FROM overtime_requests ot
      JOIN employees e ON ot.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees approver ON ot.approver_id = approver.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND ot.status = ?`;
      params.push(status);
    }

    if (employeeId) {
      query += ` AND ot.employee_id = ?`;
      params.push(employeeId);
    }

    query += ` ORDER BY ot.created_at DESC`;

    const overtimeList = db.prepare(query).all(...params);

    return NextResponse.json({ overtimeList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { employeeId, date, startTime, endTime, durationHours, notes } = body;

    if (!employeeId || !date || !startTime || !endTime || !durationHours) {
      return NextResponse.json({ error: 'Mohon lengkapi formulir pengajuan lembur' }, { status: 400 });
    }

    // Get employee basic & fixed allowance to compute Kemenaker overtime pay
    const emp = db.prepare('SELECT basic_salary, fixed_allowance FROM employees WHERE id = ?').get(employeeId) as any;
    if (!emp) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    const calculatedAmount = calculateOvertimePay(emp.basic_salary, emp.fixed_allowance, Number(durationHours));

    const stmt = db.prepare(`
      INSERT INTO overtime_requests (
        employee_id, date, start_time, end_time, duration_hours, notes, calculated_amount, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(employeeId, date, startTime, endTime, Number(durationHours), notes || '', calculatedAmount);

    return NextResponse.json({
      success: true,
      message: 'Pengajuan lembur berhasil dikirim.',
      calculatedAmount,
      overtimeId: result.lastInsertRowid,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

