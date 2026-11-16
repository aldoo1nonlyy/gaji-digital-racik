'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Lock,
  Unlock,
  Calendar,
  AlertCircle,
  Eye,
  Sparkles,
  ShieldCheck,
  Plus,
  Edit3,
  DollarSign,
  TrendingUp,
  Users,
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  X,
  FileCheck2,
  Info,
  Building2,
  RefreshCw
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';
import { getTERCategory, getTERRate } from '@/lib/ter-tables';
import { STATUTORY_LIMITS } from '@/lib/payroll-engine';
import PayslipModal from '@/components/PayslipModal';

export default function PayrollPage() {
  const monthNames = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Selected Period State
  const [selectedMonth, setSelectedMonth] = useState<number>(11);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [periods, setPeriods] = useState<any[]>([]);
  const [activePeriod, setActivePeriod] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Payslip Modal State
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [selectedPayslipData, setSelectedPayslipData] = useState<any>(null);
  const [payslipLoading, setPayslipLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    bonus: 0,
    thr: 0,
    loanDeduction: 0,
    otherDeductions: 0,
    absentDays: 0,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Fetch all periods
  const fetchPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/payroll/periods');
      const json = await res.json();
      const fetchedPeriods = json.periods || [];
      setPeriods(fetchedPeriods);

      // Check if period for selectedMonth & selectedYear exists
      const match = fetchedPeriods.find((p: any) => p.month === selectedMonth && p.year === selectedYear);
      if (match) {
        setActivePeriod(match);
        fetchPayrollItems(match.id);
      } else {
        setActivePeriod(null);
        setItems([]);
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  // Fetch items for a period
  const fetchPayrollItems = async (periodId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/payroll/items?periodId=${periodId}`);
      const json = await res.json();
      setItems(json.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Generate / Recalculate Draft Payroll
  const handleGenerateDraft = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch('/api/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          workingDays: 22,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal generate draft payroll');
        return;
      }

      setSaveToast(json.message);
      setTimeout(() => setSaveToast(null), 4000);
      fetchPeriods();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Lock Payroll Period
  const handleLockPeriod = async () => {
    if (!activePeriod) return;
    if (!confirm(`Kunci periode gaji ${monthNames[selectedMonth]} ${selectedYear}? Setelah dikunci, data slip gaji berstatus FINAL dan resmi.`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/payroll/periods/${activePeriod.id}/lock`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengunci periode');
        return;
      }
      setSaveToast(json.message);
      setTimeout(() => setSaveToast(null), 4000);
      fetchPeriods();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Unlock Payroll Period
  const handleUnlockPeriod = async () => {
    if (!activePeriod) return;
    if (!confirm(`Buka kunci periode ${monthNames[selectedMonth]} ${selectedYear}? HR dapat mengedit komponen bonus, THR, dan potongan kembali.`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/payroll/periods/${activePeriod.id}/unlock`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal membuka kunci periode');
        return;
      }
      setSaveToast(json.message);
      setTimeout(() => setSaveToast(null), 4000);
      fetchPeriods();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setEditForm({
      bonus: item.bonus || 0,
      thr: item.thr || 0,
      loanDeduction: item.loan_deduction || 0,
      otherDeductions: item.other_deductions || 0,
      absentDays: item.absent_days || 0,
    });
    setIsEditModalOpen(true);
  };

  // Live recalculation simulation inside edit modal
  const simulatedEditCalculation = useMemo(() => {
    if (!editingItem) return null;

    const workingDays = editingItem.working_days || 22;
    const finalAbsentDays = Number(editForm.absentDays) || 0;
    const finalPresentDays = Math.max(0, workingDays - finalAbsentDays);
    const variableMeal = Math.round((editingItem.daily_meal_allowance || 35000) * finalPresentDays);
    const variableTransport = Math.round((editingItem.daily_transport_allowance || 25000) * finalPresentDays);
    const bonus = Number(editForm.bonus) || 0;
    const thr = Number(editForm.thr) || 0;
    const loanDeduction = Number(editForm.loanDeduction) || 0;
    const otherDeductions = Number(editForm.otherDeductions) || 0;

    // Total gross cash earnings
    const totalEarnings = Math.round(
      editingItem.basic_salary +
      editingItem.fixed_allowance +
      variableMeal +
      variableTransport +
      editingItem.overtime_pay +
      bonus +
      thr
    );

    // BPJS Base
    const wageBaseBPJS = editingItem.basic_salary + editingItem.fixed_allowance;
    const bpjsKesBase = Math.min(wageBaseBPJS, STATUTORY_LIMITS.BPJS_KES_WAGE_CAP);
    const bpjsKesCompany = Math.round(bpjsKesBase * STATUTORY_LIMITS.BPJS_KES_CO_RATE);
    const bpjsKesEmployee = Math.round(bpjsKesBase * STATUTORY_LIMITS.BPJS_KES_EMP_RATE);

    const bpjsJkkCompany = Math.round(wageBaseBPJS * STATUTORY_LIMITS.BPJS_JKK_RATE);
    const bpjsJkmCompany = Math.round(wageBaseBPJS * STATUTORY_LIMITS.BPJS_JKM_RATE);
    const bpjsJhtEmployee = Math.round(wageBaseBPJS * STATUTORY_LIMITS.BPJS_JHT_EMP_RATE);

    const bpjsJpBase = Math.min(wageBaseBPJS, STATUTORY_LIMITS.BPJS_JP_WAGE_CAP);
    const bpjsJpEmployee = Math.round(bpjsJpBase * STATUTORY_LIMITS.BPJS_JP_EMP_RATE);

    // Taxable gross
    const grossTaxableIncome = Math.round(totalEarnings + bpjsKesCompany + bpjsJkkCompany + bpjsJkmCompany);
    const terCategory = getTERCategory(editingItem.ptkp_status);
    const terRate = getTERRate(terCategory, grossTaxableIncome);
    const pph21TER = Math.round(grossTaxableIncome * terRate);

    // Alpha deduction
    const dailyBaseWage = workingDays > 0 ? (editingItem.basic_salary + editingItem.fixed_allowance) / workingDays : 0;
    const alphaDeduction = Math.round(dailyBaseWage * finalAbsentDays);

    // Total employee deductions
    const totalDeductions = Math.round(
      bpjsKesEmployee +
      bpjsJhtEmployee +
      bpjsJpEmployee +
      pph21TER +
      alphaDeduction +
      loanDeduction +
      otherDeductions
    );

    const takeHomePay = Math.max(0, totalEarnings - totalDeductions);

    return {
      totalEarnings,
      grossTaxableIncome,
      terCategory,
      terRate,
      pph21TER,
      bpjsKesEmployee,
      bpjsJhtEmployee,
      bpjsJpEmployee,
      alphaDeduction,
      totalDeductions,
      takeHomePay,
      diffTHP: takeHomePay - editingItem.take_home_pay,
    };
  }, [editingItem, editForm]);

  // Submit edit form
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/payroll/items/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bonus: Number(editForm.bonus) || 0,
          thr: Number(editForm.thr) || 0,
          loanDeduction: Number(editForm.loanDeduction) || 0,
          otherDeductions: Number(editForm.otherDeductions) || 0,
          absentDays: Number(editForm.absentDays) || 0,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal menyimpan perubahan gaji');
        return;
      }

      setSaveToast(json.message);
      setTimeout(() => setSaveToast(null), 4000);
      setIsEditModalOpen(false);
      fetchPeriods();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Open Payslip View
  const handleViewPayslip = async (itemId: number) => {
    try {
      setPayslipLoading(true);
      const res = await fetch(`/api/payroll/payslip/${itemId}`);
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal memuat slip gaji');
        return;
      }
      setSelectedPayslipData(json);
      setIsPayslipOpen(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPayslipLoading(false);
    }
  };

  // Filter items by search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.full_name?.toLowerCase().includes(term) ||
        item.nik?.toLowerCase().includes(term) ||
        item.department_name?.toLowerCase().includes(term) ||
        item.position_title?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  // Calculate totals from current items
  const totals = useMemo(() => {
    let gross = 0;
    let allowances = 0;
    let overtime = 0;
    let alpha = 0;
    let bpjs = 0;
    let tax = 0;
    let net = 0;

    items.forEach((item) => {
      gross += item.total_earnings || 0;
      allowances += (item.fixed_allowance || 0) + (item.variable_meal || 0) + (item.variable_transport || 0);
      overtime += item.overtime_pay || 0;
      alpha += item.alpha_deduction || 0;
      bpjs += (item.bpjs_kes_employee || 0) + (item.bpjs_jht_employee || 0) + (item.bpjs_jp_employee || 0);
      tax += item.pph21_ter || 0;
      net += item.take_home_pay || 0;
    });

    return { gross, allowances, overtime, alpha, bpjs, tax, net };
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Mekari Talenta Header: Period Picker & Main Action Buttons */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Run Payroll Engine (Sistem Penggajian)
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              PMK 168/2023 & PP 58/2023
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Kalkulasi otomatis gaji pokok, lembur Kemenaker 1.5x/2.0x, potongan BPJS Kes & Ketenagakerjaan, serta PPh 21 TER 2024.
          </p>
        </div>

        {/* Period Selector Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-blue-600 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold py-1.5 px-2 bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              {monthNames.map((m, idx) => idx > 0 && (
                <option key={idx} value={idx}>{m}</option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold py-1.5 px-2 border-l border-slate-200 bg-transparent text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>

          {/* Status Badge */}
          <div className="flex items-center">
            {activePeriod?.is_locked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Final & Terkunci (Locked)</span>
              </span>
            ) : items.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
                <Unlock className="w-4 h-4 text-amber-600" />
                <span>Draft Terbuka (Editable)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <AlertCircle className="w-4 h-4 text-slate-400" />
                <span>Belum Dihasilkan</span>
              </span>
            )}
          </div>

          {/* Action Button: Generate Draft Payroll */}
          {!activePeriod?.is_locked && (
            <button
              onClick={handleGenerateDraft}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              title="Kalkulasi otomatis seluruh karyawan aktif untuk periode ini"
            >
              <Play className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{items.length > 0 ? 'Kalkulasi Ulang Draft' : 'Generate Draft Payroll'}</span>
            </button>
          )}

          {/* Action Button: Lock Period (Finalized) */}
          {activePeriod && !activePeriod.is_locked && items.length > 0 && (
            <button
              onClick={handleLockPeriod}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-sm transition-all cursor-pointer"
              title="Kunci periode untuk finalisasi slip gaji resmi"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Kunci Gaji (Lock)</span>
            </button>
          )}

          {/* Action Button: Unlock Period */}
          {activePeriod?.is_locked && (
            <button
              onClick={handleUnlockPeriod}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all cursor-pointer"
              title="Buka kembali kunci untuk merevisi data gaji"
            >
              <Unlock className="w-3.5 h-3.5 text-blue-600" />
              <span>Buka Kunci (Unlock)</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Financial KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Employees */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Karyawan Diproses</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{items.length}</span>
            <span className="text-xs text-slate-500">karyawan aktif</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Periode {monthNames[selectedMonth]} {selectedYear}
          </div>
        </div>

        {/* Card 2: Total Gross Earnings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Penghasilan Bruto</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-black text-slate-900 truncate block">
              {formatRupiah(totals.gross)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Termasuk lembur, makan & transport
          </div>
        </div>

        {/* Card 3: Total Deductions & Taxes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Potongan BPJS & Pajak</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-black text-rose-600 truncate block">
              {formatRupiah(totals.bpjs + totals.tax + totals.alpha)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span>PPh 21: {formatRupiah(totals.tax)}</span> • <span>BPJS: {formatRupiah(totals.bpjs)}</span>
          </div>
        </div>

        {/* Card 4: Total Net Payout (Take Home Pay) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Gaji Bersih (THP)</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-black text-emerald-700 truncate block">
              {formatRupiah(totals.net)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-800 font-semibold">
            Beban transfer payroll bank
          </div>
        </div>
      </div>

      {/* Payroll Preview Table Header & Search */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <span>Tabel Preview Perhitungan Penggajian Karyawan</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rincian penghasilan, potongan regulasi Indonesia, pajak PPh 21 TER, dan nominal bersih (THP)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari karyawan atau NIK..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3 px-4">Nama Karyawan</th>
                <th className="py-3 px-3 text-right">Gaji Pokok</th>
                <th className="py-3 px-3 text-right">Total Tunjangan</th>
                <th className="py-3 px-3 text-right">Upah Lembur</th>
                <th className="py-3 px-3 text-right">Bonus / THR</th>
                <th className="py-3 px-3 text-right">Pot. Absen</th>
                <th className="py-3 px-3 text-right">Pot. BPJS</th>
                <th className="py-3 px-3 text-right">PPh 21 (TER)</th>
                <th className="py-3 px-3 text-right">Kasbon / Lain</th>
                <th className="py-3 px-4 text-right">Take Home Pay</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data penggajian periode {monthNames[selectedMonth]} {selectedYear}...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-14 text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">
                      Belum ada draft payroll untuk periode {monthNames[selectedMonth]} {selectedYear}.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Klik tombol <strong>&ldquo;Generate Draft Payroll&rdquo;</strong> di atas untuk memproses data gaji seluruh karyawan aktif.
                    </p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    Tidak ada karyawan yang cocok dengan pencarian &ldquo;{searchTerm}&rdquo;.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const totalAllowances = (item.fixed_allowance || 0) + (item.variable_meal || 0) + (item.variable_transport || 0);
                  const totalBPJS = (item.bpjs_kes_employee || 0) + (item.bpjs_jht_employee || 0) + (item.bpjs_jp_employee || 0);
                  const bonusAndThr = (item.bonus || 0) + (item.thr || 0);
                  const kasbonAndOther = (item.loan_deduction || 0) + (item.other_deductions || 0);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Nama Karyawan */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={item.full_name}
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{item.full_name}</p>
                            <p className="text-[10px] font-mono text-slate-400">{item.nik}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-500 truncate max-w-[120px]">{item.position_title}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 font-semibold text-slate-600">
                                {item.ptkp_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Gaji Pokok */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-800">
                        {formatRupiah(item.basic_salary)}
                      </td>

                      {/* 3. Total Tunjangan */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-semibold text-slate-900">{formatRupiah(totalAllowances)}</span>
                        <p className="text-[10px] text-slate-400">
                          Tetap: {formatRupiah(item.fixed_allowance)}
                        </p>
                      </td>

                      {/* 4. Upah Lembur */}
                      <td className="py-3 px-3 text-right">
                        <span className={item.overtime_pay > 0 ? 'font-bold text-blue-700' : 'text-slate-400'}>
                          {item.overtime_pay > 0 ? formatRupiah(item.overtime_pay) : '-'}
                        </span>
                        {item.overtime_hours > 0 && (
                          <p className="text-[10px] text-slate-400">{item.overtime_hours} Jam</p>
                        )}
                      </td>

                      {/* 5. Bonus / THR */}
                      <td className="py-3 px-3 text-right">
                        {bonusAndThr > 0 ? (
                          <div>
                            <span className="font-bold text-emerald-700">{formatRupiah(bonusAndThr)}</span>
                            {item.thr > 0 && <span className="block text-[9px] text-emerald-800">THR: {formatRupiah(item.thr)}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 6. Potongan Absen/Alpha */}
                      <td className="py-3 px-3 text-right">
                        {item.alpha_deduction > 0 ? (
                          <div>
                            <span className="font-semibold text-rose-600">-{formatRupiah(item.alpha_deduction)}</span>
                            <p className="text-[10px] text-slate-400">{item.absent_days} Hari</p>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 7. Potongan BPJS */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-semibold text-slate-800">-{formatRupiah(totalBPJS)}</span>
                        <p className="text-[10px] text-slate-400" title="Kes 1% + JHT 2% + JP 1%">
                          Kes+JHT+JP
                        </p>
                      </td>

                      {/* 8. Potongan PPh 21 (TER) */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-rose-600">-{formatRupiah(item.pph21_ter)}</span>
                        <div className="text-[10px] text-slate-500 font-medium">
                          TER {item.ter_category} ({(item.ter_rate * 100).toFixed(2)}%)
                        </div>
                      </td>

                      {/* 9. Kasbon / Lain */}
                      <td className="py-3 px-3 text-right">
                        {kasbonAndOther > 0 ? (
                          <span className="font-semibold text-rose-600">-{formatRupiah(kasbonAndOther)}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* 10. Take Home Pay (THP) */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-extrabold text-emerald-700">
                          {formatRupiah(item.take_home_pay)}
                        </span>
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200"
                            title="Detail & Edit Bonus, THR, Kasbon"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Payslip Button */}
                          <button
                            onClick={() => handleViewPayslip(item.id)}
                            disabled={payslipLoading}
                            className="p-1.5 rounded-lg text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                            title="Lihat & Cetak Slip Gaji"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Detail & Edit Gaji Karyawan (Bonus, THR, Kasbon) */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={editingItem.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={editingItem.full_name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30"
                />
                <div>
                  <h3 className="text-sm font-bold">{editingItem.full_name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {editingItem.nik} • {editingItem.position_title} ({editingItem.department_name})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lock status banner if locked */}
            {activePeriod?.is_locked && (
              <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>
                  Periode ini telah dikunci (Finalized/Locked). Anda dapat melihat detail perhitungan, namun tidak dapat menyimpan perubahan kecuali periode dibuka kunci.
                </span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
              {/* Profile Summary Strip */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status PTKP</span>
                  <span className="font-bold text-slate-800">{editingItem.ptkp_status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Gaji Pokok Base</span>
                  <span className="font-bold text-slate-800">{formatRupiah(editingItem.basic_salary)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tunjangan Tetap</span>
                  <span className="font-bold text-slate-800">{formatRupiah(editingItem.fixed_allowance)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Upah Lembur</span>
                  <span className="font-bold text-blue-700">{formatRupiah(editingItem.overtime_pay)}</span>
                </div>
              </div>

              {/* Editable Fields Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-1.5 border-b border-blue-100 mb-3 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Penyesuaian Manual Komponen Gaji</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Bonus */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Bonus / Insentif Performa (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        disabled={activePeriod?.is_locked}
                        value={editForm.bonus}
                        onChange={(e) => setEditForm({ ...editForm, bonus: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Penambah penghasilan bruto kena pajak</span>
                  </div>

                  {/* THR */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Tunjangan Hari Raya (THR) (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        disabled={activePeriod?.is_locked}
                        value={editForm.thr}
                        onChange={(e) => setEditForm({ ...editForm, thr: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Penambah penghasilan bruto kena pajak</span>
                  </div>

                  {/* Kasbon / Loan */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Potongan Kasbon / Pinjaman (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        disabled={activePeriod?.is_locked}
                        value={editForm.loanDeduction}
                        onChange={(e) => setEditForm({ ...editForm, loanDeduction: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Dipotong langsung dari take home pay</span>
                  </div>

                  {/* Other deductions */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Potongan Lain-lain (IDR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        min="0"
                        disabled={activePeriod?.is_locked}
                        value={editForm.otherDeductions}
                        onChange={(e) => setEditForm({ ...editForm, otherDeductions: Number(e.target.value) || 0 })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Penalti keterlambatan atau klaim operasional</span>
                  </div>
                </div>
              </div>

              {/* Real-time Calculation Simulation Preview */}
              {simulatedEditCalculation && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-blue-200/60">
                    <span className="font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Hasil Simulasi Rekalkulasi Gaji (Live Engine Preview)</span>
                    </span>
                    <span className="text-[10px] font-semibold text-blue-700">
                      TER {simulatedEditCalculation.terCategory} ({(simulatedEditCalculation.terRate * 100).toFixed(2)}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <div className="text-slate-600">Total Penghasilan Bruto Baru:</div>
                    <div className="text-right font-bold text-slate-900">{formatRupiah(simulatedEditCalculation.totalEarnings)}</div>

                    <div className="text-slate-600">Objek Penghasilan Bruto Pajak:</div>
                    <div className="text-right font-semibold text-slate-800">{formatRupiah(simulatedEditCalculation.grossTaxableIncome)}</div>

                    <div className="text-slate-600">Pajak PPh 21 TER Baru:</div>
                    <div className="text-right font-bold text-rose-600">{formatRupiah(simulatedEditCalculation.pph21TER)}</div>

                    <div className="text-slate-600">Total Potongan Karyawan:</div>
                    <div className="text-right font-semibold text-rose-600">-{formatRupiah(simulatedEditCalculation.totalDeductions)}</div>
                  </div>

                  {/* Net take home pay highlight */}
                  <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">Take Home Pay (THP) Baru:</span>
                      {simulatedEditCalculation.diffTHP !== 0 && (
                        <span className={`text-[10px] font-semibold ${simulatedEditCalculation.diffTHP > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {simulatedEditCalculation.diffTHP > 0 ? `+${formatRupiah(simulatedEditCalculation.diffTHP)}` : formatRupiah(simulatedEditCalculation.diffTHP)} dari sebelumnya
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-black text-emerald-700">
                      {formatRupiah(simulatedEditCalculation.takeHomePay)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                {!activePeriod?.is_locked && (
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isSavingEdit && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simpan & Rekalkulasi Gaji</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Official Printable Payslip (Slip Gaji) Modal */}
      <PayslipModal
        isOpen={isPayslipOpen}
        onClose={() => setIsPayslipOpen(false)}
        payslipData={selectedPayslipData}
      />
    </div>
  );
}
