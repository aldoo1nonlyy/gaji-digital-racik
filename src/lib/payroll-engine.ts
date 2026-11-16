import { getTERCategory, getTERRate, TERCategory } from './ter-tables';

export interface EmployeePayrollInput {
  id: number;
  nik: string;
  fullName: string;
  ptkpStatus: string; // TK/0, TK/1, K/0, etc.
  basicSalary: number;
  fixedAllowance: number;
  dailyMealAllowance: number;
  dailyTransportAllowance: number;
  presentDays: number;
  workingDays: number;
  absentDays: number; // Unexcused absence / Alpha
  overtimeHours: number;
  overtimePay?: number; // Pre-calculated or automatically calculated
  bonus?: number;
  thr?: number;
  loanDeduction?: number;
  otherDeductions?: number;
}

export interface PayrollCalculationResult {
  employeeId: number;
  // Earnings
  basicSalary: number;
  fixedAllowance: number;
  variableMeal: number;
  variableTransport: number;
  presentDays: number;
  absentDays: number;
  workingDays: number;
  overtimeHours: number;
  overtimePay: number;
  bonus: number;
  thr: number;
  totalEarnings: number;

  // Company Contributions (Non-cash benefits, taxable)
  bpjsKesCompany: number;
  bpjsJkkCompany: number;
  bpjsJkmCompany: number;
  bpjsJhtCompany: number; // Company paid, not taxable
  bpjsJpCompany: number;  // Company paid, not taxable
  totalCompanyContributions: number;

  // Taxable Gross & PPh 21 TER
  grossTaxableIncome: number;
  ptkpStatus: string;
  terCategory: TERCategory;
  terRate: number;
  pph21TER: number;

  // Employee Deductions
  bpjsKesEmployee: number;
  bpjsJhtEmployee: number;
  bpjsJpEmployee: number;
  alphaDeduction: number;
  loanDeduction: number;
  otherDeductions: number;
  totalDeductions: number;

  // Take Home Pay
  takeHomePay: number;
}

// Statutory Constants
export const STATUTORY_LIMITS = {
  BPJS_KES_WAGE_CAP: 12000000,     // Max wage base for BPJS Kesehatan: Rp 12.000.000
  BPJS_JP_WAGE_CAP: 10042300,      // Max wage base for BPJS JP per 2024: Rp 10.042.300
  BPJS_KES_CO_RATE: 0.04,          // 4% Company
  BPJS_KES_EMP_RATE: 0.01,         // 1% Employee
  BPJS_JKK_RATE: 0.0024,           // 0.24% Company (low risk office standard)
  BPJS_JKM_RATE: 0.0030,           // 0.30% Company
  BPJS_JHT_CO_RATE: 0.037,         // 3.7% Company
  BPJS_JHT_EMP_RATE: 0.020,        // 2% Employee
  BPJS_JP_CO_RATE: 0.020,          // 2% Company
  BPJS_JP_EMP_RATE: 0.010,         // 1% Employee
};

/**
 * Calculate Overtime Pay according to Kemenaker regulations (PP 35/2021)
 * Hourly wage = 1/173 * (Basic Salary + Fixed Allowances)
 * 1st hour: 1.5x hourly wage
 * 2nd and subsequent hours: 2.0x hourly wage
 */
export function calculateOvertimePay(
  basicSalary: number,
  fixedAllowance: number,
  hours: number
): number {
  if (hours <= 0) return 0;
  const hourlyWage = (basicSalary + fixedAllowance) / 173;
  
  if (hours <= 1) {
    return Math.round(hours * 1.5 * hourlyWage);
  } else {
    const firstHourPay = 1.0 * 1.5 * hourlyWage;
    const subsequentHoursPay = (hours - 1.0) * 2.0 * hourlyWage;
    return Math.round(firstHourPay + subsequentHoursPay);
  }
}

/**
 * Deterministic Payroll Calculation Engine for an Employee
 */
