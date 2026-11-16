import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const status = req.nextUrl.searchParams.get('status');
    const employeeId = req.nextUrl.searchParams.get('employeeId');

    let query = `
      SELECT 
        lr.*,
        e.full_name as employee_name,
        e.nik,
        e.avatar_url,
        e.annual_leave_quota,
        e.annual_leave_used,
        d.name as department_name,
        p.title as position_title,
        approver.full_name as approver_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees approver ON lr.approver_id = approver.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND lr.status = ?`;
      params.push(status);
    }

    if (employeeId) {
      query += ` AND lr.employee_id = ?`;
      params.push(employeeId);
    }

    query += ` ORDER BY lr.created_at DESC`;

    const leaves = db.prepare(query).all(...params);

    return NextResponse.json({ leaves });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { employeeId, leaveType, startDate, endDate, totalDays, reason, attachmentUrl } = body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Mohon lengkapi semua isian formulir cuti/izin' }, { status: 400 });
    }

    // Check quota for annual leave
    if (leaveType === 'tahunan') {
      const emp = db.prepare('SELECT annual_leave_quota, annual_leave_used FROM employees WHERE id = ?').get(employeeId) as any;
      if (emp) {
        const remaining = emp.annual_leave_quota - emp.annual_leave_used;
        if (totalDays > remaining) {
          return NextResponse.json({
            error: `Sisa kuota cuti tahunan tidak mencukupi. Sisa kuota Anda: ${remaining} hari, diajukan: ${totalDays} hari.`
          }, { status: 400 });
        }
      }
    }

    const stmt = db.prepare(`
      INSERT INTO leave_requests (
        employee_id, leave_type, start_date, end_date, total_days, reason, attachment_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(employeeId, leaveType, startDate, endDate, Number(totalDays) || 1, reason, attachmentUrl || null);

    return NextResponse.json({
      success: true,
      message: 'Pengajuan cuti/izin berhasil dikirim dan menunggu persetujuan atasan.',
      leaveId: result.lastInsertRowid,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

