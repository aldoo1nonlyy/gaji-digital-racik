import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { calculateDistance, OFFICE_COORDS } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { employeeId, type, latitude, longitude, notes, bypassLocation } = body;

    if (!employeeId || !type) {
      return NextResponse.json({ error: 'Parameter tidak lengkap (employeeId, type)' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentTimeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

    // Verify employee exists
    const employee = db.prepare('SELECT id, full_name FROM employees WHERE id = ?').get(employeeId) as any;
    if (!employee) {
      return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
    }

    // GPS Geofence validation
    let distance = 0;
    if (latitude !== undefined && longitude !== undefined) {
      distance = calculateDistance(latitude, longitude, OFFICE_COORDS.latitude, OFFICE_COORDS.longitude);
      const isWithinRadius = distance <= OFFICE_COORDS.radiusMeters;

      if (!isWithinRadius && !bypassLocation) {
        return NextResponse.json({
          error: `Lokasi Anda berada di luar radius kantor (${distance}m dari SCBD). Batas maksimal radius adalah ${OFFICE_COORDS.radiusMeters}m.`,
          distance,
          officeCoords: OFFICE_COORDS,
        }, { status: 403 });
      }
    }

    // Check existing attendance today
    const existing = db.prepare('SELECT * FROM attendances WHERE employee_id = ? AND date = ?').get(employeeId, today) as any;

    if (type === 'clock_in') {
      if (existing && existing.clock_in) {
        return NextResponse.json({ error: `Anda sudah melakukan Clock-in hari ini pada pukul ${existing.clock_in}` }, { status: 400 });
      }

      // Determine On-Time vs Late (Threshold: 09:00:00)
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isLate = hours > 9 || (hours === 9 && minutes > 0);
      const status = isLate ? 'late' : 'on_time';
      const autoNotes = notes || (isLate ? `Terlambat (${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')})` : 'Presensi tepat waktu');

      if (existing) {
        db.prepare(`
          UPDATE attendances SET
            clock_in = ?, clock_in_lat = ?, clock_in_lng = ?, status = ?, notes = ?
          WHERE id = ?
        `).run(currentTimeStr, latitude || null, longitude || null, status, autoNotes, existing.id);
      } else {
        db.prepare(`
          INSERT INTO attendances (
            employee_id, date, clock_in, clock_in_lat, clock_in_lng, status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(employeeId, today, currentTimeStr, latitude || null, longitude || null, status, autoNotes);
      }

      return NextResponse.json({
        success: true,
        message: `Clock-in berhasil pada pukul ${currentTimeStr} (${status === 'late' ? 'Terlambat' : 'Tepat Waktu'})`,
        status,
        clockInTime: currentTimeStr,
        distance,
      });
    } else if (type === 'clock_out') {
      if (!existing || !existing.clock_in) {
        return NextResponse.json({ error: 'Anda belum melakukan Clock-in hari ini.' }, { status: 400 });
      }

      if (existing.clock_out) {
        return NextResponse.json({ error: `Anda sudah melakukan Clock-out pada pukul ${existing.clock_out}` }, { status: 400 });
      }

      // Calculate work hours
      const [inH, inM, inS] = existing.clock_in.split(':').map(Number);
      const clockInDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), inH, inM, inS);
      const diffMs = now.getTime() - clockInDate.getTime();
      const workHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

      // Status check: if leaving before 17:00, marked as early_leave if not already late
      const isEarly = now.getHours() < 17;
      let newStatus = existing.status;
      if (isEarly && existing.status === 'on_time') {
        newStatus = 'early_leave';
      }

      db.prepare(`
        UPDATE attendances SET
          clock_out = ?, clock_out_lat = ?, clock_out_lng = ?, work_hours = ?, status = ?
        WHERE id = ?
      `).run(currentTimeStr, latitude || null, longitude || null, workHours, newStatus, existing.id);

      return NextResponse.json({
        success: true,
        message: `Clock-out berhasil pada pukul ${currentTimeStr}. Durasi kerja: ${workHours} jam.`,
        clockOutTime: currentTimeStr,
        workHours,
        distance,
      });
    }

    return NextResponse.json({ error: 'Tipe clock tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