export function calculateEmployeePayroll(input: EmployeePayrollInput): PayrollCalculationResult {
  const {
    id,
    ptkpStatus,
    basicSalary,
    fixedAllowance,
    dailyMealAllowance,
    dailyTransportAllowance,
    presentDays,
    workingDays,
    absentDays,
    overtimeHours,
    bonus = 0,
    thr = 0,
    loanDeduction = 0,
    otherDeductions = 0,
  } = input;

  // 1. Variable Allowances
  const variableMeal = Math.round(dailyMealAllowance * presentDays);
  const variableTransport = Math.round(dailyTransportAllowance * presentDays);

  // 2. Overtime Pay
  const overtimePay = input.overtimePay !== undefined
    ? input.overtimePay
    : calculateOvertimePay(basicSalary, fixedAllowance, overtimeHours);

  // Total Gross Cash Earnings received by employee
  const totalEarnings = Math.round(
    basicSalary +
    fixedAllowance +
    variableMeal +
    variableTransport +
    overtimePay +
    bonus +
    thr
  );

  // 3. Statutory BPJS Calculations
  const wageBaseBPJS = basicSalary + fixedAllowance;

  // BPJS Kesehatan (Cap Rp 12.000.000)
  const bpjsKesBase = Math.min(wageBaseBPJS, STATUTORY_LIMITS.BPJS_KES_WAGE_CAP);
  const bpjsKesCompany = Math.round(bpjsKesBase * STATUTORY_LIMITS.BPJS_KES_CO_RATE);
  const bpjsKesEmployee = Math.round(bpjsKesBase * STATUTORY_LIMITS.BPJS_KES_EMP_RATE);

  // BPJS Ketenagakerjaan
  const bpjsJkkCompany = Math.round(wageBaseBPJS * STATUTORY_LIMITS.BPJS_JKK_RATE);
  const bpjsJkmCompany = Math.round(wageBaseBPJS * STATUTORY_LIMITS.BPJS_JKM_RATE);
  const bpjsJhtCompany = Math.round(wageBaseBPJS * STATUTORY_LIMITS.BPJS_JHT_CO_RATE);
  const bpjsJhtEmployee = Math.round(wageBaseBPJS * STATUTORY_LIMITS.BPJS_JHT_EMP_RATE);

  // BPJS Jaminan Pensiun (Cap Rp 10.042.300)
  const bpjsJpBase = Math.min(wageBaseBPJS, STATUTORY_LIMITS.BPJS_JP_WAGE_CAP);
  const bpjsJpCompany = Math.round(bpjsJpBase * STATUTORY_LIMITS.BPJS_JP_CO_RATE);
  const bpjsJpEmployee = Math.round(bpjsJpBase * STATUTORY_LIMITS.BPJS_JP_EMP_RATE);

  const totalCompanyContributions = Math.round(
    bpjsKesCompany + bpjsJkkCompany + bpjsJkmCompany + bpjsJhtCompany + bpjsJpCompany
  );

  // 4. Tax Calculation (PPh 21 TER 2024 per PP 58/2023 & PMK 168/2023)
  // Taxable Bruto includes Cash Earnings + Company Paid BPJS Kes, JKK, JKM
  const grossTaxableIncome = Math.round(
    totalEarnings + bpjsKesCompany + bpjsJkkCompany + bpjsJkmCompany
  );

  const terCategory = getTERCategory(ptkpStatus);
  const terRate = getTERRate(terCategory, grossTaxableIncome);
  const pph21TER = Math.round(grossTaxableIncome * terRate);

  // 5. Alpha / Absent Deduction
  // Formula: (Basic Salary + Fixed Allowance) / Working Days * Absent Days
  const dailyBaseWage = workingDays > 0 ? (basicSalary + fixedAllowance) / workingDays : 0;
  const alphaDeduction = Math.round(dailyBaseWage * absentDays);

  // 6. Total Employee Deductions
  const totalDeductions = Math.round(
    bpjsKesEmployee +
    bpjsJhtEmployee +
    bpjsJpEmployee +
    pph21TER +
    alphaDeduction +
    loanDeduction +
    otherDeductions
  );

  // 7. Net Take Home Pay
  const takeHomePay = Math.max(0, totalEarnings - totalDeductions);

  return {
    employeeId: id,
    basicSalary,
    fixedAllowance,
    variableMeal,
    variableTransport,
    presentDays,
    absentDays,
    workingDays,
    overtimeHours,
    overtimePay,
    bonus,
    thr,
    totalEarnings,

    bpjsKesCompany,
    bpjsJkkCompany,
    bpjsJkmCompany,
    bpjsJhtCompany,
    bpjsJpCompany,
    totalCompanyContributions,

    grossTaxableIncome,
    ptkpStatus,
    terCategory,
    terRate,
    pph21TER,

    bpjsKesEmployee,
    bpjsJhtEmployee,
    bpjsJpEmployee,
    alphaDeduction,
    loanDeduction,
    otherDeductions,
    totalDeductions,

    takeHomePay,
  };
}

