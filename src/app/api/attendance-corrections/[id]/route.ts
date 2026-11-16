import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentSessionUser, logAudit } from '@/lib/audit';
import { syncEmployeePayrollForDate } from '@/lib/payroll-sync';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const correctionId = params.id;
    const body = await req.json();
    const { status, approverId, approvalNotes } = body;

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status harus approved atau rejected' }, { status: 400 });
    }

    const corr = db.prepare(`
      SELECT ac.*, e.full_name as employee_name, e.nik
      FROM attendance_corrections ac
      JOIN employees e ON ac.employee_id = e.id
      WHERE ac.id = ?
    `).get(correctionId) as any;

    if (!corr) {
      return NextResponse.json({ error: 'Data pengajuan koreksi tidak ditemukan' }, { status: 404 });
    }

    const sessionUser = getCurrentSessionUser(req, db);
    const finalApproverId = approverId || sessionUser.employee_id || 1;

    // Update correction request record
    db.prepare(`
      UPDATE attendance_corrections SET
        status = ?, approver_id = ?, approval_notes = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(status, finalApproverId, approvalNotes || '', correctionId);

    let syncResult = null;

    if (status === 'approved') {
      // 1. Calculate work hours
      let workHours = 8.0;
      if (corr.requested_clock_in && corr.requested_clock_out) {
        const [inH, inM] = corr.requested_clock_in.split(':').map(Number);
        const [outH, outM] = corr.requested_clock_out.split(':').map(Number);
        const inMins = inH * 60 + inM;
        const outMins = outH * 60 + outM;
        const diffMins = Math.max(0, outMins - inMins - 60); // 1 hour break deducted
        workHours = Math.round((diffMins / 60) * 10) / 10;
      }

      // Check existing attendance on that date
      const existingAtt = db.prepare('SELECT * FROM attendances WHERE employee_id = ? AND date = ?').get(corr.employee_id, corr.date) as any;

      if (existingAtt) {
        db.prepare(`
          UPDATE attendances SET
            clock_in = ?, clock_out = ?, status = 'on_time', work_hours = ?,
            notes = ?
          WHERE id = ?
        `).run(
          corr.requested_clock_in || existingAtt.clock_in,
          corr.requested_clock_out || existingAtt.clock_out,
          workHours,
          `Koreksi disetujui: ${corr.reason}`,
          existingAtt.id
        );
      } else {
        db.prepare(`
          INSERT INTO attendances (
            employee_id, date, clock_in, clock_out, status, work_hours, notes
          ) VALUES (?, ?, ?, ?, 'on_time', ?, ?)
        `).run(
          corr.employee_id,
          corr.date,
          corr.requested_clock_in || '09:00:00',
          corr.requested_clock_out || '18:00:00',
          workHours,
          `Koreksi disetujui: ${corr.reason}`
        );
      }

      // 2. Synchronize payroll automatically
      syncResult = syncEmployeePayrollForDate(
        db,
        corr.employee_id,
        corr.date,
        `Persetujuan Koreksi Presensi ${corr.date}`,
        { id: sessionUser.user_id, name: sessionUser.full_name, role: sessionUser.role }
      );

      // 3. Record Audit Trail
      logAudit(db, {
        userId: sessionUser.user_id,
        userName: sessionUser.full_name,
        userRole: sessionUser.role,
        action: 'CORRECT_ATTENDANCE',
        entityType: 'attendance',
        entityId: `${corr.employee_id}-${corr.date}`,
        oldValues: {
          clock_in: corr.original_clock_in,
          clock_out: corr.original_clock_out,
          status: corr.original_status,
        },
        newValues: {
          clock_in: corr.requested_clock_in,
          clock_out: corr.requested_clock_out,
          status: 'on_time',
          work_hours: workHours,
        },
        notes: `Menyetujui koreksi absensi tanggal ${corr.date} karyawan ${corr.employee_name}. Alasan: ${corr.reason}. Catatan persetujuan: ${approvalNotes || '-'}`,
      });
    } else {
      // Rejected
      logAudit(db, {
        userId: sessionUser.user_id,
        userName: sessionUser.full_name,
        userRole: sessionUser.role,
        action: 'REJECT_CORRECTION',
        entityType: 'attendance_correction',
        entityId: correctionId,
        oldValues: { status: 'pending' },
        newValues: { status: 'rejected', approval_notes: approvalNotes },
        notes: `Menolak koreksi absensi tanggal ${corr.date} karyawan ${corr.employee_name}. Alasan penolakan: ${approvalNotes || '-'}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Pengajuan koreksi presensi ${corr.employee_name} berhasil ${status === 'approved' ? 'disetujui dan disinkronkan' : 'ditolak'}.`,
      syncResult,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
