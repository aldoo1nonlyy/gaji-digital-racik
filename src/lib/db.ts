import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'hris.db');
  dbInstance = new Database(dbPath);

  // Performance and integrity pragma settings
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  // Initialize schema
  initializeSchema(dbInstance);

  return dbInstance;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    -- Departments
    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    );

    -- Positions
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      department_id INTEGER REFERENCES departments(id),
      grade_level TEXT NOT NULL
    );

    -- Employees
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nik TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      join_date TEXT NOT NULL,
      employment_status TEXT NOT NULL, -- PKWT, PKWTT, Probation
      department_id INTEGER REFERENCES departments(id),
      position_id INTEGER REFERENCES positions(id),
      grade_level TEXT NOT NULL,
      manager_id INTEGER REFERENCES employees(id),

      -- Tax & Bank Identity
      npwp TEXT,
      ptkp_status TEXT NOT NULL DEFAULT 'TK/0', -- TK/0, TK/1, K/0, K/1, K/2, K/3, etc.
      bank_name TEXT NOT NULL,
      bank_account_no TEXT NOT NULL,
      bank_account_holder TEXT NOT NULL,
      bpjs_kesehatan_no TEXT,
      bpjs_ketenagakerjaan_no TEXT,

      -- Salary Base Configuration
      basic_salary REAL NOT NULL DEFAULT 0,
      fixed_allowance REAL NOT NULL DEFAULT 0,
      daily_meal_allowance REAL NOT NULL DEFAULT 0,
      daily_transport_allowance REAL NOT NULL DEFAULT 0,

      -- Leave balance
      annual_leave_quota INTEGER NOT NULL DEFAULT 12,
      annual_leave_used INTEGER NOT NULL DEFAULT 0,

      is_active INTEGER NOT NULL DEFAULT 1,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Users / RBAC
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER REFERENCES employees(id),
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'employee', -- admin, manager, employee
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Attendances
    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      date TEXT NOT NULL, -- YYYY-MM-DD
      clock_in TEXT,      -- HH:MM:SS
      clock_out TEXT,     -- HH:MM:SS
      clock_in_lat REAL,
      clock_in_lng REAL,
      clock_out_lat REAL,
      clock_out_lng REAL,
      status TEXT NOT NULL, -- on_time, late, early_leave, absent
      work_hours REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(employee_id, date)
    );

    -- Leave Requests
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      leave_type TEXT NOT NULL, -- tahunan, sakit, izin_khusus, unpaid
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_days INTEGER NOT NULL DEFAULT 1,
      reason TEXT NOT NULL,
      attachment_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
      approver_id INTEGER REFERENCES employees(id),
      approval_notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Overtime Requests
    CREATE TABLE IF NOT EXISTS overtime_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_hours REAL NOT NULL,
      notes TEXT,
      calculated_amount REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
      approver_id INTEGER REFERENCES employees(id),
      approval_notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Loans / Kasbon
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      loan_type TEXT NOT NULL DEFAULT 'Kasbon Operasional',
      total_amount REAL NOT NULL,
      monthly_installment REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- active, completed
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Payroll Periods
    CREATE TABLE IF NOT EXISTS payroll_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      working_days INTEGER NOT NULL DEFAULT 22,
      is_locked INTEGER NOT NULL DEFAULT 0,
      locked_at TEXT,
      total_gross_payout REAL DEFAULT 0,
      total_tax_payout REAL DEFAULT 0,
      total_net_payout REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(month, year)
    );

    -- Payroll Items (Slip Gaji per employee per period)
    CREATE TABLE IF NOT EXISTS payroll_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      
      -- Earnings breakdown
      basic_salary REAL NOT NULL,
      fixed_allowance REAL NOT NULL,
      variable_meal REAL NOT NULL,
      variable_transport REAL NOT NULL,
      present_days INTEGER NOT NULL,
      absent_days INTEGER NOT NULL,
      working_days INTEGER NOT NULL,
      overtime_hours REAL NOT NULL,
      overtime_pay REAL NOT NULL,
      bonus REAL NOT NULL DEFAULT 0,
      thr REAL NOT NULL DEFAULT 0,
      total_earnings REAL NOT NULL,

      -- Company BPJS (informational & taxable component)
      bpjs_kes_company REAL NOT NULL,
      bpjs_jkk_company REAL NOT NULL,
      bpjs_jkm_company REAL NOT NULL,
      bpjs_jht_company REAL NOT NULL,
      bpjs_jp_company REAL NOT NULL,

      -- Tax calculation
      gross_taxable_income REAL NOT NULL,
      ptkp_status TEXT NOT NULL,
      ter_category TEXT NOT NULL,
      ter_rate REAL NOT NULL,
      pph21_ter REAL NOT NULL,

      -- Employee Deductions
      bpjs_kes_employee REAL NOT NULL,
      bpjs_jht_employee REAL NOT NULL,
      bpjs_jp_employee REAL NOT NULL,
      alpha_deduction REAL NOT NULL DEFAULT 0,
      loan_deduction REAL NOT NULL DEFAULT 0,
      other_deductions REAL NOT NULL DEFAULT 0,
      total_deductions REAL NOT NULL,

      -- Take home pay
      take_home_pay REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(period_id, employee_id)
    );

    -- Indexes for fast queries
    CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);
    CREATE INDEX IF NOT EXISTS idx_attendances_emp_date ON attendances(employee_id, date);
    CREATE INDEX IF NOT EXISTS idx_leaves_status ON leave_requests(status);
    CREATE INDEX IF NOT EXISTS idx_overtime_status ON overtime_requests(status);
    CREATE INDEX IF NOT EXISTS idx_payroll_items_period ON payroll_items(period_id);

    -- Attendance Corrections (Koreksi Absensi)
    CREATE TABLE IF NOT EXISTS attendance_corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      attendance_id INTEGER REFERENCES attendances(id),
      date TEXT NOT NULL,
      correction_type TEXT NOT NULL DEFAULT 'clock_in_out',
      requested_clock_in TEXT,
      requested_clock_out TEXT,
      original_clock_in TEXT,
      original_clock_out TEXT,
      original_status TEXT,
      reason TEXT NOT NULL,
      attachment_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      approver_id INTEGER REFERENCES employees(id),
      approval_notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Audit Trail / Activity Log
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_values TEXT,
      new_values TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_corrections_status ON attendance_corrections(status);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);
}

