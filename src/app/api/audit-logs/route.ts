import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const action = req.nextUrl.searchParams.get('action');
    const entityType = req.nextUrl.searchParams.get('entityType');
    const search = req.nextUrl.searchParams.get('search');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

    let query = `
      SELECT 
        a.*,
        u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (action && action !== 'all') {
      query += ` AND a.action = ?`;
      params.push(action);
    }

    if (entityType && entityType !== 'all') {
      query += ` AND a.entity_type = ?`;
      params.push(entityType);
    }

    if (search) {
      query += ` AND (
        a.user_name LIKE ? OR 
        a.action LIKE ? OR 
        a.notes LIKE ? OR 
        a.entity_id LIKE ?
      )`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    // Total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const totalCount = db.prepare(countQuery).get(...params) as { total: number };

    query += ` ORDER BY a.id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);

    return NextResponse.json({
      logs,
      total: totalCount?.total || 0,
      limit,
      offset,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
