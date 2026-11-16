'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  ChevronLeft,
  QrCode,
  ShieldCheck,
  Info
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

export default function PayslipDetailPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/payroll/payslip/${params.id}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Memuat Dokumen Slip Gaji...</p>
        </div>
      </div>
    );
  }

  if (!data?.payslip) {
    return (
      <div className="text-center py-20">
        <h2 className="text-lg font-bold text-slate-800">Slip Gaji Tidak Ditemukan</h2>
        <Link href="/payroll" className="mt-4 inline-block text-xs font-semibold text-blue-600 hover:underline">
          Kembali ke Penggajian
        </Link>
      </div>
    );
  }

  const { payslip, terbilang: terbilangText, company } = data;

  const monthNames = [
    '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/payroll"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Modul Payroll</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak / Cetak PDF (Print)</span>
        </button>
      </div>

      {/* Payslip Document */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 max-w-4xl mx-auto text-xs text-slate-800 print:shadow-none print:border-none print:p-0">
        {/* Header PT Nusantara Maju */}
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
              N
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {company?.name || 'PT NUSANTARA TEKNOLOGI MAJU'}
              </h1>
              <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
                {company?.address}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Telp: {company?.phone} • Email: {company?.email}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded bg-slate-100 border border-slate-300 font-extrabold text-slate-800 uppercase tracking-widest text-xs mb-1">
              SLIP GAJI KARYAWAN
            </span>
            <p className="text-xs font-bold text-blue-700">
              PERIODE: {monthNames[payslip.month]} {payslip.year}
            </p>
            <p className="text-[10px] text-slate-400">
              Status: {payslip.is_locked ? 'FINAL (Terkunci)' : 'DRAFT'}
            </p>
          </div>
        </div>

        {/* Employee & Payroll Meta Grid */}
        <div className="grid grid-cols-2 gap-4 my-5 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">NIK / ID Karyawan:</span>
              <span className="font-bold text-slate-900">{payslip.nik}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Nama Lengkap:</span>
              <span className="font-bold text-slate-900">{payslip.full_name}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Jabatan / Posisi:</span>
              <span className="font-semibold text-slate-800">{payslip.position_title || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Departemen:</span>
              <span className="font-semibold text-slate-800">{payslip.department_name || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Status Kerja:</span>
              <span className="font-medium text-slate-800">{payslip.employment_status} (Grade {payslip.grade_level})</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">Status PTKP / TER:</span>
              <span className="font-bold text-slate-900">
                {payslip.ptkp_status} (Kategori TER {payslip.ter_category} - {(payslip.ter_rate * 100).toFixed(2)}%)
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">Nomor Pokok NPWP:</span>
              <span className="font-medium text-slate-800">{payslip.npwp || 'Tidak Ada NPWP'}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">Bank & No. Rekening:</span>
              <span className="font-bold text-slate-800">
                {payslip.bank_name} - {payslip.bank_account_no}
              </span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">BPJS Kesehatan:</span>
              <span className="font-medium text-slate-800">{payslip.bpjs_kesehatan_no || '-'}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-500 font-medium">BPJS Ketenagakerjaan:</span>
              <span className="font-medium text-slate-800">{payslip.bpjs_ketenagakerjaan_no || '-'}</span>
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Earnings */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                A. Penghasilan (Earnings)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Nominal (IDR)</span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Gaji Pokok (Basic Salary)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.basic_salary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Tunjangan Tetap (Jabatan/Keluarga)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.fixed_allowance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Tunjangan Uang Makan ({payslip.present_days} hari)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.variable_meal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Tunjangan Transportasi ({payslip.present_days} hari)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.variable_transport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">Upah Lembur ({payslip.overtime_hours} Jam - Kemenaker)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.overtime_pay)}</span>
              </div>
              {payslip.bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Bonus / Insentif Performa</span>
                  <span className="font-semibold text-emerald-700">{formatRupiah(payslip.bonus)}</span>
                </div>
              )}
              {payslip.thr > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Tunjangan Hari Raya (THR)</span>
                  <span className="font-semibold text-emerald-700">{formatRupiah(payslip.thr)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between font-bold text-slate-900 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                <span>TOTAL PENGHASILAN (A)</span>
                <span className="text-blue-700">{formatRupiah(payslip.total_earnings)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                B. Potongan (Deductions)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Nominal (IDR)</span>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">BPJS Kesehatan (1% Pekerja)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.bpjs_kes_employee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">BPJS TK - JHT (2% Jaminan Hari Tua)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.bpjs_jht_employee)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-medium">BPJS TK - JP (1% Jaminan Pensiun)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(payslip.bpjs_jp_employee)}</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="text-slate-600 font-medium block">PPh 21 TER 2024</span>
                  <span className="text-[10px] text-slate-400">Tarif {(payslip.ter_rate * 100).toFixed(2)}% x Bruto Pajak</span>
                </div>
                <span className="font-semibold text-rose-700">{formatRupiah(payslip.pph21_ter)}</span>
              </div>
              {payslip.alpha_deduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Potongan Alpha ({payslip.absent_days} hari)</span>
                  <span className="font-semibold text-rose-700">{formatRupiah(payslip.alpha_deduction)}</span>
                </div>
              )}
              {payslip.loan_deduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Cicilan Pinjaman / Kasbon</span>
                  <span className="font-semibold text-rose-700">{formatRupiah(payslip.loan_deduction)}</span>
                </div>
              )}
              {payslip.other_deductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600 font-medium">Potongan Lain-lain</span>
                  <span className="font-semibold text-rose-700">{formatRupiah(payslip.other_deductions)}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between font-bold text-slate-900 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                <span>TOTAL POTONGAN (B)</span>
                <span className="text-rose-600">{formatRupiah(payslip.total_deductions)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Take Home Pay Box */}
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
              GAJI BERSIH DITERIMA (TAKE HOME PAY = A - B)
            </span>
            <p className="text-xs text-emerald-950 font-medium italic mt-0.5">
              Terbilang: &ldquo;{terbilangText}&rdquo;
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-700 tracking-tight block">
              {formatRupiah(payslip.take_home_pay)}
            </span>
            <span className="text-[10px] font-semibold text-emerald-800">
              Ditransfer ke {payslip.bank_name} a.n {payslip.bank_account_holder}
            </span>
          </div>
        </div>

        {/* Additional Company Benefit Info */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600" />
            <span>Informasi Tambahan: Kontribusi Iuran Ditanggung Perusahaan</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-slate-600">
            <div>BPJS Kes (4%): <span className="font-semibold text-slate-800">{formatRupiah(payslip.bpjs_kes_company)}</span></div>
            <div>JKK (0.24%): <span className="font-semibold text-slate-800">{formatRupiah(payslip.bpjs_jkk_company)}</span></div>
            <div>JKM (0.30%): <span className="font-semibold text-slate-800">{formatRupiah(payslip.bpjs_jkm_company)}</span></div>
            <div>JHT (3.7%): <span className="font-semibold text-slate-800">{formatRupiah(payslip.bpjs_jht_company)}</span></div>
            <div>JP (2.0%): <span className="font-semibold text-slate-800">{formatRupiah(payslip.bpjs_jp_company)}</span></div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 items-end">
          <div className="text-center">
            <p className="text-[11px] text-slate-500 mb-12">Diterima oleh Karyawan,</p>
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
              {payslip.full_name}
            </p>
          </div>

          <div className="text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 border border-slate-300 rounded-lg p-1 bg-white mb-1 shadow-sm flex items-center justify-center">
              <QrCode className="w-14 h-14 text-slate-800" />
            </div>
            <span className="text-[9px] font-mono text-slate-500 tracking-wider">
              AUTH-ID-{payslip.id}-{payslip.month}{payslip.year}
            </span>
            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3" /> Valid Digital Signature
            </span>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-slate-500 mb-12">
              Jakarta, {formatDateIndo(payslip.locked_at || new Date().toISOString())}<br />
              <span className="font-medium text-slate-700">PT Nusantara Teknologi Maju</span>
            </p>
            <p className="font-bold text-slate-900 border-t border-slate-300 pt-1 inline-block px-4">
              {company?.hrDirector || 'Budi Santoso, S.Kom.'}
            </p>
            <p className="text-[10px] text-slate-500">Head of People & Culture</p>
          </div>
        </div>
      </div>
    </div>
  );
}
