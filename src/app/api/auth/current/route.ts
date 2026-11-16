import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const db = getDb();
  const currentRole = req.cookies.get('user_role')?.value || 'admin';

  // Find user by role
  let user = db.prepare(`
    SELECT u.id as user_id, u.username, u.role,
           e.id as employee_id, e.nik, e.full_name, e.email, e.avatar_url,
           d.name as department_name, p.title as position_title
    FROM users u
    JOIN employees e ON u.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE u.role = ?
    LIMIT 1
  `).get(currentRole) as any;

  if (!user) {
    // fallback to first user
    user = db.prepare(`
      SELECT u.id as user_id, u.username, u.role,
             e.id as employee_id, e.nik, e.full_name, e.email, e.avatar_url,
             d.name as department_name, p.title as position_title
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      LIMIT 1
    `).get() as any;
  }

  return NextResponse.json({
    user,
    availableRoles: [
      { role: 'admin', label: 'Super Admin / HR Admin', employeeName: 'Budi Santoso' },
      { role: 'manager', label: 'Manager / Supervisor', employeeName: 'Rian Pratama' },
      { role: 'employee', label: 'Employee / ESS', employeeName: 'Dimas Arya' },
    ],
  });
}

