import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentSessionUser, logAudit } from '@/lib/audit';
import { syncEmployeePayrollForDate } from '@/lib/payroll-sync';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const overtimeId = params.id;
    const body = await req.json();
    const { status, approverId, approvalNotes } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status harus approved atau rejected' }, { status: 400 });
    }

    const ot = db.prepare(`
      SELECT ot.*, e.full_name as employee_name, e.nik
      FROM overtime_requests ot
      JOIN employees e ON ot.employee_id = e.id
      WHERE ot.id = ?
    `).get(overtimeId) as any;

    if (!ot) {
      return NextResponse.json({ error: 'Data pengajuan lembur tidak ditemukan' }, { status: 404 });
    }

    const sessionUser = getCurrentSessionUser(req, db);
    const finalApproverId = approverId || sessionUser.employee_id || 1;

    db.prepare(`
      UPDATE overtime_requests SET
        status = ?, approver_id = ?, approval_notes = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(status, finalApproverId, approvalNotes || '', overtimeId);

    // Auto-sync into Payroll calculation if approved
    let syncResult = null;
    if (status === 'approved') {
      syncResult = syncEmployeePayrollForDate(
        db,
        ot.employee_id,
        ot.date,
        `Persetujuan Lembur (${ot.duration_hours} jam, Upah Rp ${ot.calculated_amount.toLocaleString('id-ID')})`,
        { id: sessionUser.user_id, name: sessionUser.full_name, role: sessionUser.role }
      );
    }

    // Record in Audit Trail
    logAudit(db, {
      userId: sessionUser.user_id,
      userName: sessionUser.full_name,
      userRole: sessionUser.role,
      action: status === 'approved' ? 'APPROVE_OVERTIME' : 'REJECT_OVERTIME',
      entityType: 'overtime_request',
      entityId: overtimeId,
      oldValues: { status: ot.status, approver_id: ot.approver_id },
      newValues: { status, approver_id: finalApproverId, approval_notes: approvalNotes },
      notes: `${status === 'approved' ? 'Menyetujui' : 'Menolak'} pengajuan lembur (${ot.duration_hours} jam) karyawan ${ot.employee_name}. Alasan: ${approvalNotes || '-'}`,
    });

    return NextResponse.json({
      success: true,
      message: `Pengajuan lembur karyawan ${ot.employee_name} berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}.`,
      syncResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
