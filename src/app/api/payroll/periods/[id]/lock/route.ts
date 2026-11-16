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

    if (period.is_locked) {
      return NextResponse.json({ message: 'Periode ini sudah dalam keadaan terkunci (Locked)' });
    }

    db.prepare(`
      UPDATE payroll_periods SET
        is_locked = 1,
        locked_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(periodId);

    const sessionUser = getCurrentSessionUser(req, db);

    // Audit log
    logAudit(db, {
      userId: sessionUser.user_id,
      userName: sessionUser.full_name,
      userRole: sessionUser.role,
      action: 'LOCK_PAYROLL',
      entityType: 'payroll_period',
      entityId: periodId,
      oldValues: { is_locked: 0, locked_at: null },
      newValues: {
        is_locked: 1,
        total_gross_payout: period.total_gross_payout,
        total_tax_payout: period.total_tax_payout,
        total_net_payout: period.total_net_payout,
      },
      notes: `Penguncian final (Lock Payroll) periode ${period.month}/${period.year}. Total Net Payout: Rp ${(period.total_net_payout || 0).toLocaleString('id-ID')}`,
    });

    return NextResponse.json({
      success: true,
      message: `Periode ${period.month}/${period.year} berhasil dikunci. Data slip gaji bersifat final dan resmi.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
