import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const periods = db.prepare(`
      SELECT p.*,
             COUNT(pi.id) as total_slips
      FROM payroll_periods p
      LEFT JOIN payroll_items pi ON p.id = pi.period_id
      GROUP BY p.id
      ORDER BY p.year DESC, p.month DESC
    `).all();

    return NextResponse.json({ periods });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const { month, year, workingDays = 22 } = await req.json();

    if (!month || !year) {
      return NextResponse.json({ error: 'Bulan dan Tahun harus diisi' }, { status: 400 });
    }

    // Determine start & end date
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const stmt = db.prepare(`
      INSERT INTO payroll_periods (month, year, start_date, end_date, working_days)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(month, year, startDate, endDate, workingDays);

    return NextResponse.json({
      success: true,
      message: 'Periode penggajian baru berhasil dibuat',
      periodId: result.lastInsertRowid,
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Periode penggajian untuk bulan & tahun tersebut sudah ada.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

