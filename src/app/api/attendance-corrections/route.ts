import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentSessionUser, logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const status = req.nextUrl.searchParams.get('status');
    const employeeId = req.nextUrl.searchParams.get('employeeId');

    let query = `
      SELECT 
        ac.*,
        e.full_name as employee_name,
        e.nik,
        e.avatar_url,
        d.name as department_name,
        p.title as position_title,
        approver.full_name as approver_name
      FROM attendance_corrections ac
      JOIN employees e ON ac.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees approver ON ac.approver_id = approver.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'all') {
      query += ` AND ac.status = ?`;
      params.push(status);
    }

    if (employeeId) {
      query += ` AND ac.employee_id = ?`;
      params.push(employeeId);
    }

    query += ` ORDER BY ac.created_at DESC`;

    const corrections = db.prepare(query).all(...params);

    return NextResponse.json({ corrections });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const {
      employeeId,
      date,
      correctionType = 'clock_in_out',
      requestedClockIn,
      requestedClockOut,
      reason,
      attachmentUrl,
    } = body;

    if (!employeeId || !date || !reason) {
      return NextResponse.json({ error: 'Mohon lengkapi karyawan, tanggal, dan alasan koreksi absen' }, { status: 400 });
    }

    // Check existing attendance on this date (if any)
    const existingAtt = db.prepare('SELECT * FROM attendances WHERE employee_id = ? AND date = ?').get(employeeId, date) as any;

    const stmt = db.prepare(`
      INSERT INTO attendance_corrections (
        employee_id, attendance_id, date, correction_type,
        requested_clock_in, requested_clock_out,
        original_clock_in, original_clock_out, original_status,
        reason, attachment_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `);

    const result = stmt.run(
      employeeId,
      existingAtt ? existingAtt.id : null,
      date,
      correctionType,
      requestedClockIn || null,
      requestedClockOut || null,
      existingAtt ? existingAtt.clock_in : null,
      existingAtt ? existingAtt.clock_out : null,
      existingAtt ? existingAtt.status : 'absent',
      reason,
      attachmentUrl || null
    );

    const sessionUser = getCurrentSessionUser(req, db);
    const emp = db.prepare('SELECT full_name FROM employees WHERE id = ?').get(employeeId) as any;

    // Log in audit trail
    logAudit(db, {
      userId: sessionUser.user_id,
      userName: sessionUser.full_name,
      userRole: sessionUser.role,
      action: 'REQUEST_ATTENDANCE_CORRECTION',
      entityType: 'attendance_correction',
      entityId: Number(result.lastInsertRowid),
      newValues: {
        employee_id: employeeId,
        date,
        requestedClockIn,
        requestedClockOut,
        reason,
      },
      notes: `Pengajuan koreksi presensi tanggal ${date} untuk ${emp?.full_name || 'karyawan'}: ${reason}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Pengajuan koreksi absensi berhasil diajukan dan menunggu persetujuan atasan/HR.',
      correctionId: result.lastInsertRowid,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
