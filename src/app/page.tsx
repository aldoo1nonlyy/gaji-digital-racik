'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CalendarCheck2,
  Hourglass,
  BadgePercent,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/summary')
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-semibold text-slate-600">Memuat Ringkasan HR Executive...</p>
        </div>
      </div>
    );
  }

  const { employeeStats, attendanceSummary, approvals, departmentDistribution, lastLockedPeriod, expenseTrend } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold mb-3">
            <span>Sistem HRIS & Payroll Sesuai Regulasi Indonesia</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            Selamat Datang di Portal PT Nusantara Teknologi Maju
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed">
            Kelola data karyawan, validasi presensi GPS SCBD Jakarta, persetujuan cuti & lembur, serta kalkulasi otomatis PPh 21 TER 2024 dan BPJS Ketenagakerjaan/Kesehatan.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-blue-400/10 to-transparent pointer-events-none" />
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Active Employees */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Karyawan Aktif</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{employeeStats?.active || 0}</span>
            <span className="text-xs text-slate-500">dari {employeeStats?.total || 0} total</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex gap-2">
            <span className="text-emerald-700 font-semibold">{employeeStats?.permanent || 0} PKWTT</span> • 
            <span className="text-blue-700 font-semibold">{employeeStats?.contract || 0} PKWT</span> • 
            <span className="text-amber-700 font-semibold">{employeeStats?.probation || 0} Percobaan</span>
          </div>
        </div>

        {/* Metric 2: Today Attendance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Hadir Hari Ini</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{attendanceSummary?.present || 0}</span>
            <span className="text-xs text-slate-500">/ {attendanceSummary?.totalActive || 0} staf</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex gap-1.5">
            <span className="text-emerald-700 font-semibold">{attendanceSummary?.onTime || 0} Tepat Waktu</span> • 
            <span className="text-amber-700 font-semibold">{attendanceSummary?.late || 0} Terlambat</span>
          </div>
        </div>

        {/* Metric 3: Pending Approvals */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Persetujuan</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Hourglass className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              {(approvals?.pendingLeavesCount || 0) + (approvals?.pendingOvertimeCount || 0)}
            </span>
            <span className="text-xs text-slate-500">pengajuan</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex gap-2">
            <span className="font-semibold text-slate-700">{approvals?.pendingLeavesCount || 0} Cuti</span> • 
            <span className="font-semibold text-slate-700">{approvals?.pendingOvertimeCount || 0} Lembur</span>
          </div>
        </div>

        {/* Metric 4: Payroll Expense Last Period */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Penggajian Terakhir</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BadgePercent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-black text-slate-900 truncate block">
              {formatRupiah(lastLockedPeriod?.total_net_payout || 92100000)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-700 font-semibold">Periode 10/2026 (Locked)</span>
          </div>
        </div>
      </div>

      {/* Grid: Attendance Breakdown + Payroll Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Live Breakdown Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Status Kehadiran Hari Ini</span>
              </h2>
              <Link href="/attendance" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                <span>Detail</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Attendance Progress Bars */}
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">Hadir Tepat Waktu</span>
                  <span className="font-bold text-emerald-700">{attendanceSummary?.onTime || 0} Orang</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full"
                    style={{ width: `${((attendanceSummary?.onTime || 0) / (attendanceSummary?.totalActive || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">Terlambat Masuk</span>
                  <span className="font-bold text-amber-700">{attendanceSummary?.late || 0} Orang</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2.5 rounded-full"
                    style={{ width: `${((attendanceSummary?.late || 0) / (attendanceSummary?.totalActive || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">Sedang Cuti / Sakit Resmi</span>
                  <span className="font-bold text-blue-700">{attendanceSummary?.onLeave || 0} Orang</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${((attendanceSummary?.onLeave || 0) / (attendanceSummary?.totalActive || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">Alpha / Belum Hadir</span>
                  <span className="font-bold text-rose-700">{attendanceSummary?.absent || 0} Orang</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-rose-500 h-2.5 rounded-full"
                    style={{ width: `${((attendanceSummary?.absent || 0) / (attendanceSummary?.totalActive || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Radius Geofence: <strong>250 meter</strong></span>
            <span className="text-emerald-700 font-semibold">Lokasi: SCBD Jakarta</span>
          </div>
        </div>

        {/* Monthly Payroll Expense Trend Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <span>Tren Biaya Gaji & Pajak PPh 21 Bulanan</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualisasi perbandingan Penghasilan Bruto, Pajak TER, dan Take Home Pay
                </p>
              </div>
              <Link href="/payroll" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                <span>Kelola Payroll</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Custom Interactive SVG / Visual Bar Chart */}
            <div className="h-44 w-full flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
              {expenseTrend?.map((item: any, idx: number) => {
                const maxVal = 110000000;
                const grossHeight = Math.round((item.totalGross / maxVal) * 100);
                const netHeight = Math.round((item.totalNet / maxVal) * 100);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                      <div>Bruto: {formatRupiah(item.totalGross)}</div>
                      <div className="text-emerald-400">Net: {formatRupiah(item.totalNet)}</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1.5 h-32">
                      {/* Gross Bar */}
                      <div
                        className="w-1/2 bg-blue-200 group-hover:bg-blue-300 rounded-t transition-all"
                        style={{ height: `${grossHeight}%` }}
                      />
                      {/* Net Bar */}
                      <div
                        className="w-1/2 bg-blue-600 group-hover:bg-blue-700 rounded-t transition-all shadow-sm"
                        style={{ height: `${netHeight}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 truncate">{item.month}</span>
                  </div>
                );
              })}
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-200" />
                <span>Total Bruto Perusahaan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-blue-600" />
                <span className="font-semibold text-slate-800">Gaji Bersih Diterima (THP)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>PPh 21 TER Otomatis Kategori A, B, C</span>
            <span className="text-blue-700 font-semibold">PP 58/2023 & PMK 168/2023</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Pending Approvals Table & Department Headcount */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Widget (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-amber-500" />
                <span>Daftar Pengajuan Cuti & Lembur Menunggu Persetujuan</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Persetujuan tim oleh Atasan / HR Admin</p>
            </div>
            <div className="flex gap-2">
              <Link href="/leaves" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Lihat Cuti
              </Link>
              <span className="text-slate-300">•</span>
              <Link href="/overtime" className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                Lihat Lembur
              </Link>
            </div>
          </div>

          <div className="space-y-3">
            {/* Pending Leaves */}
            {approvals?.pendingLeaves?.length > 0 ? (
              approvals.pendingLeaves.map((leave: any) => (
                <div key={leave.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-blue-200 bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={leave.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{leave.employee_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold uppercase">
                          Cuti {leave.leave_type} ({leave.total_days} hari)
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{leave.reason}</p>
                    </div>
                  </div>
                  <Link
                    href="/leaves"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    Tinjau
                  </Link>
                </div>
              ))
            ) : null}

            {/* Pending Overtime */}
            {approvals?.pendingOvertime?.length > 0 ? (
              approvals.pendingOvertime.map((ot: any) => (
                <div key={ot.id} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 hover:border-blue-200 bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <img
                      src={ot.avatar_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}
                      alt="Avatar"
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{ot.employee_name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold uppercase">
                          Lembur ({ot.duration_hours} Jam) • {formatRupiah(ot.calculated_amount)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{ot.notes}</p>
                    </div>
                  </div>
                  <Link
                    href="/overtime"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors"
                  >
                    Tinjau
                  </Link>
                </div>
              ))
            ) : null}

            {approvals?.pendingLeaves?.length === 0 && approvals?.pendingOvertime?.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                Tidak ada pengajuan cuti atau lembur yang menunggu persetujuan saat ini.
              </div>
            )}
          </div>
        </div>

        {/* Department Headcount Distribution */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Distribusi Departemen</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">Headcount</span>
            </div>

            <div className="space-y-3">
              {departmentDistribution?.map((dept: any) => (
                <div key={dept.code} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-7 text-[10px] font-bold text-slate-500 bg-slate-100 py-0.5 rounded text-center">
                      {dept.code}
                    </span>
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{dept.count} Staf</span>
                    <span className="text-slate-400 text-[10px]">
                      ({Math.round((dept.count / (employeeStats?.active || 1)) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/employees"
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Buka Direktori Karyawan</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
