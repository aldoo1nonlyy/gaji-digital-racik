'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  CalendarCheck2,
  Hourglass,
  FileText,
  AlertCircle,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  ArrowRight,
  TrendingUp,
  User,
  Building,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'leave' | 'correction' | 'overtime' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<any[]>([]);

  // Approval Data
  const [data, setData] = useState<{
    counts: { pendingLeaves: number; pendingOvertime: number; pendingCorrections: number; totalPending: number };
    leaves: any[];
    overtimes: any[];
    corrections: any[];
  }>({
    counts: { pendingLeaves: 0, pendingOvertime: 0, pendingCorrections: 0, totalPending: 0 },
    leaves: [],
    overtimes: [],
    corrections: [],
  });

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    item: any | null;
    requestType: 'leave' | 'overtime' | 'correction';
    action: 'approved' | 'rejected';
    notes: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    item: null,
    requestType: 'leave',
    action: 'approved',
    notes: '',
    isSubmitting: false,
  });

  // Notification Toast & Sync Result
  const [syncNotice, setSyncNotice] = useState<{
    message: string;
    synced: boolean;
    periodName?: string;
    takeHomePay?: number;
  } | null>(null);

  // Fetch departments & approvals
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [apprRes, deptRes] = await Promise.all([
        fetch(`/api/approvals?status=${activeTab === 'history' ? 'all' : 'pending'}&departmentId=${selectedDept === 'all' ? '' : selectedDept}&search=${searchQuery}`),
        fetch('/api/employees') // to get departments
      ]);

      const apprJson = await apprRes.json();
      const deptJson = await deptRes.json();

      setData(apprJson);
      setDepartments(deptJson.departments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [activeTab, selectedDept]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApprovals();
  };

  // Open Approval / Rejection Modal
  const openActionModal = (item: any, requestType: 'leave' | 'overtime' | 'correction', action: 'approved' | 'rejected') => {
    setActionModal({
      isOpen: true,
      item,
      requestType,
      action,
      notes: action === 'approved' ? 'Disetujui.' : 'Pengajuan ditolak karena alasan operasional.',
      isSubmitting: false,
    });
  };

  // Submit Approval / Rejection
  const handleSubmitAction = async () => {
    if (!actionModal.item) return;

    try {
      setActionModal((prev) => ({ ...prev, isSubmitting: true }));
      let endpoint = '';
      if (actionModal.requestType === 'leave') {
        endpoint = `/api/leaves/${actionModal.item.id}`;
      } else if (actionModal.requestType === 'overtime') {
        endpoint = `/api/overtime/${actionModal.item.id}`;
      } else if (actionModal.requestType === 'correction') {
        endpoint = `/api/attendance-corrections/${actionModal.item.id}`;
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: actionModal.action,
          approvalNotes: actionModal.notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal memproses persetujuan');
        return;
      }

      // Show sync banner if payroll was auto-updated
      if (json.syncResult && json.syncResult.synced) {
        setSyncNotice({
          message: json.syncResult.message,
          synced: true,
          periodName: json.syncResult.periodName,
          takeHomePay: json.syncResult.takeHomePay,
        });
        setTimeout(() => setSyncNotice(null), 8000);
      } else {
        setSyncNotice({
          message: json.message,
          synced: false,
        });
        setTimeout(() => setSyncNotice(null), 5000);
      }

      setActionModal({ isOpen: false, item: null, requestType: 'leave', action: 'approved', notes: '', isSubmitting: false });
      fetchApprovals();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setActionModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // Filter items according to active tab
  let displayedItems: any[] = [];
  if (activeTab === 'pending') {
    // Unified pending list
    displayedItems = [
      ...data.leaves.filter((l) => l.status === 'pending'),
      ...data.corrections.filter((c) => c.status === 'pending'),
      ...data.overtimes.filter((o) => o.status === 'pending'),
    ];
  } else if (activeTab === 'leave') {
    displayedItems = data.leaves.filter((l) => l.status === 'pending');
  } else if (activeTab === 'correction') {
    displayedItems = data.corrections.filter((c) => c.status === 'pending');
  } else if (activeTab === 'overtime') {
    displayedItems = data.overtimes.filter((o) => o.status === 'pending');
  } else if (activeTab === 'history') {
    // All approved or rejected
    displayedItems = [
      ...data.leaves.filter((l) => l.status !== 'pending'),
      ...data.corrections.filter((c) => c.status !== 'pending'),
      ...data.overtimes.filter((o) => o.status !== 'pending'),
    ].sort((a, b) => b.id - a.id);
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Inbox className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Inbox Approval (Pusat Persetujuan)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
              {data.counts.totalPending} Menunggu
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kelola persetujuan Cuti, Koreksi Absen, dan Lembur. Pengajuan yang disetujui otomatis disinkronkan ke perhitungan Payroll & tercatat di Audit Log.
          </p>
        </div>

        <button
          onClick={fetchApprovals}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Auto Payroll Sync Banner Notification */}
      {syncNotice && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-md animate-in fade-in slide-in-from-top-2 ${
          syncNotice.synced
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-blue-50 border-blue-200 text-blue-900'
        }`}>
          <div className={`p-1.5 rounded-lg ${syncNotice.synced ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold">{syncNotice.synced ? 'Sinkronisasi Payroll Otomatis Berhasil!' : 'Pemberitahuan Sistem'}</p>
            <p className="mt-0.5 text-slate-700 leading-relaxed">{syncNotice.message}</p>
            {syncNotice.takeHomePay !== undefined && (
              <p className="mt-1 font-semibold text-emerald-800">
                Nilai THP Karyawan pada Draft {syncNotice.periodName}: <span className="font-black">{formatRupiah(syncNotice.takeHomePay)}</span>
              </p>
            )}
          </div>
          <button onClick={() => setSyncNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pending */}
        <div 
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'pending'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Total Pending</span>
            <Inbox className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{data.counts.totalPending}</span>
            <span className="text-[11px] text-slate-500">butuh aksi</span>
          </div>
        </div>

        {/* Card 2: Cuti Pending */}
        <div 
          onClick={() => setActiveTab('leave')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'leave'
              ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Cuti & Izin</span>
            <CalendarCheck2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{data.counts.pendingLeaves}</span>
            <span className="text-[11px] text-slate-500">pengajuan</span>
          </div>
        </div>

        {/* Card 3: Koreksi Absen Pending */}
        <div 
          onClick={() => setActiveTab('correction')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'correction'
              ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Koreksi Absen</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{data.counts.pendingCorrections}</span>
            <span className="text-[11px] text-slate-500">permohonan</span>
          </div>
        </div>

        {/* Card 4: Lembur Pending */}
        <div 
          onClick={() => setActiveTab('overtime')}
          className={`cursor-pointer p-4 rounded-xl border transition-all ${
            activeTab === 'overtime'
              ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Lembur (Overtime)</span>
            <Hourglass className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{data.counts.pendingOvertime}</span>
            <span className="text-[11px] text-slate-500">menunggu</span>
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'pending'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Pending ({data.counts.totalPending})
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'leave'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cuti ({data.counts.pendingLeaves})
          </button>
          <button
            onClick={() => setActiveTab('correction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'correction'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Koreksi Absen ({data.counts.pendingCorrections})
          </button>
          <button
            onClick={() => setActiveTab('overtime')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'overtime'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lembur ({data.counts.pendingOvertime})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Selesai
          </button>
        </div>

        {/* Search & Department Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama karyawan / NIK..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </form>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-600">Memuat data pengajuan approval...</p>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Semua Pengajuan Selesai</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada pengajuan yang membutuhkan persetujuan pada tab ini. Seluruh pengajuan telah diselesaikan.
            </p>
          </div>
        ) : (
          displayedItems.map((item) => {
            const isLeave = item.request_type === 'leave';
            const isCorrection = item.request_type === 'correction';
            const isOvertime = item.request_type === 'overtime';

            return (
              <div
                key={`${item.request_type}-${item.id}`}
                className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                {/* Employee Info & Request Type */}
                <div className="flex items-start gap-4">
                  <img
                    src={item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={item.employee_name}
                    className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-100 flex-shrink-0"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.employee_name}</span>
                      <span className="text-xs text-slate-400 font-mono">({item.nik})</span>
                      
                      {/* Request Type Badge */}
                      {isLeave && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                          <CalendarCheck2 className="w-3 h-3" />
                          <span>Cuti {item.leave_type?.toUpperCase()}</span>
                        </span>
                      )}
                      {isCorrection && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Koreksi Absen</span>
                        </span>
                      )}
                      {isOvertime && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Hourglass className="w-3 h-3" />
                          <span>Lembur ({item.duration_hours} Jam)</span>
                        </span>
                      )}

                      {/* Status Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        item.status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : item.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {item.status === 'pending' ? 'Menunggu Approval' : item.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.position_title} • <span className="font-medium text-slate-700">{item.department_name}</span>
                    </p>

                    {/* Request Specific Details */}
                    <div className="mt-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 max-w-2xl">
                      {isLeave && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">Periode Cuti:</span>
                            <span>{formatDateIndo(item.start_date)} s/d {formatDateIndo(item.end_date)} ({item.total_days} hari kerja)</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">Alasan:</span> {item.reason}
                          </div>
                          {item.attachment_url && (
                            <div className="pt-1">
                              <a
                                href={item.attachment_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Lihat Lampiran Surat Keterangan Dokter</span>
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {isCorrection && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">Tanggal Absen:</span>
                            <span>{formatDateIndo(item.date)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px]">
                            <span className="text-slate-500">
                              Semula: <span className="font-mono text-slate-700">{item.original_clock_in || '-'} s/d {item.original_clock_out || '-'}</span> ({item.original_status || 'absent'})
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-emerald-700 font-bold">
                              Koreksi: <span className="font-mono">{item.requested_clock_in || '09:00'} s/d {item.requested_clock_out || '18:00'}</span>
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">Alasan Koreksi:</span> {item.reason}
                          </div>
                        </div>
                      )}

                      {isOvertime && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">Tanggal & Jam:</span>
                            <span>{formatDateIndo(item.date)} ({item.start_time} - {item.end_time} WIB)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">Estimasi Upah Lembur (PP 35/2021):</span>
                            <span className="font-bold text-amber-800">{formatRupiah(item.calculated_amount)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-800">Uraian Pekerjaan:</span> {item.reason}
                          </div>
                        </div>
                      )}

                      {/* Approval Notes / Approver Info if resolved */}
                      {item.status !== 'pending' && (
                        <div className="mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                          <span className="font-semibold">Diproses oleh:</span> {item.approver_name || 'HR Admin'} • 
                          <span className="font-semibold ml-1">Catatan:</span> {item.approval_notes || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Pending Items */}
                {item.status === 'pending' ? (
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => openActionModal(item, item.request_type, 'rejected')}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak</span>
                    </button>
                    <button
                      onClick={() => openActionModal(item, item.request_type, 'approved')}
                      className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm rounded-xl transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-right text-xs text-slate-400 font-mono">
                    ID #{item.id}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal with Notes */}
      {actionModal.isOpen && actionModal.item && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className={`px-6 py-4 border-b flex items-center justify-between ${
              actionModal.action === 'approved' ? 'bg-emerald-50 text-emerald-900 border-emerald-100' : 'bg-rose-50 text-rose-900 border-rose-100'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {actionModal.action === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-600" />
                )}
                <span>
                  {actionModal.action === 'approved' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
                </span>
              </div>
              <button
                onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500">Karyawan Pemohon:</p>
                <p className="font-bold text-sm text-slate-900">
                  {actionModal.item.employee_name} <span className="font-normal text-slate-500 font-mono">({actionModal.item.nik})</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pengajuan: <span className="font-semibold capitalize">{actionModal.requestType}</span>
                </p>
              </div>

              {actionModal.action === 'approved' && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Otomatisasi Payroll Engine Aktif</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Menyetujui pengajuan ini akan secara otomatis memperbarui perhitungan gaji draft periode berjalan dan mencatat aktivitas di Audit Trail.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Alasan ({actionModal.action === 'approved' ? 'Persetujuan' : 'Penolakan'}):
                </label>
                <textarea
                  rows={3}
                  value={actionModal.notes}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Berikan catatan atau alasan..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActionModal((prev) => ({ ...prev, isOpen: false }))}
                  disabled={actionModal.isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitAction}
                  disabled={actionModal.isSubmitting}
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 ${
                    actionModal.action === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {actionModal.isSubmitting && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>
                    {actionModal.action === 'approved' ? 'Ya, Setujui & Sinkronkan' : 'Ya, Tolak Pengajuan'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
