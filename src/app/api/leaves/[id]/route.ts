import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentSessionUser, logAudit } from '@/lib/audit';
import { syncEmployeePayrollForDate } from '@/lib/payroll-sync';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const leaveId = params.id;
    const body = await req.json();
    const { status, approverId, approvalNotes } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status harus approved atau rejected' }, { status: 400 });
    }

    const leave = db.prepare(`
      SELECT l.*, e.full_name as employee_name, e.nik
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      WHERE l.id = ?
    `).get(leaveId) as any;

    if (!leave) {
      return NextResponse.json({ error: 'Data pengajuan cuti tidak ditemukan' }, { status: 404 });
    }

    const sessionUser = getCurrentSessionUser(req, db);
    const finalApproverId = approverId || sessionUser.employee_id || 1;

    // Update leave request
    db.prepare(`
      UPDATE leave_requests SET
        status = ?, approver_id = ?, approval_notes = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(status, finalApproverId, approvalNotes || '', leaveId);

    // If approved and type is tahunan, increment employee's annual_leave_used
    if (status === 'approved' && leave.leave_type === 'tahunan') {
      db.prepare(`
        UPDATE employees SET
          annual_leave_used = annual_leave_used + ?
        WHERE id = ?
      `).run(leave.total_days, leave.employee_id);
    }

    // Auto-sync into Payroll calculation if approved
    let syncResult = null;
    if (status === 'approved') {
      syncResult = syncEmployeePayrollForDate(
        db,
        leave.employee_id,
        leave.start_date,
        `Persetujuan Cuti (${leave.leave_type.toUpperCase()})`,
        { id: sessionUser.user_id, name: sessionUser.full_name, role: sessionUser.role }
      );
    }

    // Record in Audit Trail
    logAudit(db, {
      userId: sessionUser.user_id,
      userName: sessionUser.full_name,
      userRole: sessionUser.role,
      action: status === 'approved' ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      entityType: 'leave_request',
      entityId: leaveId,
      oldValues: { status: leave.status, approver_id: leave.approver_id },
      newValues: { status, approver_id: finalApproverId, approval_notes: approvalNotes },
      notes: `${status === 'approved' ? 'Menyetujui' : 'Menolak'} pengajuan cuti ${leave.leave_type} (${leave.total_days} hari) karyawan ${leave.employee_name}. Alasan: ${approvalNotes || '-'}`,
    });

    return NextResponse.json({
      success: true,
      message: `Pengajuan cuti karyawan ${leave.employee_name} berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
      syncResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
