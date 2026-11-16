import { getDb } from './db';
import { calculateEmployeePayroll } from './payroll-engine';

export function seedDatabase(force: boolean = false) {
  const db = getDb();

  const count = db.prepare('SELECT COUNT(*) as count FROM employees').get() as { count: number };
  if (count.count > 0 && !force) {
    return { success: true, message: 'Database already seeded' };
  }

  // Clear existing data if forced
  if (force) {
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM attendance_corrections;
      DELETE FROM payroll_items;
      DELETE FROM payroll_periods;
      DELETE FROM loans;
      DELETE FROM overtime_requests;
      DELETE FROM leave_requests;
      DELETE FROM attendances;
      DELETE FROM users;
      DELETE FROM employees;
      DELETE FROM positions;
      DELETE FROM departments;
      DELETE FROM sqlite_sequence WHERE name IN (
        'departments', 'positions', 'employees', 'users',
        'attendances', 'leave_requests', 'overtime_requests',
        'loans', 'payroll_periods', 'payroll_items',
        'attendance_corrections', 'audit_logs'
      );
    `);
  }

  // 1. Insert Departments
  const insertDept = db.prepare('INSERT INTO departments (code, name, description) VALUES (?, ?, ?)');
  const depts = [
    ['ENG', 'Engineering & Information Technology', 'Pengembangan software, infrastruktur cloud & devops'],
    ['HRD', 'Human Resources & General Affairs', 'Manajemen talenta, penggajian, legal & fasilitas'],
    ['FIN', 'Finance & Accounting', 'Pembukuan, cash flow, perpajakan & audit keuangan'],
    ['MKT', 'Marketing & Growth', 'Branding, akuisisi pengguna, kampanye digital & sales'],
    ['OPS', 'Operations & Client Success', 'Layanan operasional harian & customer support'],
  ];
  depts.forEach(([code, name, desc]) => insertDept.run(code, name, desc));

  // 2. Insert Positions
  const insertPos = db.prepare('INSERT INTO positions (title, department_id, grade_level) VALUES (?, ?, ?)');
  const positions = [
    // ENG (dept 1)
    ['Engineering Manager', 1, 'M1'],
    ['Senior Fullstack Developer', 1, 'S1'],
    ['UI/UX Designer', 1, 'M2'],
    ['Junior Frontend Developer', 1, 'J1'],
    // HRD (dept 2)
    ['HR Manager & Legal Lead', 2, 'M1'],
    ['People Operations & Payroll Specialist', 2, 'S1'],
    // FIN (dept 3)
    ['Finance Manager', 3, 'M1'],
    ['Accounting Staff', 3, 'J1'],
    // MKT (dept 4)
    ['Head of Marketing', 4, 'M1'],
    ['Digital Marketing Specialist', 4, 'S1'],
  ];
  positions.forEach(([title, deptId, grade]) => insertPos.run(title, deptId, grade));

  // 3. Insert Realistic Indonesian Employees
  const insertEmp = db.prepare(`
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
      ?, ?, ?, ?
    )
  `);

  const employees = [
    [
      'EMP-2021001', 'Budi Santoso, S.Kom.', 'budi.santoso@nusantaramaju.co.id', '081234567801',
      '2021-02-01', 'PKWTT', 2, 5, 'M1', null,
      '71.294.819.2-014.000', 'K/2', 'Bank Central Asia (BCA)', '5271892019', 'Budi Santoso',
      '0001892716281', '19028471928',
      16000000, 3000000, 45000, 35000,
      12, 3, 1, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    ],
    [
      'EMP-2021002', 'Rian Pratama, S.T.', 'rian.pratama@nusantaramaju.co.id', '081234567802',
      '2021-03-15', 'PKWTT', 1, 1, 'M1', 1,
      '82.491.028.4-015.000', 'K/1', 'Bank Mandiri', '1370019283741', 'Rian Pratama',
      '0002938475819', '20019384759',
      18500000, 3500000, 50000, 40000,
      12, 4, 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    ],
    [
      'EMP-2022003', 'Siti Rahmawati, S.E.', 'siti.rahmawati@nusantaramaju.co.id', '081234567803',
      '2022-01-10', 'PKWTT', 2, 6, 'S1', 1,
      '93.817.291.5-018.000', 'TK/0', 'Bank Central Asia (BCA)', '6829103847', 'Siti Rahmawati',
      '0003847291847', '21028374928',
      7500000, 1000000, 35000, 25000,
      12, 2, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    ],
    [
      'EMP-2022004', 'Dimas Arya Wicaksana', 'dimas.arya@nusantaramaju.co.id', '081234567804',
      '2022-06-01', 'PKWTT', 1, 2, 'S1', 2,
      '64.928.172.9-021.000', 'TK/1', 'Bank Negara Indonesia (BNI)', '0829103948', 'Dimas Arya Wicaksana',
      '0004928374928', '22019384729',
      12500000, 1500000, 40000, 30000,
      12, 5, 1, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    ],
    [
      'EMP-2023005', 'Anisa Putri, S.Ds.', 'anisa.putri@nusantaramaju.co.id', '081234567805',
      '2023-02-15', 'PKWT', 1, 3, 'M2', 2,
      '55.829.102.8-011.000', 'TK/0', 'Bank Central Asia (BCA)', '7192830192', 'Anisa Putri',
      '0005928374829', '23019283748',
      8500000, 1000000, 35000, 25000,
      12, 1, 1, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    ],
    [
      'EMP-2024006', 'Fajar Ramadhan', 'fajar.ramadhan@nusantaramaju.co.id', '081234567806',
      '2024-03-01', 'Probation', 1, 4, 'J1', 2,
      '44.918.291.0-032.000', 'TK/0', 'Bank Mandiri', '1420019283749', 'Fajar Ramadhan',
      '0006928374920', '24019283749',
      5500000, 500000, 30000, 20000,
      12, 0, 1, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    ],
    [
      'EMP-2022007', 'Dewi Lestari, Ak.', 'dewi.lestari@nusantaramaju.co.id', '081234567807',
      '2022-09-01', 'PKWTT', 3, 8, 'J1', 1,
      '33.829.192.4-041.000', 'K/0', 'Bank Rakyat Indonesia (BRI)', '034101002938501', 'Dewi Lestari',
      '0007928374921', '22039281749',
      6800000, 700000, 35000, 25000,
      12, 3, 1, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    ],
    [
      'EMP-2023008', 'Hendra Wijaya, S.E.', 'hendra.wijaya@nusantaramaju.co.id', '081234567808',
      '2023-05-10', 'PKWTT', 4, 10, 'S1', 1,
      '22.918.293.1-019.000', 'K/3', 'Bank Central Asia (BCA)', '8291038475', 'Hendra Wijaya',
      '0008928374922', '23049281750',
      9000000, 1200000, 35000, 25000,
      12, 2, 1, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
    ],
  ];

  employees.forEach((emp) => insertEmp.run(...emp));

  // 4. Insert Users
  const insertUser = db.prepare('INSERT INTO users (employee_id, username, role) VALUES (?, ?, ?)');
  insertUser.run(1, 'admin', 'admin');       // Budi Santoso (HR Super Admin)
  insertUser.run(2, 'manager', 'manager');   // Rian Pratama (Tech Lead / Manager)
  insertUser.run(4, 'employee', 'employee'); // Dimas Arya (Senior Dev / ESS)
  insertUser.run(3, 'siti', 'employee');     // Siti Rahmawati
  insertUser.run(5, 'anisa', 'employee');    // Anisa Putri

  // 5. Insert Attendances for current month
  const today = new Date().toISOString().split('T')[0];
  const insertAttendance = db.prepare(`
    INSERT INTO attendances (
      employee_id, date, clock_in, clock_out,
      clock_in_lat, clock_in_lng, clock_out_lat, clock_out_lng,
      status, work_hours, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Today's attendances
  insertAttendance.run(1, today, '08:42:15', null, -6.2254, 106.8094, null, null, 'on_time', 0, 'Presensi tepat waktu SCBD');
  insertAttendance.run(2, today, '08:35:10', null, -6.2256, 106.8096, null, null, 'on_time', 0, 'Presensi kantor lantai 18');
  insertAttendance.run(3, today, '08:55:00', null, -6.2255, 106.8095, null, null, 'on_time', 0, 'Presensi SCBD');
  insertAttendance.run(4, today, '08:45:12', null, -6.2255, 106.8095, null, null, 'on_time', 0, 'Presensi pagi SCBD Lt. 28');
  insertAttendance.run(5, today, '08:48:10', null, -6.2257, 106.8097, null, null, 'on_time', 0, 'Presensi SCBD');
  insertAttendance.run(6, today, '08:30:00', null, -6.2255, 106.8095, null, null, 'on_time', 0, 'Presensi pagi tepat waktu');

  // Past November attendances for Employee 4 (Dimas Arya)
  const dimasAttendances = [
    { date: '2026-11-02', in: '08:44:10', out: '18:05:20', hours: 9.3, status: 'on_time', notes: 'Presensi SCBD Lt. 28' },
    { date: '2026-11-03', in: '08:52:00', out: '18:15:00', hours: 9.3, status: 'on_time', notes: 'Presensi SCBD' },
    { date: '2026-11-04', in: '09:15:30', out: '18:30:10', hours: 9.2, status: 'late', notes: 'Terlambat 15 menit (Macet Sudirman)' },
    { date: '2026-11-05', in: '08:40:00', out: '18:00:00', hours: 9.3, status: 'on_time', notes: 'Presensi SCBD' },
    { date: '2026-11-06', in: '08:48:15', out: '17:10:00', hours: 8.3, status: 'on_time', notes: 'Presensi SCBD' },
    { date: '2026-11-09', in: '08:35:00', out: '18:10:00', hours: 9.5, status: 'on_time', notes: 'Presensi tepat waktu' },
    { date: '2026-11-10', in: '08:50:22', out: '18:02:15', hours: 9.2, status: 'on_time', notes: 'Presensi SCBD' },
    { date: '2026-11-11', in: '09:22:10', out: '18:45:00', hours: 9.3, status: 'late', notes: 'Terlambat 22 menit (Hujan lebat)' },
    { date: '2026-11-12', in: '08:45:00', out: '18:00:00', hours: 9.2, status: 'on_time', notes: 'Presensi SCBD' },
    { date: '2026-11-13', in: '08:39:10', out: '18:12:00', hours: 9.5, status: 'on_time', notes: 'Presensi tepat waktu' },
  ];

  dimasAttendances.forEach(att => {
    if (att.date !== today) {
      insertAttendance.run(
        4, att.date, att.in, att.out,
        -6.2255, 106.8095, -6.2255, 106.8095,
        att.status, att.hours, att.notes
      );
    }
  });
  // Employee 7 is on sick leave today, Employee 8 is on annual leave

  // 6. Insert Leave Requests
  const insertLeave = db.prepare(`
    INSERT INTO leave_requests (
      employee_id, leave_type, start_date, end_date, total_days, reason,
      attachment_url, status, approver_id, approval_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLeave.run(
    4, 'sakit', '2026-10-14', '2026-10-15', 2,
    'Sakit tipes dan demam tinggi berdasarkan rujukan rawat jalan RS Siloam',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    'approved', 2, 'Disetujui. Istirahat yang cukup ya Dimas.'
  );

  insertLeave.run(
    4, 'tahunan', '2026-10-23', '2026-10-24', 2,
    'Acara syukuran keluarga di luar kota',
    null, 'approved', 2, 'Disetujui.'
  );

  insertLeave.run(
    4, 'tahunan', today, today, 1,
    'Keperluan mendesak perpanjangan paspor & dokumen imigrasi',
    null, 'pending', 2, null
  );

  insertLeave.run(
    7, 'sakit', today, today, 1,
    'Demam tinggi & radang tenggorokan (Istirahat dokter 1 hari)',
    'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80', 'approved', 1, 'Disetujui. Semoga lekas sembuh.'
  );

  // 7. Insert Overtime Requests
  const insertOT = db.prepare(`
    INSERT INTO overtime_requests (
      employee_id, date, start_time, end_time, duration_hours,
      notes, calculated_amount, status, approver_id, approval_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Dimas: 4 hours overtime approved (2026-11-10)
  insertOT.run(
    4, '2026-11-10', '18:00', '22:00', 4.0,
    'Deployment rilis modul pembayaran core banking & hotfix bug staging',
    606936, 'approved', 2, 'Disetujui untuk rilis v2.'
  );

  // Dimas: 2 hours overtime pending today
  insertOT.run(
    4, today, '18:00', '20:00', 2.0,
    'Review code PR integrasi payment gateway dan testing end-to-end',
    283237, 'pending', 2, null
  );

  // Fajar: 3 hours overtime approved
  insertOT.run(
    6, today, '18:00', '21:00', 3.0,
    'Pengerjaan integrasi REST API modul presensi digital & unit testing',
    190751, 'approved', 2, 'Disetujui untuk lembur kejar target sprint rilis v2.'
  );

  // 8. Insert Loans
  const insertLoan = db.prepare(`
    INSERT INTO loans (employee_id, loan_type, total_amount, monthly_installment, remaining_balance, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertLoan.run(8, 'Kasbon Operasional Relokasi', 3000000, 500000, 2000000, 'active');

  // 9. Insert Previous Month Payroll Period (October 2026 - Locked & Finalized)
  const insertPeriod = db.prepare(`
    INSERT INTO payroll_periods (
      month, year, start_date, end_date, working_days,
      is_locked, locked_at, total_gross_payout, total_tax_payout, total_net_payout
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const prevPeriodResult = insertPeriod.run(
    10, 2026, '2026-10-01', '2026-10-31', 22,
    1, '2026-10-28 17:00:00', 0, 0, 0
  );
  const prevPeriodId = prevPeriodResult.lastInsertRowid;

  // Insert Payroll Items for all 8 employees in October 2026
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

  let prevTotalGross = 0;
  let prevTotalTax = 0;
  let prevTotalNet = 0;

  const allEmployees = db.prepare('SELECT * FROM employees').all() as any[];

  allEmployees.forEach((emp) => {
    const presentDays = 22;
    const absentDays = 0;
    const overtimeHours = emp.id === 4 ? 4 : emp.id === 6 ? 3 : 0;
    const loanDeduction = emp.id === 8 ? 500000 : 0;

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
      workingDays: 22,
      absentDays,
      overtimeHours,
      loanDeduction,
    });

    insertItem.run(
      prevPeriodId, emp.id,
      calc.basicSalary, calc.fixedAllowance, calc.variableMeal, calc.variableTransport,
      calc.presentDays, calc.absentDays, calc.workingDays, calc.overtimeHours, calc.overtimePay, calc.bonus, calc.thr,
      calc.totalEarnings,
      calc.bpjsKesCompany, calc.bpjsJkkCompany, calc.bpjsJkmCompany, calc.bpjsJhtCompany, calc.bpjsJpCompany,
      calc.grossTaxableIncome, calc.ptkpStatus, calc.terCategory, calc.terRate, calc.pph21TER,
      calc.bpjsKesEmployee, calc.bpjsJhtEmployee, calc.bpjsJpEmployee,
      calc.alphaDeduction, calc.loanDeduction, calc.otherDeductions, calc.totalDeductions,
      calc.takeHomePay
    );

    prevTotalGross += calc.totalEarnings;
    prevTotalTax += calc.pph21TER;
    prevTotalNet += calc.takeHomePay;
  });

  // Update totals on locked October period
  db.prepare(`
    UPDATE payroll_periods
    SET total_gross_payout = ?, total_tax_payout = ?, total_net_payout = ?
    WHERE id = ?
  `).run(prevTotalGross, prevTotalTax, prevTotalNet, prevPeriodId);

  // 10. Insert Current Month Payroll Period (November 2026 - Open & Draft)
  insertPeriod.run(
    11, 2026, '2026-11-01', '2026-11-30', 22,
    0, null, 0, 0, 0
  );

  // 11. Insert Sample Attendance Corrections (Koreksi Absensi)
  const insertCorr = db.prepare(`
    INSERT INTO attendance_corrections (
      employee_id, attendance_id, date, correction_type,
      requested_clock_in, requested_clock_out,
      original_clock_in, original_clock_out, original_status,
      reason, status, approver_id, approval_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Maya Indah (UI/UX Designer, id: 3) requests koreksi absen for missing clock-out (Pending)
  insertCorr.run(
    3, null, '2026-11-13', 'clock_out',
    '08:58:00', '18:15:00',
    '08:58:00', null, 'late',
    'Lupa clock out karena workshop user testing di kantor klien hingga malam hari',
    'pending', null, null
  );

  // Rizky Fauzan (Junior Frontend, id: 5) koreksi absen (Approved)
  insertCorr.run(
    5, null, '2026-11-06', 'clock_in_out',
    '08:52:00', '18:05:00',
    null, null, 'absent',
    'Gagal check-in karena baterai HP mati saat tiba di lobi gedung SCBD',
    'approved', 2, 'Disetujui. Bukti absensi manual satpam terverifikasi.'
  );

  // 12. Insert Initial Audit Trail Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (
      user_id, user_name, user_role, action, entity_type, entity_id,
      old_values, new_values, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime', ?))
  `);

  // Log 1: Lock October Payroll
  insertAudit.run(
    1, 'Budi Santoso, S.Kom.', 'admin', 'LOCK_PAYROLL', 'payroll_period', '1',
    JSON.stringify({ is_locked: 0, month: 10, year: 2026 }),
    JSON.stringify({ is_locked: 1, total_net_payout: 93198031, locked_at: '2026-10-28 17:00:00' }),
    'Penguncian resmi (Lock Payroll) periode Oktober 2026. Slip gaji diterbitkan ke 8 karyawan.',
    '-3 days'
  );

  // Log 2: Salary Adjustment for Dimas Arya
  insertAudit.run(
    1, 'Budi Santoso, S.Kom.', 'admin', 'UPDATE_SALARY', 'employee', '4',
    JSON.stringify({ basic_salary: 11000000, fixed_allowance: 1500000, grade_level: 'S1' }),
    JSON.stringify({ basic_salary: 12500000, fixed_allowance: 2000000, grade_level: 'S1' }),
    'Penyesuaian kenaikan gaji pokok & tunjangan jabatan promosi Senior Developer Dimas Arya Pratama.',
    '-2 days'
  );

  // Log 3: Approved Leave
  insertAudit.run(
    2, 'Rian Pratama, S.T.', 'manager', 'APPROVE_LEAVE', 'leave_request', '1',
    JSON.stringify({ status: 'pending' }),
    JSON.stringify({ status: 'approved', approver_id: 2, approval_notes: 'Disetujui, cuti tahunan sprint libur.' }),
    'Menyetujui pengajuan cuti tahunan (3 hari) karyawan Dimas Arya Pratama.',
    '-1 days'
  );

  // Log 4: Approved Overtime with Payroll Sync
  insertAudit.run(
    2, 'Rian Pratama, S.T.', 'manager', 'APPROVE_OVERTIME', 'overtime_request', '1',
    JSON.stringify({ status: 'pending' }),
    JSON.stringify({ status: 'approved', duration_hours: 4.0, amount: 606936 }),
    'Menyetujui lembur 4 jam Dimas Arya (Deployment rilis pembayaran core banking). Upah Rp 606.936 disinkronkan ke payroll.',
    '-1 hours'
  );

  return {
    success: true,
    message: 'PT Nusantara Maju HRIS & Payroll successfully seeded with realistic Indonesian data',
  };
}

