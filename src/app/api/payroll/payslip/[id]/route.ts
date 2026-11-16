import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { terbilang } from '@/lib/utils';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const itemId = params.id;

    const item = db.prepare(`
      SELECT 
        pi.*,
        p.month,
        p.year,
        p.start_date as period_start_date,
        p.end_date as period_end_date,
        p.is_locked,
        p.locked_at,
        e.nik,
        e.full_name,
        e.email,
        e.phone,
        e.join_date,
        e.employment_status,
        e.grade_level,
        e.npwp,
        e.bank_name,
        e.bank_account_no,
        e.bank_account_holder,
        e.bpjs_kesehatan_no,
        e.bpjs_ketenagakerjaan_no,
        e.avatar_url,
        d.name as department_name,
        d.code as department_code,
        pos.title as position_title
      FROM payroll_items pi
      JOIN payroll_periods p ON pi.period_id = p.id
      JOIN employees e ON pi.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions pos ON e.position_id = pos.id
      WHERE pi.id = ?
    `).get(itemId) as any;

    if (!item) {
      return NextResponse.json({ error: 'Slip gaji tidak ditemukan' }, { status: 404 });
    }

    const terbilangText = terbilang(item.take_home_pay);

    return NextResponse.json({
      payslip: item,
      terbilang: terbilangText,
      company: {
        name: 'PT Nusantara Teknologi Maju',
        address: 'Treasury Tower Lt. 28, District 8 SCBD, Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan 12190',
        phone: '+62 21 5088 9200',
        email: 'payroll@nusantaramaju.co.id',
        website: 'www.nusantaramaju.co.id',
        hrDirector: 'Budi Santoso, S.Kom.',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

