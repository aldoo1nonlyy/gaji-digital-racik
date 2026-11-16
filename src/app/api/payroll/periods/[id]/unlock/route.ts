import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentSessionUser, logAudit } from '@/lib/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const periodId = params.id;

    const period = db.prepare('SELECT * FROM payroll_periods WHERE id = ?').get(periodId) as any;
    if (!period) {
      return NextResponse.json({ error: 'Periode tidak ditemukan' }, { status: 404 });
    }

    db.prepare(`
      UPDATE payroll_periods SET
        is_locked = 0,
        locked_at = null
      WHERE id = ?
    `).run(periodId);

    const sessionUser = getCurrentSessionUser(req, db);

    // Audit log
    logAudit(db, {
      userId: sessionUser.user_id,
      userName: sessionUser.full_name,
      userRole: sessionUser.role,
      action: 'UNLOCK_PAYROLL',
      entityType: 'payroll_period',
      entityId: periodId,
      oldValues: { is_locked: 1, locked_at: period.locked_at },
      newValues: { is_locked: 0, locked_at: null },
      notes: `Membuka kunci (Unlock Payroll) periode ${period.month}/${period.year} untuk penyesuaian draft.`,
    });

    return NextResponse.json({
      success: true,
      message: `Periode ${period.month}/${period.year} berhasil dibuka kunci (Unlocked). Anda dapat mengedit draft kembali.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
