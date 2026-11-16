import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateEmployeePayroll } from '@/lib/payroll-engine';
import { getCurrentSessionUser, logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const itemId = params.id;
    const body = await req.json();

    const {
      bonus = 0,
      thr = 0,
      loanDeduction = 0,
      otherDeductions = 0,
      absentDays,
      overtimeHours,
      overtimePay,
    } = body;

    // 1. Fetch current payroll item & period
    const currentItem = db.prepare(`
      SELECT pi.*, p.is_locked, p.working_days,
             e.nik, e.full_name, e.ptkp_status, e.basic_salary, e.fixed_allowance,
             e.daily_meal_allowance, e.daily_transport_allowance
      FROM payroll_items pi
      JOIN payroll_periods p ON pi.period_id = p.id
      JOIN employees e ON pi.employee_id = e.id
      WHERE pi.id = ?
    `).get(itemId) as any;

    if (!currentItem) {
      return NextResponse.json({ error: 'Data payroll karyawan tidak ditemukan' }, { status: 404 });
    }

    if (currentItem.is_locked) {
      return NextResponse.json({
        error: 'Periode penggajian telah dikunci (Finalized/Locked). Tidak dapat melakukan perubahan data gaji.',
      }, { status: 400 });
    }

    const workingDays = currentItem.working_days || 22;
    const finalAbsentDays = absentDays !== undefined ? Number(absentDays) : currentItem.absent_days;
    const finalPresentDays = Math.max(0, workingDays - finalAbsentDays);
    const finalOvertimeHours = overtimeHours !== undefined ? Number(overtimeHours) : currentItem.overtime_hours;
    const finalOvertimePay = overtimePay !== undefined ? Number(overtimePay) : currentItem.overtime_pay;

    // 2. Recalculate using deterministic Indonesian payroll engine
    const calc = calculateEmployeePayroll({
      id: currentItem.employee_id,
      nik: currentItem.nik,
      fullName: currentItem.full_name,
      ptkpStatus: currentItem.ptkp_status,
      basicSalary: currentItem.basic_salary,
      fixedAllowance: currentItem.fixed_allowance,
      dailyMealAllowance: currentItem.daily_meal_allowance,
      dailyTransportAllowance: currentItem.daily_transport_allowance,
      presentDays: finalPresentDays,
      workingDays,
      absentDays: finalAbsentDays,
      overtimeHours: finalOvertimeHours,
      overtimePay: finalOvertimePay,
      bonus: Number(bonus) || 0,
      thr: Number(thr) || 0,
      loanDeduction: Number(loanDeduction) || 0,
      otherDeductions: Number(otherDeductions) || 0,
    });

    // 3. Update payroll_items table
    db.prepare(`
      UPDATE payroll_items SET
        bonus = ?,
        thr = ?,
        loan_deduction = ?,
        other_deductions = ?,
        absent_days = ?,
        present_days = ?,
        overtime_hours = ?,
        overtime_pay = ?,
        variable_meal = ?,
        variable_transport = ?,
        total_earnings = ?,
        bpjs_kes_company = ?,
        bpjs_jkk_company = ?,
        bpjs_jkm_company = ?,
        bpjs_jht_company = ?,
        bpjs_jp_company = ?,
        gross_taxable_income = ?,
        ter_category = ?,
        ter_rate = ?,
        pph21_ter = ?,
        bpjs_kes_employee = ?,
        bpjs_jht_employee = ?,
        bpjs_jp_employee = ?,
        alpha_deduction = ?,
        total_deductions = ?,
        take_home_pay = ?
      WHERE id = ?
    `).run(
      calc.bonus,
      calc.thr,
      calc.loanDeduction,
      calc.otherDeductions,
      calc.absentDays,
      calc.presentDays,
      calc.overtimeHours,
      calc.overtimePay,
      calc.variableMeal,
      calc.variableTransport,
      calc.totalEarnings,
      calc.bpjsKesCompany,
      calc.bpjsJkkCompany,
      calc.bpjsJkmCompany,
      calc.bpjsJhtCompany,
      calc.bpjsJpCompany,
      calc.grossTaxableIncome,
      calc.terCategory,
      calc.terRate,
      calc.pph21TER,
      calc.bpjsKesEmployee,
      calc.bpjsJhtEmployee,
      calc.bpjsJpEmployee,
      calc.alphaDeduction,
      calc.totalDeductions,
      calc.takeHomePay,
      itemId
    );

    // 4. Update period summary totals
    const periodTotals = db.prepare(`
      SELECT 
        SUM(total_earnings) as total_gross,
        SUM(pph21_ter) as total_tax,
        SUM(take_home_pay) as total_net
      FROM payroll_items
      WHERE period_id = ?
    `).get(currentItem.period_id) as any;

    db.prepare(`
      UPDATE payroll_periods SET
        total_gross_payout = ?,
        total_tax_payout = ?,
        total_net_payout = ?
      WHERE id = ?
    `).run(
      periodTotals?.total_gross || 0,
      periodTotals?.total_tax || 0,
      periodTotals?.total_net || 0,
      currentItem.period_id
    );

    const sessionUser = getCurrentSessionUser(req, db);
    logAudit(db, {
      userId: sessionUser.user_id,
      userName: sessionUser.full_name,
      userRole: sessionUser.role,
      action: 'ADJUST_PAYROLL_ITEM',
      entityType: 'payroll_item',
      entityId: itemId,
      oldValues: {
        bonus: currentItem.bonus,
        thr: currentItem.thr,
        loan_deduction: currentItem.loan_deduction,
        take_home_pay: currentItem.take_home_pay,
      },
      newValues: {
        bonus: Number(bonus) || 0,
        thr: Number(thr) || 0,
        loan_deduction: Number(loanDeduction) || 0,
        take_home_pay: calc.takeHomePay,
      },
      notes: `Penyesuaian manual komponen gaji ${currentItem.full_name}. THP baru: Rp ${calc.takeHomePay.toLocaleString('id-ID')}`,
    });

    return NextResponse.json({
      success: true,
      message: `Data gaji untuk ${currentItem.full_name} berhasil diperbarui dan direkalkulasi.`,
      updatedItem: {
        id: itemId,
        ...calc,
      },
      periodTotals,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
