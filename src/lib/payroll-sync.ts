import Database from 'better-sqlite3';
import { calculateEmployeePayroll } from './payroll-engine';
import { logAudit } from './audit';

interface SyncResult {
  synced: boolean;
  message: string;
  periodId?: number;
  periodName?: string;
  takeHomePay?: number;
  overtimePay?: number;
  overtimeHours?: number;
}

/**
 * Automatically synchronize an employee's payroll item when Leave, Overtime, or Attendance is approved
 */
export function syncEmployeePayrollForDate(
  db: Database.Database,
  employeeId: number,
  targetDate: string, // YYYY-MM-DD
  triggerReason: string = 'Approval',
  currentUser?: { id?: number; name?: string; role?: string }
): SyncResult {
  try {
    // 1. Extract month and year from target date
    const [yearStr, monthStr] = targetDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (isNaN(year) || isNaN(month)) {
      return { synced: false, message: 'Format tanggal tidak valid' };
    }

    // 2. Find matching payroll period
    const period = db.prepare('SELECT * FROM payroll_periods WHERE month = ? AND year = ?').get(month, year) as any;
    if (!period) {
      return {
        synced: false,
        message: `Belum ada draft periode payroll untuk ${month}/${year}. Data akan otomatis terakumulasi saat HR melakukan Run Payroll periode tersebut.`,
      };
    }

    // If period is locked, we don't overwrite locked historical payroll
    if (period.is_locked) {
      return {
        synced: false,
        message: `Periode ${month}/${year} sudah berstatus Locked (Terkunci). Sinkronisasi otomatis dilewati demi integritas data arsip.`,
      };
    }

    // 3. Get employee profile
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId) as any;
    if (!emp) {
      return { synced: false, message: 'Karyawan tidak ditemukan' };
    }

    // 4. Check existing draft payroll item to preserve manual Bonus / THR adjustments
    const existingItem = db.prepare('SELECT * FROM payroll_items WHERE period_id = ? AND employee_id = ?').get(period.id, employeeId) as any;
    const preservedBonus = existingItem?.bonus || 0;
    const preservedThr = existingItem?.thr || 0;

    // 5. Calculate attendance stats in the period
    const attStats = db.prepare(`
      SELECT 
        COUNT(*) as present_count,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
      FROM attendances
      WHERE employee_id = ? AND date BETWEEN ? AND ?
    `).get(employeeId, period.start_date, period.end_date) as any;

    // Check approved leaves in this period (to avoid unexcused alpha deduction)
    const approvedLeaveDays = db.prepare(`
      SELECT COALESCE(SUM(total_days), 0) as total_leaves
      FROM leave_requests
      WHERE employee_id = ? AND status = 'approved'
        AND start_date <= ? AND end_date >= ?
    `).get(employeeId, period.end_date, period.start_date) as any;

    const loggedPresent = attStats?.present_count || 0;
    const rawAbsentDays = attStats?.absent_count || 0;
    const excusedLeaves = approvedLeaveDays?.total_leaves || 0;
    
    // An absent day covered by approved leave is not alpha
    const unexcusedAbsentDays = Math.max(0, rawAbsentDays - excusedLeaves);
    const presentDays = loggedPresent > 0
      ? Math.min(period.working_days, Math.max(loggedPresent, period.working_days - unexcusedAbsentDays))
      : period.working_days;

    // 6. Calculate all approved overtime in period
    const otStats = db.prepare(`
      SELECT 
        COALESCE(SUM(duration_hours), 0) as total_hours,
        COALESCE(SUM(calculated_amount), 0) as total_amount
      FROM overtime_requests
      WHERE employee_id = ? AND status = 'approved' AND date BETWEEN ? AND ?
    `).get(employeeId, period.start_date, period.end_date) as any;

    const overtimeHours = Number(otStats?.total_hours) || 0;
    const overtimePay = Number(otStats?.total_amount) || 0;

    // 7. Active loan installment
    const loan = db.prepare(`
      SELECT * FROM loans
      WHERE employee_id = ? AND status = 'active'
      LIMIT 1
    `).get(employeeId) as any;

    const loanDeduction = loan ? Math.min(loan.monthly_installment, loan.remaining_balance) : 0;

    // 8. Run deterministic Indonesian payroll calculation
    const calc = calculateEmployeePayroll({
      id: emp.id,
      nik: emp.nik,
      fullName: emp.full_name,
      ptkpStatus: emp.ptkp_status,
      basicSalary: emp.basic_salary,
      fixedAllowance: emp.fixed_allowance,
      dailyMealAllowance: emp.daily_meal_allowance,
      dailyTransportAllowance: emp.daily_transport_allowance,
      presentDays,
      workingDays: period.working_days,
      absentDays: unexcusedAbsentDays,
      overtimeHours,
      overtimePay: overtimePay,
      bonus: preservedBonus,
      thr: preservedThr,
      loanDeduction,
    });

    // 9. Upsert into payroll_items
    const upsertStmt = db.prepare(`
      INSERT INTO payroll_items (
        period_id, employee_id,
        basic_salary, fixed_allowance, variable_meal, variable_transport,
        present_days, absent_days, working_days, overtime_hours, overtime_pay, bonus, thr,
        total_earnings,
        bpjs_kes_company, bpjs_jkk_company, bpjs_jkm_company, bpjs_jht_company, bpjs_jp_company,
        gross_taxable_income, ptkp_status, ter_category, ter_rate, pph21_ter,
        bpjs_kes_employee, bpjs_jht_employee, bpjs_jp_employee,
        alpha_deduction, loan_deduction, other_deductions, total_deductions,
        take_home_pay
      ) VALUES (
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?
      )
      ON CONFLICT(period_id, employee_id) DO UPDATE SET
        basic_salary = excluded.basic_salary,
        fixed_allowance = excluded.fixed_allowance,
        variable_meal = excluded.variable_meal,
        variable_transport = excluded.variable_transport,
        present_days = excluded.present_days,
        absent_days = excluded.absent_days,
        working_days = excluded.working_days,
        overtime_hours = excluded.overtime_hours,
        overtime_pay = excluded.overtime_pay,
        bonus = excluded.bonus,
        thr = excluded.thr,
        total_earnings = excluded.total_earnings,
        bpjs_kes_company = excluded.bpjs_kes_company,
        bpjs_jkk_company = excluded.bpjs_jkk_company,
        bpjs_jkm_company = excluded.bpjs_jkm_company,
        bpjs_jht_company = excluded.bpjs_jht_company,
        bpjs_jp_company = excluded.bpjs_jp_company,
        gross_taxable_income = excluded.gross_taxable_income,
        ptkp_status = excluded.ptkp_status,
        ter_category = excluded.ter_category,
        ter_rate = excluded.ter_rate,
        pph21_ter = excluded.pph21_ter,
        bpjs_kes_employee = excluded.bpjs_kes_employee,
        bpjs_jht_employee = excluded.bpjs_jht_employee,
        bpjs_jp_employee = excluded.bpjs_jp_employee,
        alpha_deduction = excluded.alpha_deduction,
        loan_deduction = excluded.loan_deduction,
        other_deductions = excluded.other_deductions,
        total_deductions = excluded.total_deductions,
        take_home_pay = excluded.take_home_pay
    `);

    upsertStmt.run(
      period.id, emp.id,
      calc.basicSalary, calc.fixedAllowance, calc.variableMeal, calc.variableTransport,
      calc.presentDays, calc.absentDays, calc.workingDays, calc.overtimeHours, calc.overtimePay, calc.bonus, calc.thr,
      calc.totalEarnings,
      calc.bpjsKesCompany, calc.bpjsJkkCompany, calc.bpjsJkmCompany, calc.bpjsJhtCompany, calc.bpjsJpCompany,
      calc.grossTaxableIncome, calc.ptkpStatus, calc.terCategory, calc.terRate, calc.pph21TER,
      calc.bpjsKesEmployee, calc.bpjsJhtEmployee, calc.bpjsJpEmployee,
      calc.alphaDeduction, calc.loanDeduction, calc.otherDeductions, calc.totalDeductions,
      calc.takeHomePay
    );

    // 10. Update totals on the payroll_period
    const periodTotals = db.prepare(`
      SELECT 
        COALESCE(SUM(total_earnings), 0) as total_gross,
        COALESCE(SUM(pph21_ter), 0) as total_tax,
        COALESCE(SUM(take_home_pay), 0) as total_net
      FROM payroll_items
      WHERE period_id = ?
    `).get(period.id) as any;

    db.prepare(`
      UPDATE payroll_periods
      SET total_gross_payout = ?, total_tax_payout = ?, total_net_payout = ?
      WHERE id = ?
    `).run(periodTotals.total_gross, periodTotals.total_tax, periodTotals.total_net, period.id);

    // 11. Record audit log
    logAudit(db, {
      userId: currentUser?.id || 1,
      userName: currentUser?.name || 'Sistem Payroll Otomatis',
      userRole: currentUser?.role || 'admin',
      action: 'SYNC_PAYROLL',
      entityType: 'payroll_item',
      entityId: `${period.id}-${emp.id}`,
      oldValues: existingItem ? { take_home_pay: existingItem.take_home_pay, overtime_pay: existingItem.overtime_pay } : null,
      newValues: { take_home_pay: calc.takeHomePay, overtime_pay: calc.overtimePay, overtime_hours: calc.overtimeHours },
      notes: `Sinkronisasi otomatis Payroll ${month}/${year} karyawan ${emp.full_name} (${triggerReason}). THP baru: Rp ${calc.takeHomePay.toLocaleString('id-ID')}`,
    });

    return {
      synced: true,
      message: `Perhitungan payroll periode ${month}/${year} untuk ${emp.full_name} berhasil disinkronkan secara otomatis.`,
      periodId: period.id,
      periodName: `${month}/${year}`,
      takeHomePay: calc.takeHomePay,
      overtimePay: calc.overtimePay,
      overtimeHours: calc.overtimeHours,
    };
  } catch (error: any) {
    console.error('Error syncing employee payroll:', error);
    return { synced: false, message: `Gagal sinkronisasi payroll: ${error.message}` };
  }
}
