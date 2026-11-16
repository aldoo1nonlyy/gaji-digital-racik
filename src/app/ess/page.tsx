'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  CalendarCheck2,
  CreditCard,
  Clock,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Printer,
  ChevronRight,
  Compass,
  Upload,
  Calendar,
  Hourglass,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Monitor,
  Send,
  X,
  FileCheck2,
  Info,
  Paperclip,
  Check
} from 'lucide-react';
import { formatRupiah, formatDateIndo, OFFICE_COORDS } from '@/lib/utils';
import { calculateOvertimePay } from '@/lib/payroll-engine';
import PayslipModal from '@/components/PayslipModal';

export default function ESSMobilePage() {
  // Navigation Tabs: 'home' | 'requests' | 'attendance' | 'payslips'
  const [activeTab, setActiveTab] = useState<'home' | 'requests' | 'attendance' | 'payslips'>('home');

  // View Mode: 'mobile_frame' (Phone Mockup) | 'fluid' (Desktop Responsive)
  const [viewMode, setViewMode] = useState<'mobile_frame' | 'fluid'>('mobile_frame');

  // User & Data States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employeeDetail, setEmployeeDetail] = useState<any>(null);
  const [myAttendances, setMyAttendances] = useState<any[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [myOvertime, setMyOvertime] = useState<any[]>([]);
  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Clock & GPS State
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({
    lat: OFFICE_COORDS.latitude,
    lng: OFFICE_COORDS.longitude,
  });
  const [isClocking, setIsClocking] = useState(false);
  const [clockToast, setClockToast] = useState<{ success: boolean; message: string } | null>(null);

  // Request Form States
  const [requestType, setRequestType] = useState<'cuti' | 'sakit' | 'lembur' | 'koreksi'>('cuti');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestToast, setRequestToast] = useState<string | null>(null);

  // Form Cuti
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
  });

  // Form Sakit
  const [sickForm, setSickForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: 1,
    reason: '',
    attachmentUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
    fileName: 'surat_keterangan_dokter_scbd.jpg',
  });

  // Form Lembur
  const [otForm, setOtForm] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '21:00',
    durationHours: 3,
    notes: '',
  });

  // Form Koreksi Absen
  const [corrForm, setCorrForm] = useState({
    date: new Date().toISOString().split('T')[0],
    requestedClockIn: '08:55',
    requestedClockOut: '18:05',
    reason: '',
  });
  const [myCorrections, setMyCorrections] = useState<any[]>([]);

  // Attendance History Filter
  const [attendanceMonth, setAttendanceMonth] = useState('11');
  const [attendanceYear, setAttendanceYear] = useState('2026');

  // Payslip Modal State
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedPayslipData, setSelectedPayslipData] = useState<any>(null);
  const [payslipLoading, setPayslipLoading] = useState(false);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all user ESS data
  const fetchESSData = async () => {
    try {
      setLoading(true);
      // 1. Current user
      const authRes = await fetch('/api/auth/current');
      const authJson = await authRes.json();
      const user = authJson.user;
      setCurrentUser(user);

      const empId = user?.employee_id || 4; // Dimas Arya

      // 2. Employee Details
      const empRes = await fetch(`/api/employees/${empId}`);
      const empJson = await empRes.json();
      setEmployeeDetail(empJson.employee);

      // 3. Attendances
      const attRes = await fetch(`/api/attendance?employeeId=${empId}`);
      const attJson = await attRes.json();
      setMyAttendances(attJson.attendances || []);

      // 4. Leaves
      const leaveRes = await fetch(`/api/leaves?employeeId=${empId}`);
      const leaveJson = await leaveRes.json();
      setMyLeaves(leaveJson.leaves || []);

      // 5. Overtime
      const otRes = await fetch(`/api/overtime?employeeId=${empId}`);
      const otJson = await otRes.json();
      setMyOvertime(otJson.overtimeList || []);

      // 6. Attendance Corrections
      const corrRes = await fetch(`/api/attendance-corrections?employeeId=${empId}`);
      const corrJson = await corrRes.json();
      setMyCorrections(corrJson.corrections || []);

      // 7. Payslips
      const payRes = await fetch(`/api/payroll/items?employeeId=${empId}`);
      const payJson = await payRes.json();
      setMyPayslips(payJson.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchESSData();
  }, []);

  // Today's attendance record for current employee
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = useMemo(() => {
    return myAttendances.find((a) => a.date === todayStr);
  }, [myAttendances, todayStr]);

  // GPS Distance Check
  const distanceToOffice = useMemo(() => {
    if (!userCoords) return 0;
    // Simple approx for UI
    const isSCBD = Math.abs(userCoords.lat - OFFICE_COORDS.latitude) < 0.001 && Math.abs(userCoords.lng - OFFICE_COORDS.longitude) < 0.001;
    return isSCBD ? 0 : 5900;
  }, [userCoords]);

  const isWithinRadius = distanceToOffice <= OFFICE_COORDS.radiusMeters;

  // Handle Live Clock In / Clock Out
  const handleClock = async (type: 'clock_in' | 'clock_out') => {
    if (!employeeDetail?.id) return;
    try {
      setIsClocking(true);
      setClockToast(null);

      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeDetail.id,
          type,
          latitude: userCoords.lat,
          longitude: userCoords.lng,
          notes: 'Presensi via Aplikasi Mobile ESS Mekari Talenta',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setClockToast({ success: false, message: json.error });
        return;
      }

      setClockToast({ success: true, message: json.message });
      fetchESSData();
    } catch (e: any) {
      setClockToast({ success: false, message: e.message });
    } finally {
      setIsClocking(false);
    }
  };

  // Submit Request Cuti
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeDetail?.id) return;

    try {
      setIsSubmittingRequest(true);
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeDetail.id,
          leaveType: 'tahunan',
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          totalDays: Number(leaveForm.totalDays) || 1,
          reason: leaveForm.reason,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengajukan cuti');
        return;
      }

      setRequestToast('Pengajuan cuti tahunan berhasil dikirim!');
      setTimeout(() => setRequestToast(null), 4000);
      setLeaveForm({ ...leaveForm, reason: '' });
      fetchESSData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Submit Request Sakit
  const handleSubmitSick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeDetail?.id) return;

    try {
      setIsSubmittingRequest(true);
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeDetail.id,
          leaveType: 'sakit',
          startDate: sickForm.startDate,
          endDate: sickForm.endDate,
          totalDays: Number(sickForm.totalDays) || 1,
          reason: sickForm.reason,
          attachmentUrl: sickForm.attachmentUrl,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengajukan izin sakit');
        return;
      }

      setRequestToast('Pengajuan izin sakit beserta surat dokter berhasil dikirim!');
      setTimeout(() => setRequestToast(null), 4000);
      setSickForm({ ...sickForm, reason: '' });
      fetchESSData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Submit Request Lembur
  const handleSubmitOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeDetail?.id) return;

    try {
      setIsSubmittingRequest(true);
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeDetail.id,
          date: otForm.date,
          startTime: otForm.startTime,
          endTime: otForm.endTime,
          durationHours: Number(otForm.durationHours) || 1,
          notes: otForm.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengajukan lembur');
        return;
      }

      setRequestToast('Pengajuan lembur berhasil dikirim ke atasan!');
      setTimeout(() => setRequestToast(null), 4000);
      setOtForm({ ...otForm, notes: '' });
      fetchESSData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Submit Request Koreksi Absen
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeDetail?.id) return;

    try {
      setIsSubmittingRequest(true);
      const res = await fetch('/api/attendance-corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employeeDetail.id,
          date: corrForm.date,
          requestedClockIn: corrForm.requestedClockIn ? corrForm.requestedClockIn + ':00' : '09:00:00',
          requestedClockOut: corrForm.requestedClockOut ? corrForm.requestedClockOut + ':00' : '18:00:00',
          reason: corrForm.reason,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengajukan koreksi');
        return;
      }

      setRequestToast('Pengajuan koreksi presensi berhasil dikirim ke atasan/HR!');
      setTimeout(() => setRequestToast(null), 4000);
      setCorrForm({ ...corrForm, reason: '' });
      fetchESSData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // View Payslip Modal
  const handleOpenPayslip = async (itemId: number) => {
    try {
      setPayslipLoading(true);
      const res = await fetch(`/api/payroll/payslip/${itemId}`);
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal memuat slip gaji');
        return;
      }
      setSelectedPayslipData(json);
      setIsPayslipModalOpen(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPayslipLoading(false);
    }
  };

  // Sisa kuota cuti
  const remainingLeaveQuota = useMemo(() => {
    const total = employeeDetail?.annual_leave_quota || 12;
    const used = employeeDetail?.annual_leave_used || 0;
    return Math.max(0, total - used);
  }, [employeeDetail]);

  // Estimasi upah lembur form
  const estimatedOTWage = useMemo(() => {
    if (!employeeDetail) return 0;
    return calculateOvertimePay(
      employeeDetail.basic_salary,
      employeeDetail.fixed_allowance,
      Number(otForm.durationHours) || 0
    );
  }, [employeeDetail, otForm.durationHours]);

  return (
    <div className="space-y-4">
      {/* Top Bar Controls: View Mode Switcher */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800">Mekari Talenta Mobile ESS (Portal Karyawan)</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
            Employee Self-Service
          </span>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewMode('mobile_frame')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              viewMode === 'mobile_frame'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>Mobile App Frame</span>
          </button>
          <button
            onClick={() => setViewMode('fluid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
              viewMode === 'fluid'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span>Full Responsive</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className={`mx-auto transition-all ${viewMode === 'mobile_frame' ? 'max-w-[420px]' : 'max-w-4xl'}`}>
        {/* Smartphone Shell (when mobile_frame selected) */}
        <div className={`bg-white overflow-hidden ${
          viewMode === 'mobile_frame'
            ? 'rounded-[36px] border-[8px] border-slate-900 shadow-2xl relative min-h-[780px]'
            : 'rounded-2xl border border-slate-200 shadow-md min-h-[600px]'
        } flex flex-col`}>

          {/* Phone Speaker & Camera Notch (Mobile Frame Only) */}
          {viewMode === 'mobile_frame' && (
            <div className="bg-slate-900 h-6 w-full flex items-center justify-center">
              <div className="w-20 h-3.5 bg-black rounded-b-xl flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-8 h-1 rounded-full bg-slate-800" />
              </div>
            </div>
          )}

          {/* App Header (Talenta Style Deep Blue Gradient) */}
          <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#2563EB] text-white px-5 pt-4 pb-5 relative shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={employeeDetail?.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-white/30 shadow-md"
                />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-blue-200 flex items-center gap-1">
                    <span>PT Nusantara Teknologi Maju</span>
                  </div>
                  <h1 className="text-sm font-extrabold leading-tight text-white">
                    {employeeDetail?.full_name || 'Dimas Arya Wicaksana'}
                  </h1>
                  <p className="text-[10px] text-blue-200 font-medium">
                    {employeeDetail?.position_title || 'Senior Fullstack Developer'} • {employeeDetail?.nik}
                  </p>
                </div>
              </div>

              {/* Shift Pill */}
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/30 text-[9px] font-bold">
                  Regular Shift
                </span>
                <p className="text-[9px] text-blue-200 mt-0.5">09:00 - 18:00 WIB</p>
              </div>
            </div>
          </div>

          {/* Main App Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 bg-slate-50 text-slate-800">

            {/* TAB 1: BERANDA (Home & Clock In) */}
            {activeTab === 'home' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. Live Digital Clock & Geofencing Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Presensi Live SCBD</span>
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatDateIndo(currentTime, true)}
                    </span>
                  </div>

                  {/* Digital Clock Display */}
                  <div className="my-4 text-center">
                    <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-slate-900">
                      {currentTime.toLocaleTimeString('id-ID', { hour12: false })}
                    </div>
                    <p className="text-[10px] font-bold text-blue-600 mt-0.5">Waktu Indonesia Barat (WIB)</p>
                  </div>

                  {/* GPS Radius & Geofence Indicator */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 text-[11px]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>Lokasi Anda Saat Ini:</span>
                      </span>
                      <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        isWithinRadius
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isWithinRadius ? '✓ Dalam Radius Kantor' : '✕ Di Luar Radius'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      {isWithinRadius
                        ? `SCBD Lot 28 Jakarta (${distanceToOffice}m dari pusat kantor, maks. 250m)`
                        : `Terdeteksi ${distanceToOffice}m dari SCBD. Presensi hanya diizinkan di dalam radius 250m.`}
                    </p>

                    {/* Quick GPS simulation buttons */}
                    <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => setUserCoords({ lat: OFFICE_COORDS.latitude, lng: OFFICE_COORDS.longitude })}
                        className={`flex-1 py-1 px-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          isWithinRadius
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        🏢 Di Kantor (0m)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUserCoords({ lat: -6.1754, lng: 106.8272 })}
                        className={`flex-1 py-1 px-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          !isWithinRadius
                            ? 'bg-rose-600 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        🚗 Luar SCBD (5.9km)
                      </button>
                    </div>
                  </div>

                  {/* Toast Feedback */}
                  {clockToast && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold mb-3 flex items-start gap-2 ${
                      clockToast.success
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}>
                      {clockToast.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-[11px] leading-tight">{clockToast.message}</p>
                    </div>
                  )}

                  {/* Action Buttons: Clock In & Clock Out */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => handleClock('clock_in')}
                      disabled={isClocking || (todayAttendance && !!todayAttendance.clock_in)}
                      className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        todayAttendance?.clock_in
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-500/20 cursor-pointer'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{todayAttendance?.clock_in ? 'Sudah Clock-in' : 'Clock In Masuk'}</span>
                    </button>

                    <button
                      onClick={() => handleClock('clock_out')}
                      disabled={isClocking || !todayAttendance?.clock_in || !!todayAttendance?.clock_out}
                      className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        !todayAttendance?.clock_in || todayAttendance?.clock_out
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                          : 'bg-slate-900 hover:bg-black text-white shadow-slate-900/20 cursor-pointer'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>{todayAttendance?.clock_out ? 'Sudah Clock-out' : 'Clock Out Pulang'}</span>
                    </button>
                  </div>

                  {/* Today check-in status banner */}
                  {todayAttendance?.clock_in && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Presensi Hari Ini:</span>
                      <span className="font-bold text-slate-800">
                        Masuk: {todayAttendance.clock_in} WIB ({todayAttendance.status === 'late' ? 'Terlambat' : 'On-Time'})
                        {todayAttendance.clock_out && ` • Pulang: ${todayAttendance.clock_out} WIB`}
                      </span>
                    </div>
                  )}
                </div>

                {/* 2. Jadwal Shift Hari Ini Card */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Jadwal Shift Hari Ini</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Jam Masuk</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">09:00 WIB</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Istirahat</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">12:00 - 13:00</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Jam Pulang</span>
                      <span className="font-extrabold text-slate-800 mt-0.5 block">18:00 WIB</span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>Lokasi: Treasury Tower Lt. 28, District 8 SCBD Jakarta</span>
                  </div>
                </div>

                {/* 3. Quick Stats: Hak Cuti & Gaji Terakhir */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Sisa Cuti */}
                  <div
                    onClick={() => { setActiveTab('requests'); setRequestType('cuti'); }}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sisa Hak Cuti</span>
                      <CalendarCheck2 className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900">
                      {remainingLeaveQuota} <span className="text-xs font-semibold text-slate-400">Hari</span>
                    </div>
                    <p className="text-[10px] text-blue-600 font-semibold mt-0.5 flex items-center gap-0.5">
                      <span>Ajukan Cuti</span>
                      <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>

                  {/* Slip Gaji Terakhir */}
                  <div
                    onClick={() => setActiveTab('payslips')}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Gaji Terakhir</span>
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="mt-2 text-sm font-black text-emerald-700 truncate">
                      {myPayslips.length > 0 ? formatRupiah(myPayslips[0].take_home_pay) : 'Rp 14.477.335'}
                    </div>
                    <p className="text-[10px] text-emerald-800 font-semibold mt-0.5 flex items-center gap-0.5">
                      <span>Buka Slip Gaji</span>
                      <ChevronRight className="w-3 h-3" />
                    </p>
                  </div>
                </div>

                {/* 4. Quick Action Short Cuts */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2.5">
                    Layanan Mandiri Karyawan
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <button
                      onClick={() => { setActiveTab('requests'); setRequestType('cuti'); }}
                      className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-100 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                    >
                      <CalendarCheck2 className="w-5 h-5 text-blue-600" />
                      <span className="text-[10px] font-bold">Cuti Tahunan</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('requests'); setRequestType('sakit'); }}
                      className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Paperclip className="w-5 h-5 text-amber-600" />
                      <span className="text-[10px] font-bold">Izin Sakit</span>
                    </button>
                    <button
                      onClick={() => { setActiveTab('requests'); setRequestType('lembur'); }}
                      className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-100 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Hourglass className="w-5 h-5 text-purple-600" />
                      <span className="text-[10px] font-bold">Lembur (OT)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REQUEST CENTER (Pengajuan Cuti, Izin Sakit, Lembur) */}
            {activeTab === 'requests' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Request Type Selector Pills */}
                <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold gap-1">
                  <button
                    type="button"
                    onClick={() => setRequestType('cuti')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      requestType === 'cuti'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏖️ Cuti Tahunan
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('sakit')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      requestType === 'sakit'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏥 Izin Sakit
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('lembur')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      requestType === 'lembur'
                        ? 'bg-white text-purple-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⏱️ Lembur (OT)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestType('koreksi')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      requestType === 'koreksi'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📝 Koreksi
                  </button>
                </div>

                {/* Toast feedback */}
                {requestToast && (
                  <div className="bg-emerald-600 text-white p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{requestToast}</span>
                  </div>
                )}

                {/* 1. Form Cuti Tahunan */}
                {requestType === 'cuti' && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-800">Formulir Pengajuan Cuti Tahunan</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Sisa Kuota: {remainingLeaveQuota} Hari
                      </span>
                    </div>

                    <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Mulai Cuti *</label>
                          <input
                            type="date"
                            required
                            value={leaveForm.startDate}
                            onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Sampai Dengan *</label>
                          <input
                            type="date"
                            required
                            value={leaveForm.endDate}
                            onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Total Hari Kerja *</label>
                        <input
                          type="number"
                          min="1"
                          max={remainingLeaveQuota}
                          required
                          value={leaveForm.totalDays}
                          onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: Number(e.target.value) || 1 })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Maksimal pengajuan: {remainingLeaveQuota} hari kerja sesuai sisa hak cuti Anda.
                        </p>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Alasan Pengajuan Cuti *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Contoh: Keperluan keluarga atau istirahat tahunan..."
                          value={leaveForm.reason}
                          onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingRequest || remainingLeaveQuota <= 0}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Pengajuan Cuti</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 2. Form Izin Sakit (Upload Surat Dokter) */}
                {requestType === 'sakit' && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-800">Formulir Izin Sakit (Surat Dokter)</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Tidak Memotong Kuota Cuti
                      </span>
                    </div>

                    <form onSubmit={handleSubmitSick} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Mulai Sakit *</label>
                          <input
                            type="date"
                            required
                            value={sickForm.startDate}
                            onChange={(e) => setSickForm({ ...sickForm, startDate: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Sampai Tanggal *</label>
                          <input
                            type="date"
                            required
                            value={sickForm.endDate}
                            onChange={(e) => setSickForm({ ...sickForm, endDate: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Keterangan / Diagnosa Dokter *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Contoh: Demam berdarah / radang tenggorokan..."
                          value={sickForm.reason}
                          onChange={(e) => setSickForm({ ...sickForm, reason: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Upload Dokumen Surat Dokter */}
                      <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                        <label className="block text-amber-900 font-bold mb-1 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-amber-700" />
                          <span>Lampiran Surat Keterangan Dokter *</span>
                        </label>
                        <p className="text-[10px] text-amber-800/80 mb-2">
                          Wajib melampirkan foto/surat dokter dari klinik atau rumah sakit resmi.
                        </p>

                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-200">
                          <div className="w-7 h-7 rounded bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            PDF
                          </div>
                          <div className="flex-1 truncate">
                            <p className="text-[11px] font-semibold text-slate-800 truncate">{sickForm.fileName}</p>
                            <p className="text-[9px] text-slate-400">Terlampir otomatis (Surat Rawat Dokter)</p>
                          </div>
                          <span className="text-[10px] text-blue-600 font-bold">Siap Kirim</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Izin Sakit</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. Form Lembur (Overtime) */}
                {requestType === 'lembur' && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-800">Formulir Pengajuan Lembur Kemenaker</span>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        PP 35/2021
                      </span>
                    </div>

                    <form onSubmit={handleSubmitOvertime} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Tanggal Lembur *</label>
                        <input
                          type="date"
                          required
                          value={otForm.date}
                          onChange={(e) => setOtForm({ ...otForm, date: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Jam Mulai *</label>
                          <input
                            type="time"
                            required
                            value={otForm.startTime}
                            onChange={(e) => setOtForm({ ...otForm, startTime: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Jam Selesai *</label>
                          <input
                            type="time"
                            required
                            value={otForm.endTime}
                            onChange={(e) => setOtForm({ ...otForm, endTime: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Durasi Lembur (Jam) *</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max="8"
                          required
                          value={otForm.durationHours}
                          onChange={(e) => setOtForm({ ...otForm, durationHours: Number(e.target.value) || 1 })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      {/* Live Overtime Wage Estimation Box */}
                      <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                            Estimasi Upah Lembur Kemenaker
                          </span>
                          <p className="text-[10px] text-purple-900/80">
                            1.5x di jam 1, 2.0x jam ke-2+ (Dasar 1/173 upah sebulan)
                          </p>
                        </div>
                        <span className="text-base font-black text-purple-800">
                          {formatRupiah(estimatedOTWage)}
                        </span>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Uraian Tugas / Task Lembur *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Contoh: Deployment rilis fitur pembayaran core banking..."
                          value={otForm.notes}
                          onChange={(e) => setOtForm({ ...otForm, notes: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Pengajuan Lembur</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 4. Form Koreksi Absen */}
                {requestType === 'koreksi' && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                      <span className="font-bold text-slate-800">Formulir Koreksi Absensi / Kehadiran</span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Koreksi GPS/Jam
                      </span>
                    </div>

                    <form onSubmit={handleSubmitCorrection} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Tanggal yang Dikoreksi *</label>
                        <input
                          type="date"
                          required
                          value={corrForm.date}
                          onChange={(e) => setCorrForm({ ...corrForm, date: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Jam Masuk Koreksi *</label>
                          <input
                            type="time"
                            required
                            value={corrForm.requestedClockIn}
                            onChange={(e) => setCorrForm({ ...corrForm, requestedClockIn: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Jam Pulang Koreksi *</label>
                          <input
                            type="time"
                            required
                            value={corrForm.requestedClockOut}
                            onChange={(e) => setCorrForm({ ...corrForm, requestedClockOut: e.target.value })}
                            className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Alasan Koreksi *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Jelaskan alasan (misal: Lupa check-out karena meeting klien di luar kantor / kendala sinyal GPS)..."
                          value={corrForm.reason}
                          onChange={(e) => setCorrForm({ ...corrForm, reason: e.target.value })}
                          className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Koreksi Absensi</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* 5. Riwayat Seluruh Pengajuan Karyawan */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800">Riwayat Pengajuan Saya</span>
                    <span className="text-[10px] text-slate-400">
                      {myLeaves.length + myOvertime.length + myCorrections.length} Pengajuan
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Leaves list */}
                    {myLeaves.map((l) => (
                      <div key={`l-${l.id}`} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 capitalize">
                              {l.leave_type === 'sakit' ? '🏥 Izin Sakit' : '🏖️ Cuti Tahunan'}
                            </span>
                            <span className="text-[10px] text-slate-400">({l.total_days} Hari)</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatDateIndo(l.start_date)}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{l.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            l.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : l.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {l.status === 'approved' ? '✓ Disetujui' : l.status === 'pending' ? '⏳ Menunggu' : '✕ Ditolak'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Overtime list */}
                    {myOvertime.map((ot) => (
                      <div key={`ot-${ot.id}`} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">⏱️ Lembur ({ot.duration_hours} Jam)</span>
                            <span className="text-[10px] font-semibold text-purple-700">{formatRupiah(ot.calculated_amount)}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatDateIndo(ot.date)} • {ot.start_time}-{ot.end_time}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{ot.notes}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            ot.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : ot.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ot.status === 'approved' ? '✓ Disetujui' : ot.status === 'pending' ? '⏳ Menunggu' : '✕ Ditolak'}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Attendance Corrections list */}
                    {myCorrections.map((c) => (
                      <div key={`corr-${c.id}`} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">📝 Koreksi Absensi</span>
                            <span className="text-[10px] font-semibold text-emerald-700">
                              {c.requested_clock_in?.substring(0, 5)} - {c.requested_clock_out?.substring(0, 5)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{formatDateIndo(c.date)}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{c.reason}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            c.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {c.status === 'approved' ? '✓ Disetujui' : c.status === 'pending' ? '⏳ Menunggu' : '✕ Ditolak'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ATTENDANCE LOG (Riwayat Absensi Pribadi) */}
            {activeTab === 'attendance' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Monthly Summary Cards */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800">Rekapitulasi Kehadiran Pribadi</span>
                    <span className="font-semibold text-blue-600">November 2026</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3 text-center">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Hadir</span>
                      <span className="text-base font-black text-slate-800 mt-0.5 block">
                        {myAttendances.length}
                      </span>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <span className="text-[9px] text-emerald-700 font-bold uppercase block">On-Time</span>
                      <span className="text-base font-black text-emerald-700 mt-0.5 block">
                        {myAttendances.filter(a => a.status === 'on_time').length}
                      </span>
                    </div>
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <span className="text-[9px] text-amber-700 font-bold uppercase block">Late</span>
                      <span className="text-base font-black text-amber-700 mt-0.5 block">
                        {myAttendances.filter(a => a.status === 'late').length}
                      </span>
                    </div>
                    <div className="bg-blue-50 p-2 rounded-xl border border-blue-200">
                      <span className="text-[9px] text-blue-700 font-bold uppercase block">Avg Jam</span>
                      <span className="text-base font-black text-blue-700 mt-0.5 block">9.2j</span>
                    </div>
                  </div>
                </div>

                {/* Daily Attendance List */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                  <span className="text-xs font-bold text-slate-800 block pb-1 border-b border-slate-100">
                    Log Presensi Harian ({myAttendances.length} Catatan)
                  </span>

                  <div className="space-y-2">
                    {myAttendances.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400">
                        Belum ada catatan kehadiran yang tersimpan.
                      </div>
                    ) : (
                      myAttendances.map((att) => (
                        <div key={att.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{formatDateIndo(att.date)}</span>
                              <span className={`inline-block px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                att.status === 'on_time'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : att.status === 'late'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {att.status === 'on_time' ? 'Tepat Waktu' : att.status === 'late' ? 'Terlambat' : 'Pulang Cepat'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                              <span>In: <strong>{att.clock_in || '-'}</strong></span>
                              <span>•</span>
                              <span>Out: <strong>{att.clock_out || '-'}</strong></span>
                              {att.work_hours > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-700 font-bold">{att.work_hours} Jam Kerja</span>
                                </>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{att.notes || 'Presensi SCBD'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: MY PAYSLIPS (Slip Gaji Saya) */}
            {activeTab === 'payslips' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Arsip Slip Gaji Saya (Confidential)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Hanya Anda yang Dapat Mengakses</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                    Daftar slip gaji resmi yang telah disetujui HR. Anda dapat memeriksa rincian pendapatan, potongan BPJS, pajak PPh 21 TER, serta mengunduh format PDF.
                  </p>
                </div>

                {/* Payslip Cards List */}
                <div className="space-y-3">
                  {myPayslips.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                      Belum ada slip gaji yang dirilis untuk akun Anda.
                    </div>
                  ) : (
                    myPayslips.map((slip) => (
                      <div
                        key={slip.id}
                        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Periode Penggajian
                            </span>
                            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                              {slip.month === 10 ? 'Oktober 2026' : slip.month === 11 ? 'November 2026' : `Bulan ${slip.month} ${slip.year}`}
                            </h3>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            slip.is_locked
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {slip.is_locked ? '✓ Final & Disetujui' : 'Draft Siap Rilis'}
                          </span>
                        </div>

                        {/* Breakdown Preview */}
                        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                          <div className="text-slate-500">Gaji Pokok:</div>
                          <div className="text-right font-semibold text-slate-800">{formatRupiah(slip.basic_salary)}</div>

                          <div className="text-slate-500">Tunjangan & Lembur:</div>
                          <div className="text-right font-semibold text-slate-800">
                            +{formatRupiah((slip.fixed_allowance || 0) + (slip.variable_meal || 0) + (slip.variable_transport || 0) + (slip.overtime_pay || 0))}
                          </div>

                          <div className="text-slate-500">Potongan BPJS & Pajak:</div>
                          <div className="text-right font-semibold text-rose-600">
                            -{formatRupiah(slip.total_deductions)}
                          </div>
                        </div>

                        {/* Net Pay Box */}
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 block">
                              Gaji Bersih (Take Home Pay)
                            </span>
                            <span className="text-[10px] text-emerald-900 font-medium">Ditransfer ke {employeeDetail?.bank_name || 'BCA'}</span>
                          </div>
                          <span className="text-base font-black text-emerald-700">
                            {formatRupiah(slip.take_home_pay)}
                          </span>
                        </div>

                        {/* Action: Open Payslip Modal / Download PDF */}
                        <div className="pt-1">
                          <button
                            onClick={() => handleOpenPayslip(slip.id)}
                            disabled={payslipLoading}
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat & Unduh Slip Gaji (PDF)</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Mobile Navigation Bar (Mekari Talenta App Navigation) */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 px-3 flex items-center justify-around z-20 shadow-lg">
            {/* 1. Beranda */}
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
                activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className={`text-[10px] mt-1 ${activeTab === 'home' ? 'font-bold' : 'font-medium'}`}>
                Beranda
              </span>
            </button>

            {/* 2. Pengajuan */}
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
                activeTab === 'requests' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <CalendarCheck2 className="w-5 h-5" />
              <span className={`text-[10px] mt-1 ${activeTab === 'requests' ? 'font-bold' : 'font-medium'}`}>
                Pengajuan
              </span>
            </button>

            {/* 3. Absensi */}
            <button
              onClick={() => setActiveTab('attendance')}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
                activeTab === 'attendance' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className={`text-[10px] mt-1 ${activeTab === 'attendance' ? 'font-bold' : 'font-medium'}`}>
                Absensi
              </span>
            </button>

            {/* 4. Slip Gaji */}
            <button
              onClick={() => setActiveTab('payslips')}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
                activeTab === 'payslips' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span className={`text-[10px] mt-1 ${activeTab === 'payslips' ? 'font-bold' : 'font-medium'}`}>
                Slip Gaji
              </span>
            </button>
          </div>

        </div>
      </div>

      {/* Official Payslip Modal for Employee Preview & PDF Download */}
      <PayslipModal
        isOpen={isPayslipModalOpen}
        onClose={() => setIsPayslipModalOpen(false)}
        payslipData={selectedPayslipData}
      />
    </div>
  );
}
