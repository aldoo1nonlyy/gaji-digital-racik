import Database from 'better-sqlite3';
import { NextRequest } from 'next/server';

export interface AuditLogEntry {
  userId?: number | null;
  userName?: string;
  userRole?: string;
  action: 
    | 'UPDATE_SALARY'
    | 'CORRECT_ATTENDANCE'
    | 'APPROVE_LEAVE'
    | 'REJECT_LEAVE'
    | 'APPROVE_OVERTIME'
    | 'REJECT_OVERTIME'
    | 'APPROVE_CORRECTION'
    | 'REJECT_CORRECTION'
    | 'LOCK_PAYROLL'
    | 'UNLOCK_PAYROLL'
    | 'GENERATE_PAYROLL'
    | 'ADJUST_PAYROLL_ITEM'
    | 'SYNC_PAYROLL'
    | string;
  entityType: 'employee' | 'attendance' | 'attendance_correction' | 'leave_request' | 'overtime_request' | 'payroll_period' | 'payroll_item' | string;
  entityId: string | number | bigint;
  oldValues?: Record<string, any> | null;
  newValues?: Record<string, any> | null;
  notes?: string | null;
}

/**
 * Get current authenticated user from request cookie or fallback
 */
export function getCurrentSessionUser(req: NextRequest, db: Database.Database) {
  const currentRole = req.cookies.get('user_role')?.value || 'admin';

  let user = db.prepare(`
    SELECT u.id as user_id, u.username, u.role,
           e.id as employee_id, e.nik, e.full_name, e.email, e.avatar_url
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    WHERE u.role = ?
    LIMIT 1
  `).get(currentRole) as any;

  if (!user) {
    user = {
      user_id: 1,
      username: 'budi_admin',
      role: currentRole,
      employee_id: 1,
      full_name: 'Budi Santoso, S.Kom.',
    };
  }

  return user;
}

/**
 * Record an audit log entry in SQLite
 */
export function logAudit(db: Database.Database, entry: AuditLogEntry) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        user_id, user_name, user_role, action, entity_type, entity_id,
        old_values, new_values, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.userId || null,
      entry.userName || 'System / Admin',
      entry.userRole || 'admin',
      entry.action,
      entry.entityType,
      String(entry.entityId),
      entry.oldValues ? JSON.stringify(entry.oldValues) : null,
      entry.newValues ? JSON.stringify(entry.newValues) : null,
      entry.notes || null
    );
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
}
