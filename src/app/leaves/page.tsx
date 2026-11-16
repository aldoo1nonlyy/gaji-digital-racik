'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  User,
  Filter,
  Paperclip,
  Check,
  X
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
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
    leaveType: 'tahunan',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    totalDays: '1',
    reason: '',
    attachmentUrl: '',
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const url = selectedStatus === 'all' ? '/api/leaves' : `/api/leaves?status=${selectedStatus}`;
      const res = await fetch(url);
      const json = await res.json();
      setLeaves(json.leaves || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [selectedStatus]);

  useEffect(() => {
    fetch('/api/employees')
      .then((res) => res.json())
      .then((data) => setEmployees(data.employees || []));
  }, []);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengajukan cuti');
        return;
      }

      alert('Pengajuan cuti berhasil dikirim');
      setIsModalOpen(false);
      setForm({
        ...form,
        reason: '',
        attachmentUrl: '',
      });
      fetchLeaves();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveReject = async (leaveId: number, status: 'approved' | 'rejected') => {
    const promptNotes = prompt(
      status === 'approved'
        ? 'Catatan persetujuan (opsional):'
        : 'Alasan penolakan pengajuan cuti:'
    );

    if (status === 'rejected' && promptNotes === null) return;

    try {
      setActionLoadingId(leaveId);
      const res = await fetch(`/api/leaves/${leaveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approverId: 1, // Super Admin Budi Santoso
          approvalNotes: promptNotes || '',
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal memproses pengajuan');
        return;
      }

      fetchLeaves();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const selectedEmp = employees.find((e) => String(e.id) === String(form.employeeId));
  const remainingQuota = (selectedEmp?.annual_leave_quota || 12) - (selectedEmp?.annual_leave_used || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Manajemen Cuti & Izin Karyawan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pelacakan kuota cuti tahunan (12 hari/tahun UU Ketenagakerjaan) dan alur persetujuan bertingkat.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajukan Cuti / Izin</span>
        </button>
      </div>

      {/* Leave Quota Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Standar Kuota Tahunan</span>
          <div className="mt-2 text-2xl font-black text-slate-900">12 Hari</div>
          <p className="text-[11px] text-slate-400 mt-1">Sesuai Pasal 79 UU Ketenagakerjaan No. 13/2003</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Menunggu Persetujuan</span>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {leaves.filter((l) => l.status === 'pending').length} Pengajuan
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Perlu ditinjau oleh Manager / HR Lead</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cuti Disetujui Bulan Ini</span>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {leaves.filter((l) => l.status === 'approved').length} Disetujui
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tercatat dalam rekapitulasi presensi</p>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Daftar Pengajuan Cuti & Izin</h2>
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
                <th className="py-3 px-4">Tipe Cuti</th>
                <th className="py-3 px-4">Periode Tanggal</th>
                <th className="py-3 px-4">Durasi</th>
                <th className="py-3 px-4">Alasan & Dokumen</th>
                <th className="py-3 px-4">Status & Approval</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Memuat data cuti...
                  </td>
                </tr>
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada pengajuan cuti yang ditemukan.
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={leave.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={leave.employee_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900">{leave.employee_name}</p>
                          <p className="text-[10px] text-slate-400">{leave.department_name}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        leave.leave_type === 'tahunan'
                          ? 'bg-blue-100 text-blue-800'
                          : leave.leave_type === 'sakit'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {leave.leave_type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formatDateIndo(leave.start_date)} s/d {formatDateIndo(leave.end_date)}
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800">
                      {leave.total_days} Hari
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-700 truncate">{leave.reason}</p>
                      {leave.attachment_url && (
                        <a
                          href={leave.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Lampiran Dokumen</span>
                        </a>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        leave.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : leave.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {leave.status === 'approved' ? '✓ Disetujui' : leave.status === 'pending' ? '⏳ Menunggu' : '✕ Ditolak'}
                      </span>
                      {leave.approver_name && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Oleh: {leave.approver_name}
                        </p>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {leave.status === 'pending' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApproveReject(leave.id, 'approved')}
                            disabled={actionLoadingId === leave.id}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            title="Setujui Cuti"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleApproveReject(leave.id, 'rejected')}
                            disabled={actionLoadingId === leave.id}
                            className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors"
                            title="Tolak Cuti"
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

      {/* Modal Form Pengajuan Cuti */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Formulir Pengajuan Cuti & Izin</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pengajuan resmi ke atasan langsung & HR</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLeave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Karyawan yang Mengajukan *</label>
                <select
                  value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nik} - {emp.full_name} (Sisa Cuti: {emp.annual_leave_quota - emp.annual_leave_used} hari)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Jenis Cuti / Izin *</label>
                <select
                  value={form.leaveType}
                  onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="tahunan">Cuti Tahunan (Potong Kuota)</option>
                  <option value="sakit">Izin Sakit (Surat Dokter)</option>
                  <option value="izin_khusus">Izin Khusus (Menikah / Duka Cita / Melahirkan)</option>
                  <option value="unpaid">Cuti Di Luar Tanggungan (Unpaid Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tanggal Selesai *</label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Total Hari Kerja *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={form.totalDays}
                  onChange={(e) => setForm({ ...form, totalDays: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Alasan Pengajuan Cuti *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan keperluan cuti secara jelas..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Link Lampiran / Surat Dokter (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau link gambar"
                  value={form.attachmentUrl}
                  onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
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

