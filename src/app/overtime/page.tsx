'use client';

import React, { useState, useEffect } from 'react';
import {
  Hourglass,
  Plus,
  Clock,
  Calculator,
  Check,
  X,
  Filter,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { calculateOvertimePay } from '@/lib/payroll-engine';

export default function OvertimePage() {
  const [overtimeList, setOvertimeList] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Form State
  const [form, setForm] = useState({
    employeeId: '4', // Dimas Arya by default
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '21:00',
    durationHours: '3',
    notes: '',
  });

  const fetchOvertime = async () => {
    try {
      setLoading(true);
      const url = selectedStatus === 'all' ? '/api/overtime' : `/api/overtime?status=${selectedStatus}`;
      const res = await fetch(url);
      const json = await res.json();
      setOvertimeList(json.overtimeList || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOvertime();
  }, [selectedStatus]);

  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => setEmployees(data.employees || []));
  }, []);

  const selectedEmp = employees.find((e) => String(e.id) === String(form.employeeId));
  const hourlyWage = selectedEmp ? (selectedEmp.basic_salary + selectedEmp.fixed_allowance) / 173 : 0;
  const estimatedAmount = selectedEmp
    ? calculateOvertimePay(selectedEmp.basic_salary, selectedEmp.fixed_allowance, Number(form.durationHours))
    : 0;

  const handleCreateOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengajukan lembur');
        return;
      }

      alert('Pengajuan lembur berhasil dikirim.');
      setIsModalOpen(false);
      setForm({ ...form, notes: '' });
      fetchOvertime();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReject = async (otId: number, status: 'approved' | 'rejected') => {
    const promptNotes = prompt(
      status === 'approved'
        ? 'Catatan persetujuan (opsional):'
        : 'Alasan penolakan pengajuan lembur:'
    );

    if (status === 'rejected' && promptNotes === null) return;

    try {
      setActionLoadingId(otId);
      const res = await fetch(`/api/overtime/${otId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approverId: 1, // Super Admin
          approvalNotes: promptNotes || '',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal memproses pengajuan lembur');
        return;
      }

      fetchOvertime();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen & Kalkulasi Lembur (Overtime)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan upah lembur resmi Kemenaker (1.5x upah sejam di jam ke-1, 2.0x di jam berikutnya, tarif = 1/173 upah sebulan).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Lembur</span>
        </button>
      </div>

      {/* Regulation Formula Callout */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-600 text-white flex-shrink-0 mt-0.5">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-blue-900">Ketentuan Perhitungan Upah Lembur PP No. 35/2021</h4>
            <p className="text-blue-800/80 mt-0.5 leading-relaxed">
              <strong>Upah Sejam:</strong> 1/173 × (Gaji Pokok + Tunjangan Tetap) • <strong>Jam Pertama:</strong> 1.5 × Upah Sejam • <strong>Jam Ke-2 dst:</strong> 2.0 × Upah Sejam.
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="inline-block px-3 py-1 rounded bg-blue-100 text-blue-900 font-bold border border-blue-200">
            Kemenaker Compliant
          </span>
        </div>
      </div>

      {/* Table and Filter */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Daftar Pengajuan Lembur Karyawan</h2>
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1 px-2.5 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="approved">Disetujui (Approved)</option>
              <option value="rejected">Ditolak (Rejected)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Tanggal & Jam Lembur</th>
                <th className="py-3 px-4">Durasi</th>
                <th className="py-3 px-4">Kalkulasi Upah Lembur</th>
                <th className="py-3 px-4">Catatan Pekerjaan</th>
                <th className="py-3 px-4">Status & Approver</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Memuat data lembur...
                  </td>
                </tr>
              ) : overtimeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada data lembur yang sesuai filter.
                  </td>
                </tr>
              ) : (
                overtimeList.map((ot) => (
                  <tr key={ot.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={ot.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={ot.employee_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{ot.employee_name}</p>
                          <p className="text-[10px] text-slate-400">{ot.department_name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{formatDateIndo(ot.date)}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {ot.start_time} - {ot.end_time} WIB
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {ot.duration_hours} Jam
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-blue-700">{formatRupiah(ot.calculated_amount)}</div>
                      <div className="text-[10px] text-slate-400">
                        Upah Sejam: {formatRupiah((ot.basic_salary + ot.fixed_allowance) / 173)}
                      </div>
                    </td>

                    <td className="py-3 px-4 max-w-xs text-slate-700">
                      <p className="truncate">{ot.notes || '-'}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        ot.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ot.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {ot.status === 'approved' ? '✓ Disetujui' : ot.status === 'pending' ? '⏳ Menunggu' : '✕ Ditolak'}
                      </span>
                      {ot.approver_name && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Oleh: {ot.approver_name}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {ot.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApproveReject(ot.id, 'approved')}
                            disabled={actionLoadingId === ot.id}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            title="Setujui Lembur"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleApproveReject(ot.id, 'rejected')}
                            disabled={actionLoadingId === ot.id}
                            className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                            title="Tolak Lembur"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pengajuan Lembur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Formulir Pengajuan Lembur</h3>
                <p className="text-xs text-slate-400 mt-0.5">Kalkulasi upah otomatis sesuai standar Kemenaker</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOvertime} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Karyawan yang Lembur *</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nik} - {emp.full_name} ({emp.position_title})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Tanggal Lembur *</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Jam Mulai Lembur *</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Jam Selesai Lembur *</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Total Jam Lembur *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="14"
                  required
                  value={form.durationHours}
                  onChange={(e) => setForm({ ...form, durationHours: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              {/* Live Preview Box of Calculated Overtime Wage */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-900">Upah Lembur Dihasilkan:</span>
                  <span className="font-black text-sm text-blue-700">{formatRupiah(estimatedAmount)}</span>
                </div>
                <p className="text-[10px] text-blue-700/80">
                  Upah sejam: {formatRupiah(hourlyWage)} • Durasi {form.durationHours} jam dihitung 1.5x (jam ke-1) + 2.0x (jam ke-2 dst).
                </p>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Uraian Tugas / Alasan Lembur *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Bugfix kritis modul pembayaran, rilis produksi, dll."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isSubmitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Kirim Pengajuan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

