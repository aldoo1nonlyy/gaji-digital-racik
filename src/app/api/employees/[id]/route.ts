import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentSessionUser, logAudit } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const employeeId = params.id;

    const employee = db.prepare(`
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
      WHERE e.id = ?
    `).get(employeeId);

    if (!employee) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const employeeId = params.id;
    const body = await req.json();

    const {
      nik, full_name, email, phone, join_date, employment_status,
      department_id, position_id, grade_level, manager_id,
      npwp, ptkp_status, bank_name, bank_account_no, bank_account_holder,
      bpjs_kesehatan_no, bpjs_ketenagakerjaan_no,
      basic_salary, fixed_allowance, daily_meal_allowance, daily_transport_allowance,
      annual_leave_quota, is_active
    } = body;

    // Fetch previous state for audit trail
    const oldEmp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId) as any;
    if (!oldEmp) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    const newBasicSalary = Number(basic_salary) || 0;
    const newFixedAllowance = Number(fixed_allowance) || 0;
    const newMeal = Number(daily_meal_allowance) || 0;
    const newTransport = Number(daily_transport_allowance) || 0;

    const stmt = db.prepare(`
      UPDATE employees SET
        nik = ?, full_name = ?, email = ?, phone = ?, join_date = ?, employment_status = ?,
        department_id = ?, position_id = ?, grade_level = ?, manager_id = ?,
        npwp = ?, ptkp_status = ?, bank_name = ?, bank_account_no = ?, bank_account_holder = ?,
        bpjs_kesehatan_no = ?, bpjs_ketenagakerjaan_no = ?,
        basic_salary = ?, fixed_allowance = ?, daily_meal_allowance = ?, daily_transport_allowance = ?,
        annual_leave_quota = ?, is_active = ?,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `);

    stmt.run(
      nik, full_name, email, phone, join_date, employment_status,
      department_id, position_id, grade_level, manager_id || null,
      npwp, ptkp_status, bank_name, bank_account_no, bank_account_holder,
      bpjs_kesehatan_no, bpjs_ketenagakerjaan_no,
      newBasicSalary, newFixedAllowance,
      newMeal, newTransport,
      Number(annual_leave_quota) || 12, is_active !== undefined ? is_active : 1,
      employeeId
    );

    const sessionUser = getCurrentSessionUser(req, db);

    // Check if salary or PTKP changed
    const salaryChanged = oldEmp.basic_salary !== newBasicSalary ||
                          oldEmp.fixed_allowance !== newFixedAllowance ||
                          oldEmp.ptkp_status !== ptkp_status;

    if (salaryChanged) {
      logAudit(db, {
        userId: sessionUser.user_id,
        userName: sessionUser.full_name,
        userRole: sessionUser.role,
        action: 'UPDATE_SALARY',
        entityType: 'employee',
        entityId: employeeId,
        oldValues: {
          basic_salary: oldEmp.basic_salary,
          fixed_allowance: oldEmp.fixed_allowance,
          ptkp_status: oldEmp.ptkp_status,
          meal_allowance: oldEmp.daily_meal_allowance,
          transport_allowance: oldEmp.daily_transport_allowance,
        },
        newValues: {
          basic_salary: newBasicSalary,
          fixed_allowance: newFixedAllowance,
          ptkp_status: ptkp_status,
          meal_allowance: newMeal,
          transport_allowance: newTransport,
        },
        notes: `Perubahan struktur gaji pokok & tunjangan karyawan ${full_name} (${nik}). Gaji Pokok: Rp ${oldEmp.basic_salary.toLocaleString('id-ID')} -> Rp ${newBasicSalary.toLocaleString('id-ID')}`,
      });
    } else {
      logAudit(db, {
        userId: sessionUser.user_id,
        userName: sessionUser.full_name,
        userRole: sessionUser.role,
        action: 'UPDATE_EMPLOYEE',
        entityType: 'employee',
        entityId: employeeId,
        oldValues: { full_name: oldEmp.full_name, email: oldEmp.email, status: oldEmp.employment_status },
        newValues: { full_name, email, status: employment_status },
        notes: `Pembaruan data profil karyawan ${full_name} (${nik})`,
      });
    }

    return NextResponse.json({ success: true, message: 'Data karyawan berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const employeeId = params.id;

    const oldEmp = db.prepare('SELECT full_name, nik FROM employees WHERE id = ?').get(employeeId) as any;

    // Soft delete (set is_active = 0)
    db.prepare(`UPDATE employees SET is_active = 0, updated_at = datetime('now', 'localtime') WHERE id = ?`).run(employeeId);

    const sessionUser = getCurrentSessionUser(req, db);
    logAudit(db, {
      userId: sessionUser.user_id,
      userName: sessionUser.full_name,
      userRole: sessionUser.role,
      action: 'DEACTIVATE_EMPLOYEE',
      entityType: 'employee',
      entityId: employeeId,
      oldValues: { is_active: 1 },
      newValues: { is_active: 0 },
      notes: `Deaktivasi akun/karyawan ${oldEmp?.full_name} (${oldEmp?.nik})`,
    });

    return NextResponse.json({ success: true, message: 'Status karyawan dinonaktifkan' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
