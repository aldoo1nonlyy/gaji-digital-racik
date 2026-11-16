'use client';

import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  User,
  Clock,
  FileText,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Building,
  Sparkles,
  Eye,
  X
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Log for JSON Modal
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (entityFilter !== 'all') params.append('entityType', entityFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      const json = await res.json();
      setLogs(json.logs || []);
      setTotal(json.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'UPDATE_SALARY':
        return {
          label: 'Gaji Pokok / Tunjangan Diubah',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: TrendingUp,
        };
      case 'CORRECT_ATTENDANCE':
        return {
          label: 'Koreksi Absensi Diterapkan',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: Clock,
        };
      case 'LOCK_PAYROLL':
        return {
          label: 'Penguncian Payroll (Lock)',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Lock,
        };
      case 'UNLOCK_PAYROLL':
        return {
          label: 'Buka Kunci Payroll (Unlock)',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Unlock,
        };
      case 'APPROVE_LEAVE':
      case 'APPROVE_OVERTIME':
      case 'APPROVE_CORRECTION':
        return {
          label: action.replace('_', ' '),
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
        };
      case 'REJECT_LEAVE':
      case 'REJECT_OVERTIME':
      case 'REJECT_CORRECTION':
        return {
          label: action.replace('_', ' '),
          color: 'bg-rose-100 text-rose-800 border-rose-200',
          icon: XCircle,
        };
      case 'SYNC_PAYROLL':
        return {
          label: 'Auto-Sync Payroll',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: Sparkles,
        };
      case 'ADJUST_PAYROLL_ITEM':
        return {
          label: 'Penyesuaian Bonus/THR/Kasbon',
          color: 'bg-teal-100 text-teal-800 border-teal-200',
          icon: FileText,
        };
      default:
        return {
          label: action,
          color: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: History,
        };
    }
  };

  // Helper to format values for Diff comparison
  const renderValueDiff = (oldValsStr: string | null, newValsStr: string | null) => {
    if (!oldValsStr && !newValsStr) {
      return <span className="text-slate-400 italic text-xs">Tidak ada data rincian</span>;
    }

    try {
      const oldVals = oldValsStr ? JSON.parse(oldValsStr) : {};
      const newVals = newValsStr ? JSON.parse(newValsStr) : {};

      const keys = Array.from(new Set([...Object.keys(oldVals), ...Object.keys(newVals)]));

      if (keys.length === 0) {
        return <span className="text-slate-400 italic text-xs">Nilai awal dibuat</span>;
      }

      return (
        <div className="space-y-1.5 text-xs">
          {keys.slice(0, 3).map((key) => {
            const oldV = oldVals[key];
            const newV = newVals[key];

            const formatVal = (v: any) => {
              if (v === null || v === undefined) return 'null';
              if (typeof v === 'number' && v > 1000) return formatRupiah(v);
              if (typeof v === 'boolean') return v ? 'Ya' : 'Tidak';
              return String(v);
            };

            const isChanged = oldV !== newV;

            return (
              <div key={key} className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-slate-600 capitalize">{key.replace('_', ' ')}:</span>
                <span className="line-through text-slate-400 font-mono">{formatVal(oldV)}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className={`font-mono font-bold ${isChanged ? 'text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded' : 'text-slate-700'}`}>
                  {formatVal(newV)}
                </span>
              </div>
            );
          })}
          {keys.length > 3 && (
            <p className="text-[10px] text-blue-600 font-semibold cursor-pointer">
              + {keys.length - 3} properti lainnya...
            </p>
          )}
        </div>
      );
    } catch (e) {
      return <span className="text-slate-500 text-xs font-mono truncate">{newValsStr}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail & Log Aktivitas Sistem</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              {total} Catatan
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pencatatan rekam jejak kepatuhan hukum (*Audit Trail*) untuk setiap perubahan krusial: nominal Gaji Pokok, pembatalan/koreksi presensi, persetujuan Cuti/Lembur, dan eksekusi penguncian Payroll.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aktor, jenis aksi, atau catatan..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </form>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Aksi:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Semua Aksi</option>
              <option value="UPDATE_SALARY">Perubahan Gaji Pokok</option>
              <option value="CORRECT_ATTENDANCE">Koreksi Absensi</option>
              <option value="LOCK_PAYROLL">Kunci Payroll (Lock)</option>
              <option value="UNLOCK_PAYROLL">Buka Kunci Payroll (Unlock)</option>
              <option value="APPROVE_LEAVE">Persetujuan Cuti</option>
              <option value="APPROVE_OVERTIME">Persetujuan Lembur</option>
              <option value="SYNC_PAYROLL">Sinkronisasi Payroll</option>
              <option value="ADJUST_PAYROLL_ITEM">Penyesuaian Bonus/THR</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Entitas:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Semua Entitas</option>
              <option value="employee">Karyawan (employee)</option>
              <option value="attendance">Presensi (attendance)</option>
              <option value="payroll_period">Periode Gaji (payroll_period)</option>
              <option value="leave_request">Cuti (leave_request)</option>
              <option value="overtime_request">Lembur (overtime_request)</option>
              <option value="payroll_item">Slip Gaji (payroll_item)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Aktor / Pengguna</th>
                <th className="py-3 px-4">Jenis Aksi</th>
                <th className="py-3 px-4">Entitas Target</th>
                <th className="py-3 px-4 min-w-[280px]">Perbandingan Nilai (Old vs New)</th>
                <th className="py-3 px-4 min-w-[250px]">Keterangan / Catatan</th>
                <th className="py-3 px-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    Memuat riwayat audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada catatan audit log yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Waktu */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        <div className="font-semibold text-slate-800">{log.created_at?.split(' ')[0]}</div>
                        <div className="text-slate-400">{log.created_at?.split(' ')[1] || '00:00:00'} WIB</div>
                      </td>

                      {/* Aktor / Pengguna */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {log.user_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{log.user_name}</p>
                            <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                              log.user_role === 'admin'
                                ? 'bg-indigo-50 text-indigo-700'
                                : log.user_role === 'manager'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {log.user_role} (ID #{log.user_id || 'sys'})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Jenis Aksi */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Target Entitas */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {log.entity_type} #{log.entity_id}
                        </span>
                      </td>

                      {/* Perbandingan Nilai */}
                      <td className="py-3.5 px-4">
                        {renderValueDiff(log.old_values, log.new_values)}
                      </td>

                      {/* Catatan / Keterangan */}
                      <td className="py-3.5 px-4 text-slate-700 text-[11px] leading-relaxed">
                        {log.notes || '-'}
                      </td>

                      {/* Tombol Detail JSON */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat payload JSON lengkap"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <span className="font-bold text-sm">Payload Audit Log #{selectedLog.id}</span>
              </div>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 font-semibold">Aksi:</span>
                  <p className="font-bold text-slate-900">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Waktu:</span>
                  <p className="font-bold text-slate-900">{selectedLog.created_at}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Aktor:</span>
                  <p className="font-bold text-slate-900">{selectedLog.user_name} ({selectedLog.user_role})</p>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Entitas:</span>
                  <p className="font-bold text-slate-900">{selectedLog.entity_type} #{selectedLog.entity_id}</p>
                </div>
              </div>

              <div>
                <p className="font-semibold text-slate-700 mb-1">Catatan Keterangan:</p>
                <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-800">
                  {selectedLog.notes || '-'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Nilai Lama (Old Values):</p>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                    {selectedLog.old_values ? JSON.stringify(JSON.parse(selectedLog.old_values), null, 2) : 'null'}
                  </pre>
                </div>
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Nilai Baru (New Values):</p>
                  <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                    {selectedLog.new_values ? JSON.stringify(JSON.parse(selectedLog.new_values), null, 2) : 'null'}
                  </pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
