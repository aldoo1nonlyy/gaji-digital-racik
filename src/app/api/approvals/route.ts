import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const type = req.nextUrl.searchParams.get('type'); // all, leave, overtime, correction
    const status = req.nextUrl.searchParams.get('status') || 'pending'; // pending, approved, rejected, all
    const departmentId = req.nextUrl.searchParams.get('departmentId');
    const search = req.nextUrl.searchParams.get('search');

    // 1. Fetch Pending Counts
    const leaveCount = db.prepare(`SELECT COUNT(*) as count FROM leave_requests WHERE status = 'pending'`).get() as { count: number };
    const otCount = db.prepare(`SELECT COUNT(*) as count FROM overtime_requests WHERE status = 'pending'`).get() as { count: number };
    const corrCount = db.prepare(`SELECT COUNT(*) as count FROM attendance_corrections WHERE status = 'pending'`).get() as { count: number };

    const counts = {
      pendingLeaves: leaveCount?.count || 0,
      pendingOvertime: otCount?.count || 0,
      pendingCorrections: corrCount?.count || 0,
      totalPending: (leaveCount?.count || 0) + (otCount?.count || 0) + (corrCount?.count || 0),
    };

    // 2. Query Leaves
    let leavesQuery = `
      SELECT 
        l.id, 'leave' as request_type, l.leave_type, l.start_date, l.end_date, l.total_days,
        l.reason, l.attachment_url, l.status, l.approver_id, l.approval_notes, l.created_at,
        e.id as employee_id, e.nik, e.full_name as employee_name, e.avatar_url,
        d.id as department_id, d.name as department_name, p.title as position_title,
        approver.full_name as approver_name
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees approver ON l.approver_id = approver.id
      WHERE 1=1
    `;
    const leaveParams: any[] = [];
    if (status !== 'all') {
      leavesQuery += ` AND l.status = ?`;
      leaveParams.push(status);
    }
    if (departmentId) {
      leavesQuery += ` AND e.department_id = ?`;
      leaveParams.push(departmentId);
    }
    if (search) {
      leavesQuery += ` AND (e.full_name LIKE ? OR e.nik LIKE ? OR l.reason LIKE ?)`;
      const s = `%${search}%`;
      leaveParams.push(s, s, s);
    }
    leavesQuery += ` ORDER BY l.id DESC`;
    const leaves = db.prepare(leavesQuery).all(...leaveParams);

    // 3. Query Overtime
    let otQuery = `
      SELECT 
        ot.id, 'overtime' as request_type, ot.date, ot.start_time, ot.end_time, ot.duration_hours,
        ot.calculated_amount, ot.notes as reason, ot.status, ot.approver_id, ot.approval_notes, ot.created_at,
        e.id as employee_id, e.nik, e.full_name as employee_name, e.avatar_url,
        d.id as department_id, d.name as department_name, p.title as position_title,
        approver.full_name as approver_name
      FROM overtime_requests ot
      JOIN employees e ON ot.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees approver ON ot.approver_id = approver.id
      WHERE 1=1
    `;
    const otParams: any[] = [];
    if (status !== 'all') {
      otQuery += ` AND ot.status = ?`;
      otParams.push(status);
    }
    if (departmentId) {
      otQuery += ` AND e.department_id = ?`;
      otParams.push(departmentId);
    }
    if (search) {
      otQuery += ` AND (e.full_name LIKE ? OR e.nik LIKE ? OR ot.notes LIKE ?)`;
      const s = `%${search}%`;
      otParams.push(s, s, s);
    }
    otQuery += ` ORDER BY ot.id DESC`;
    const overtimes = db.prepare(otQuery).all(...otParams);

    // 4. Query Attendance Corrections
    let corrQuery = `
      SELECT 
        ac.id, 'correction' as request_type, ac.date, ac.correction_type,
        ac.requested_clock_in, ac.requested_clock_out,
        ac.original_clock_in, ac.original_clock_out, ac.original_status,
        ac.reason, ac.attachment_url, ac.status, ac.approver_id, ac.approval_notes, ac.created_at,
        e.id as employee_id, e.nik, e.full_name as employee_name, e.avatar_url,
        d.id as department_id, d.name as department_name, p.title as position_title,
        approver.full_name as approver_name
      FROM attendance_corrections ac
      JOIN employees e ON ac.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees approver ON ac.approver_id = approver.id
      WHERE 1=1
    `;
    const corrParams: any[] = [];
    if (status !== 'all') {
      corrQuery += ` AND ac.status = ?`;
      corrParams.push(status);
    }
    if (departmentId) {
      corrQuery += ` AND e.department_id = ?`;
      corrParams.push(departmentId);
    }
    if (search) {
      corrQuery += ` AND (e.full_name LIKE ? OR e.nik LIKE ? OR ac.reason LIKE ?)`;
      const s = `%${search}%`;
      corrParams.push(s, s, s);
    }
    corrQuery += ` ORDER BY ac.id DESC`;
    const corrections = db.prepare(corrQuery).all(...corrParams);

    return NextResponse.json({
      counts,
      leaves: type === 'all' || type === 'leave' || !type ? leaves : [],
      overtimes: type === 'all' || type === 'overtime' || !type ? overtimes : [],
      corrections: type === 'all' || type === 'correction' || !type ? corrections : [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
