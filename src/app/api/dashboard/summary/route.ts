import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    // Total employees
    const empStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN employment_status = 'PKWTT' THEN 1 ELSE 0 END) as permanent,
        SUM(CASE WHEN employment_status = 'PKWT' THEN 1 ELSE 0 END) as contract,
        SUM(CASE WHEN employment_status = 'Probation' THEN 1 ELSE 0 END) as probation
      FROM employees
    `).get() as any;

    // Today's attendance
    const attendanceStats = db.prepare(`
      SELECT 
        COUNT(*) as total_logged,
        SUM(CASE WHEN status = 'on_time' THEN 1 ELSE 0 END) as on_time,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'early_leave' THEN 1 ELSE 0 END) as early_leave,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
      FROM attendances
      WHERE date = ?
    `).get(today) as any;

    // Today on approved leave
    const onLeaveToday = db.prepare(`
      SELECT COUNT(*) as count
      FROM leave_requests
      WHERE status = 'approved' AND ? BETWEEN start_date AND end_date
    `).get(today) as any;

    const presentCount = (attendanceStats?.on_time || 0) + (attendanceStats?.late || 0) + (attendanceStats?.early_leave || 0);
    const lateCount = attendanceStats?.late || 0;
    const leaveCount = onLeaveToday?.count || 0;
    const activeTotal = empStats?.active || 0;
    const absentCount = Math.max(0, activeTotal - presentCount - leaveCount);

    // Pending approvals
    const pendingLeaves = db.prepare(`
      SELECT lr.id, lr.leave_type, lr.start_date, lr.end_date, lr.total_days, lr.reason, lr.created_at,
             e.full_name as employee_name, e.nik, e.avatar_url, d.name as department_name
      FROM leave_requests lr
      JOIN employees e ON lr.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE lr.status = 'pending'
      ORDER BY lr.created_at DESC
      LIMIT 5
    `).all() as any[];

    const pendingOvertime = db.prepare(`
      SELECT ot.id, ot.date, ot.start_time, ot.end_time, ot.duration_hours, ot.notes, ot.calculated_amount, ot.created_at,
             e.full_name as employee_name, e.nik, e.avatar_url, d.name as department_name
      FROM overtime_requests ot
      JOIN employees e ON ot.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE ot.status = 'pending'
      ORDER BY ot.created_at DESC
      LIMIT 5
    `).all() as any[];

    // Department Headcount
    const departmentDistribution = db.prepare(`
      SELECT d.name, d.code, COUNT(e.id) as count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.is_active = 1
      GROUP BY d.id
      ORDER BY count DESC
    `).all() as any[];

    // Latest Payroll Period
    const latestPeriod = db.prepare(`
      SELECT * FROM payroll_periods
      ORDER BY year DESC, month DESC
      LIMIT 1
    `).get() as any;

    // Previous locked period (for expense summary)
    const lastLockedPeriod = db.prepare(`
      SELECT * FROM payroll_periods
      WHERE is_locked = 1
      ORDER BY year DESC, month DESC
      LIMIT 1
    `).get() as any;

    // Monthly payroll trend simulation (Past 5 months + Current)
    const expenseTrend = [
      { month: 'Jun 2026', totalGross: 98500000, totalTax: 7420000, totalNet: 86900000 },
      { month: 'Jul 2026', totalGross: 101200000, totalTax: 7850000, totalNet: 89100000 },
      { month: 'Agu 2026', totalGross: 102400000, totalTax: 7920000, totalNet: 90200000 },
      { month: 'Sep 2026', totalGross: 103800000, totalTax: 8100000, totalNet: 91400000 },
      {
        month: 'Okt 2026',
        totalGross: lastLockedPeriod?.total_gross_payout || 104500000,
        totalTax: lastLockedPeriod?.total_tax_payout || 8200000,
        totalNet: lastLockedPeriod?.total_net_payout || 92100000
      },
    ];

    return NextResponse.json({
      employeeStats: empStats,
      attendanceSummary: {
        totalActive: activeTotal,
        present: presentCount,
        onTime: attendanceStats?.on_time || 0,
        late: lateCount,
        onLeave: leaveCount,
        absent: absentCount,
      },
      approvals: {
        pendingLeavesCount: pendingLeaves.length,
        pendingOvertimeCount: pendingOvertime.length,
        pendingLeaves,
        pendingOvertime,
      },
      departmentDistribution,
      latestPeriod,
      lastLockedPeriod,
      expenseTrend,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
