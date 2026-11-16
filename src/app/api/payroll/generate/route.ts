import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateEmployeePayroll } from '@/lib/payroll-engine';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    let { periodId, month, year, workingDays = 22 } = body;

    let period: any = null;

    if (periodId) {
      period = db.prepare('SELECT * FROM payroll_periods WHERE id = ?').get(periodId) as any;
    } else if (month && year) {
      period = db.prepare('SELECT * FROM payroll_periods WHERE month = ? AND year = ?').get(month, year) as any;
      if (!period) {
        // Auto-create period for this month & year
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const insertPeriodStmt = db.prepare(`
          INSERT INTO payroll_periods (month, year, start_date, end_date, working_days)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = insertPeriodStmt.run(month, year, startDate, endDate, workingDays);
        periodId = result.lastInsertRowid;
        period = db.prepare('SELECT * FROM payroll_periods WHERE id = ?').get(periodId) as any;
      } else {
        periodId = period.id;
      }
    }

    if (!period) {
      return NextResponse.json({ error: 'Periode penggajian tidak valid atau tidak ditemukan' }, { status: 400 });
    }

    if (period.is_locked) {
      return NextResponse.json({
        error: `Periode ${period.month}/${period.year} telah dikunci (Finalized/Locked). Buka kunci terlebih dahulu jika ingin mengkalkulasi ulang.`,
      }, { status: 400 });
    }

    const employees = db.prepare('SELECT * FROM employees WHERE is_active = 1 ORDER BY id ASC').all() as any[];

    // Delete existing unlocked items for this period before regenerating
    db.prepare('DELETE FROM payroll_items WHERE period_id = ?').run(periodId);

    const insertItem = db.prepare(`
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
    `);

    let periodGross = 0;
    let periodTax = 0;
    let periodNet = 0;

    for (const emp of employees) {
      // 1. Get attendance stats in period
      const attStats = db.prepare(`
        SELECT 
          COUNT(*) as present_count,
          SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_count
        FROM attendances
        WHERE employee_id = ? AND date BETWEEN ? AND ?
      `).get(emp.id, period.start_date, period.end_date) as any;

      const loggedPresent = attStats?.present_count || 0;
      const absentDays = attStats?.absent_count || 0;
      const presentDays = loggedPresent > 0
        ? Math.min(period.working_days, Math.max(loggedPresent, period.working_days - absentDays))
        : period.working_days;

      // 2. Get approved overtime in period
      const otStats = db.prepare(`
        SELECT 
          SUM(duration_hours) as total_hours,
          SUM(calculated_amount) as total_amount
        FROM overtime_requests
        WHERE employee_id = ? AND status = 'approved' AND date BETWEEN ? AND ?
      `).get(emp.id, period.start_date, period.end_date) as any;

      const overtimeHours = otStats?.total_hours || 0;
      const overtimePay = otStats?.total_amount || 0;

      // 3. Get active loan installment
      const loan = db.prepare(`
        SELECT * FROM loans
        WHERE employee_id = ? AND status = 'active'
        LIMIT 1
      `).get(emp.id) as any;

      const loanDeduction = loan ? Math.min(loan.monthly_installment, loan.remaining_balance) : 0;

      // 4. Calculate deterministic Indonesian payroll
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
        absentDays,
        overtimeHours,
        overtimePay: overtimePay > 0 ? overtimePay : undefined,
        loanDeduction,
      });

      insertItem.run(
        periodId, emp.id,
        calc.basicSalary, calc.fixedAllowance, calc.variableMeal, calc.variableTransport,
        calc.presentDays, calc.absentDays, calc.workingDays, calc.overtimeHours, calc.overtimePay, calc.bonus, calc.thr,
        calc.totalEarnings,
        calc.bpjsKesCompany, calc.bpjsJkkCompany, calc.bpjsJkmCompany, calc.bpjsJhtCompany, calc.bpjsJpCompany,
        calc.grossTaxableIncome, calc.ptkpStatus, calc.terCategory, calc.terRate, calc.pph21TER,
        calc.bpjsKesEmployee, calc.bpjsJhtEmployee, calc.bpjsJpEmployee,
        calc.alphaDeduction, calc.loanDeduction, calc.otherDeductions, calc.totalDeductions,
        calc.takeHomePay
      );

      periodGross += calc.totalEarnings;
      periodTax += calc.pph21TER;
      periodNet += calc.takeHomePay;
    }

    // Update period totals
    db.prepare(`
      UPDATE payroll_periods SET
        total_gross_payout = ?,
        total_tax_payout = ?,
        total_net_payout = ?
      WHERE id = ?
    `).run(periodGross, periodTax, periodNet, periodId);

    return NextResponse.json({
      success: true,
      message: `Draft Payroll berhasil di-generate untuk ${employees.length} karyawan aktif pada periode ${period.month}/${period.year}.`,
      periodId,
      summary: {
        totalEmployees: employees.length,
        totalGross: periodGross,
        totalTax: periodTax,
        totalNet: periodNet,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
