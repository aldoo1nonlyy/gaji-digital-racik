'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Compass,
  Building,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { formatDateIndo, OFFICE_COORDS } from '@/lib/utils';

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Live Clock-in State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [clockNotes, setNotes] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('4'); // Dimas Arya by default
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clockResult, setClockResult] = useState<any>(null);

  // Update clock live every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch employees for clock-in selector
  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => setAllEmployees(data.employees || []));
  }, []);

  // Fetch attendances for selected date
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance?date=${selectedDate}`);
      const json = await res.json();
      setAttendances(json.attendances || []);
      setSummary(json.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  // Handle GPS detection
  const detectLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          alert(`Koordinat GPS terdeteksi: Lat ${pos.coords.latitude.toFixed(4)}, Lng ${pos.coords.longitude.toFixed(4)}`);
        },
        (err) => {
          alert('Izin akses lokasi ditolak oleh browser. Menggunakan koordinat default simulasi SCBD.');
          setUserCoords({ lat: OFFICE_COORDS.latitude, lng: OFFICE_COORDS.longitude });
        }
      );
    } else {
      setUserCoords({ lat: OFFICE_COORDS.latitude, lng: OFFICE_COORDS.longitude });
    }
  };

  const handleSimulateInOffice = () => {
    // Within SCBD Office radius
    setUserCoords({ lat: -6.2255, lng: 106.8095 });
  };

  const handleSimulateOutOfOffice = () => {
    // Outside office (e.g. Monas Jakarta ~ 6.5 km away)
    setUserCoords({ lat: -6.1754, lng: 106.8272 });
  };

  const handleClockAction = async (type: 'clock_in' | 'clock_out') => {
    try {
      setIsSubmitting(true);
      setClockResult(null);

      // Default to office SCBD if coordinates not chosen
      const lat = userCoords?.lat ?? OFFICE_COORDS.latitude;
      const lng = userCoords?.lng ?? OFFICE_COORDS.longitude;

      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: Number(selectedEmployeeId),
          type,
          latitude: lat,
          longitude: lng,
          notes: clockNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setClockResult({ success: false, message: json.error, distance: json.distance });
        return;
      }

      setClockResult({ success: true, message: json.message, status: json.status, distance: json.distance });
      fetchAttendance();
    } catch (e: any) {
      setClockResult({ success: false, message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmpObj = allEmployees.find((e) => String(e.id) === String(selectedEmployeeId));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Presensi & Jam Kerja Real-Time</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sistem pencatatan kehadiran digital berbasis geofencing GPS SCBD Jakarta dan tagging otomatis On-Time / Terlambat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Pilih Tanggal Log:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs py-1.5 px-3 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Grid: Live Clock In/Out Terminal & Office Geofence Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Live Clock */}
        <div className="lg:col-span-2 bg-gradient-to-b from-white to-slate-50 rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Terminal Clock-in / Clock-out</span>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                Jam Kerja Standar: 09:00 - 18:00 WIB
              </span>
            </div>

            {/* Time Display */}
            <div className="my-6 text-center">
              <div className="text-4xl sm:text-5xl font-mono font-black text-slate-900 tracking-tight">
                {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {formatDateIndo(currentTime, true)} (Waktu Indonesia Barat)
              </p>
            </div>

            {/* Employee Selector for Testing */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Pilih Karyawan yang Melakukan Presensi:
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {allEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.nik} - {emp.full_name} ({emp.position_title} - {emp.department_name})
                  </option>
                ))}
              </select>

              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600 mb-1">Catatan Tambahan (Opsional):</label>
                <input
                  type="text"
                  placeholder="e.g. Bekerja di lantai 18 / Menghadiri client meeting"
                  value={clockNotes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Coordinates Simulator Buttons */}
            <div className="bg-slate-100 p-3 rounded-xl border border-slate-200/80 mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Validasi Lokasi GPS Presensi:</span>
                </span>
                <span className="text-[11px] font-mono text-slate-600">
                  {userCoords ? `Lat: ${userCoords.lat.toFixed(4)}, Lng: ${userCoords.lng.toFixed(4)}` : 'SCBD (Default)'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSimulateInOffice}
                  className="px-2.5 py-1.5 rounded-lg font-semibold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors border border-emerald-300"
                >
                  ✓ Simulasikan Dalam Kantor SCBD (0 meter)
                </button>
                <button
                  type="button"
                  onClick={handleSimulateOutOfOffice}
                  className="px-2.5 py-1.5 rounded-lg font-semibold bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors border border-rose-300"
                >
                  ✕ Simulasikan Luar Radius (~6.5 km)
                </button>
                <button
                  type="button"
                  onClick={detectLiveLocation}
                  className="px-2.5 py-1.5 rounded-lg font-medium bg-white text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300 flex items-center gap-1"
                >
                  <Compass className="w-3 h-3 text-blue-600" />
                  <span>Deteksi GPS Perangkat</span>
                </button>
              </div>
            </div>

            {/* Feedback Message */}
            {clockResult && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold mb-4 flex items-start gap-2.5 ${
                clockResult.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {clockResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p>{clockResult.message}</p>
                  {clockResult.distance !== undefined && (
                    <p className="text-[11px] font-normal mt-0.5 opacity-80">
                      Jarak dari titik pusat kantor: {clockResult.distance} meter
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Clock Buttons */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => handleClockAction('clock_in')}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Clock-in (Masuk Kantor)</span>
            </button>
            <button
              onClick={() => handleClockAction('clock_out')}
              disabled={isSubmitting}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 active:bg-black text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span>Clock-out (Pulang)</span>
            </button>
          </div>
        </div>

        {/* Office Geofencing & Rules Info Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ketentuan Geofencing</h3>
                <p className="text-[11px] text-slate-500">PT Nusantara Teknologi Maju</p>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Titik Kantor SCBD</span>
                <p className="font-semibold text-slate-800">Treasury Tower SCBD Lot 28</p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Lat: {OFFICE_COORDS.latitude}, Lng: {OFFICE_COORDS.longitude}
                </p>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  <span>Maks. Radius: {OFFICE_COORDS.radiusMeters} Meter</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
                  <p><strong>Tepat Waktu:</strong> Clock-in dilakukan sebelum atau pada pukul 09:00:00 WIB.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                  <p><strong>Terlambat:</strong> Clock-in di atas pukul 09:00 WIB otomatis tercatat late.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <p><strong>Pulang Lebih Awal:</strong> Clock-out sebelum pukul 17:00 WIB ditandai early leave.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5" />
                  <p><strong>Potongan Alpha:</strong> Absen tanpa keterangan dipotong prorata dari gaji.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Koordinat tersimpan secara aman dan terenkripsi.</span>
          </div>
        </div>
      </div>

      {/* Attendance Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Log Kehadiran Tanggal {formatDateIndo(selectedDate)}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {attendances.length} Log
            </span>
          </div>

          {/* Quick counts */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
              {summary?.onTime || 0} On-Time
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {summary?.late || 0} Late
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold">
              {summary?.absent || 0} Alpha
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Departemen & Posisi</th>
                <th className="py-3 px-4">Clock-In</th>
                <th className="py-3 px-4">Clock-Out</th>
                <th className="py-3 px-4">Durasi Kerja</th>
                <th className="py-3 px-4">Status & Tag</th>
                <th className="py-3 px-4">Catatan Presensi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Memuat log absensi...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Belum ada log presensi pada tanggal {formatDateIndo(selectedDate)}.
                  </td>
                </tr>
              ) : (
                attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={att.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={att.employee_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{att.employee_name}</p>
                          <p className="text-[10px] font-mono text-slate-400">{att.nik}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{att.position_title}</div>
                      <div className="text-[10px] text-slate-400">{att.department_name}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {att.clock_in || '-'}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {att.clock_out || '-'}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700">
                      {att.work_hours > 0 ? `${att.work_hours} Jam` : '-'}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        att.status === 'on_time'
                          ? 'bg-emerald-100 text-emerald-800'
                          : att.status === 'late'
                          ? 'bg-amber-100 text-amber-800'
                          : att.status === 'early_leave'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {att.status === 'on_time' ? 'Tepat Waktu' : att.status === 'late' ? 'Terlambat' : att.status === 'early_leave' ? 'Pulang Cepat' : 'Alpha'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {att.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

