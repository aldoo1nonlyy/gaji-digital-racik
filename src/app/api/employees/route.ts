import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const search = req.nextUrl.searchParams.get('search') || '';
    const departmentId = req.nextUrl.searchParams.get('departmentId');
    const employmentStatus = req.nextUrl.searchParams.get('status');

    let query = `
      SELECT 
        e.*,
        d.name as department_name,
        d.code as department_code,
        p.title as position_title,
        m.full_name as manager_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LEFT JOIN employees m ON e.manager_id = m.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (e.full_name LIKE ? OR e.nik LIKE ? OR e.email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (departmentId && departmentId !== 'all') {
      query += ` AND e.department_id = ?`;
      params.push(departmentId);
    }

    if (employmentStatus && employmentStatus !== 'all') {
      query += ` AND e.employment_status = ?`;
      params.push(employmentStatus);
    }

    query += ` ORDER BY e.id ASC`;

    const employees = db.prepare(query).all(...params);
    const departments = db.prepare(`SELECT * FROM departments ORDER BY name ASC`).all();
    const positions = db.prepare(`SELECT * FROM positions ORDER BY title ASC`).all();

    return NextResponse.json({ employees, departments, positions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const {
      nik, full_name, email, phone, join_date, employment_status,
      department_id, position_id, grade_level, manager_id,
      npwp, ptkp_status, bank_name, bank_account_no, bank_account_holder,
      bpjs_kesehatan_no, bpjs_ketenagakerjaan_no,
      basic_salary, fixed_allowance, daily_meal_allowance, daily_transport_allowance,
      annual_leave_quota = 12,
    } = body;

    if (!nik || !full_name || !email || !department_id || !position_id) {
      return NextResponse.json({ error: 'Data wajib belum lengkap (NIK, Nama, Email, Departemen, Jabatan)' }, { status: 400 });
    }

    // Default avatar
    const avatar_url = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=1e3a8a&color=fff`;

    const stmt = db.prepare(`
      INSERT INTO employees (
        nik, full_name, email, phone, join_date, employment_status,
        department_id, position_id, grade_level, manager_id,
        npwp, ptkp_status, bank_name, bank_account_no, bank_account_holder,
        bpjs_kesehatan_no, bpjs_ketenagakerjaan_no,
        basic_salary, fixed_allowance, daily_meal_allowance, daily_transport_allowance,
        annual_leave_quota, annual_leave_used, is_active, avatar_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, 0, 1, ?
      )
    `);

    const result = stmt.run(
      nik, full_name, email, phone || '', join_date || new Date().toISOString().split('T')[0],
      employment_status || 'PKWTT',
      department_id, position_id, grade_level || 'S1', manager_id || null,
      npwp || '', ptkp_status || 'TK/0', bank_name || 'Bank Central Asia (BCA)',
      bank_account_no || '', bank_account_holder || full_name,
      bpjs_kesehatan_no || '', bpjs_ketenagakerjaan_no || '',
      Number(basic_salary) || 0, Number(fixed_allowance) || 0,
      Number(daily_meal_allowance) || 0, Number(daily_transport_allowance) || 0,
      Number(annual_leave_quota) || 12, avatar_url
    );

    return NextResponse.json({
      success: true,
      message: 'Karyawan baru berhasil ditambahkan',
      employeeId: result.lastInsertRowid,
    });
  } catch (error: any) {
    if (error.message.includes('UNIQUE constraint failed: employees.nik')) {
      return NextResponse.json({ error: 'NIK sudah terdaftar dalam sistem' }, { status: 400 });
    }
    if (error.message.includes('UNIQUE constraint failed: employees.email')) {
      return NextResponse.json({ error: 'Email sudah digunakan oleh karyawan lain' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

