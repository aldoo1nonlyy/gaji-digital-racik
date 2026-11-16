'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Shield,
  Eye,
  X
} from 'lucide-react';
import { formatRupiah, formatDateIndo } from '@/lib/utils';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialForm = {
    nik: '',
    full_name: '',
    email: '',
    phone: '',
    join_date: new Date().toISOString().split('T')[0],
    employment_status: 'PKWTT',
    department_id: '',
    position_id: '',
    grade_level: 'S1',
    npwp: '',
    ptkp_status: 'TK/0',
    bank_name: 'Bank Central Asia (BCA)',
    bank_account_no: '',
    bank_account_holder: '',
    bpjs_kesehatan_no: '',
    bpjs_ketenagakerjaan_no: '',
    basic_salary: '',
    fixed_allowance: '',
    daily_meal_allowance: '35000',
    daily_transport_allowance: '25000',
    annual_leave_quota: '12',
  };

  const [form, setForm] = useState<any>(initialForm);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedDept !== 'all') params.append('departmentId', selectedDept);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      setEmployees(data.employees || []);
      setDepartments(data.departments || []);
      setPositions(data.positions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedDept, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleOpenAddModal = () => {
    setEditingEmployee(null);
    setForm({
      ...initialForm,
      department_id: departments[0]?.id || '1',
      position_id: positions[0]?.id || '1',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: any) => {
    setEditingEmployee(emp);
    setForm({
      nik: emp.nik,
      full_name: emp.full_name,
      email: emp.email,
      phone: emp.phone,
      join_date: emp.join_date,
      employment_status: emp.employment_status,
      department_id: String(emp.department_id),
      position_id: String(emp.position_id),
      grade_level: emp.grade_level,
      npwp: emp.npwp || '',
      ptkp_status: emp.ptkp_status,
      bank_name: emp.bank_name,
      bank_account_no: emp.bank_account_no,
      bank_account_holder: emp.bank_account_holder,
      bpjs_kesehatan_no: emp.bpjs_kesehatan_no || '',
      bpjs_ketenagakerjaan_no: emp.bpjs_ketenagakerjaan_no || '',
      basic_salary: emp.basic_salary,
      fixed_allowance: emp.fixed_allowance,
      daily_meal_allowance: emp.daily_meal_allowance,
      daily_transport_allowance: emp.daily_transport_allowance,
      annual_leave_quota: emp.annual_leave_quota,
      is_active: emp.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Terjadi kesalahan saat menyimpan data karyawan');
        return;
      }

      alert(editingEmployee ? 'Data karyawan berhasil diperbarui' : 'Karyawan baru berhasil ditambahkan');
      setIsModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Direktori & Manajemen Karyawan</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {employees.length} Orang
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola profil personal, status ketenagakerjaan (PKWT/PKWTT), identitas pajak (PTKP), dan konfigurasi gaji pokok.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NIK, Nama Lengkap, atau Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Semua Status Kerja</option>
            <option value="PKWTT">PKWTT (Tetap)</option>
            <option value="PKWT">PKWT (Kontrak)</option>
            <option value="Probation">Probation (Percobaan)</option>
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Karyawan</th>
                <th className="py-3 px-4">Departemen & Jabatan</th>
                <th className="py-3 px-4">Status & Grade</th>
                <th className="py-3 px-4">PTKP & Pajak</th>
                <th className="py-3 px-4">Gaji Pokok & Tunjangan</th>
                <th className="py-3 px-4">Bank & Rekening</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat data karyawan...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    Tidak ada karyawan yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee Profile */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={emp.full_name}
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{emp.full_name}</p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5">{emp.nik}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{emp.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Department & Position */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{emp.position_title}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>{emp.department_name}</span>
                      </div>
                    </td>

                    {/* Status & Grade */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          emp.employment_status === 'PKWTT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : emp.employment_status === 'PKWT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {emp.employment_status}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {emp.grade_level}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Masuk: {formatDateIndo(emp.join_date)}
                      </p>
                    </td>

                    {/* PTKP & Tax Identity */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <span>PTKP: {emp.ptkp_status}</span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                        NPWP: {emp.npwp || 'Belum Ada'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        BPJS Kes: {emp.bpjs_kesehatan_no ? 'Terdaftar' : '-'}
                      </p>
                    </td>

                    {/* Salary & Allowances */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{formatRupiah(emp.basic_salary)}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tunjangan: +{formatRupiah(emp.fixed_allowance)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Makan: {formatRupiah(emp.daily_meal_allowance)}/hr
                      </div>
                    </td>

                    {/* Bank & Account */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{emp.bank_name}</div>
                      <div className="text-[11px] font-mono text-slate-600 mt-0.5">{emp.bank_account_no}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        a.n {emp.bank_account_holder}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenEditModal(emp)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Data Karyawan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Karyawan */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  {editingEmployee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lengkapi data profil, perpajakan PTKP, dan struktur upah sesuai standar UU Ketenagakerjaan
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 max-h-[80vh] overflow-y-auto space-y-6 text-xs">
              {/* Group 1: Profil Karyawan & Organisasi */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-2 border-b border-blue-100 mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>1. Informasi Pribadi & Organisasi</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">NIK (Nomor Induk Karyawan) *</label>
                    <input
                      type="text"
                      required
                      placeholder="EMP-2026009"
                      value={form.nik}
                      onChange={(e) => setForm({ ...form, nik: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Nama Lengkap & Gelar *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Raden Arya Pratama, S.Kom."
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Email Perusahaan *</label>
                    <input
                      type="email"
                      required
                      placeholder="arya@nusantaramaju.co.id"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nomor Telepon / WA *</label>
                    <input
                      type="text"
                      required
                      placeholder="081234567890"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Tanggal Mulai Bekerja (Join Date) *</label>
                    <input
                      type="date"
                      required
                      value={form.join_date}
                      onChange={(e) => setForm({ ...form, join_date: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Status Ketenagakerjaan *</label>
                    <select
                      value={form.employment_status}
                      onChange={(e) => setForm({ ...form, employment_status: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="PKWTT">PKWTT (Karyawan Tetap)</option>
                      <option value="PKWT">PKWT (Karyawan Kontrak)</option>
                      <option value="Probation">Masa Percobaan (Probation)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Departemen *</label>
                    <select
                      value={form.department_id}
                      onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Posisi / Jabatan *</label>
                    <select
                      value={form.position_id}
                      onChange={(e) => setForm({ ...form, position_id: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      {positions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} (Grade {p.grade_level})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Pajak & Bank */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-2 border-b border-blue-100 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>2. Identitas Pajak PPh 21, BPJS & Rekening Bank</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Status PTKP (Kategori TER) *</label>
                    <select
                      value={form.ptkp_status}
                      onChange={(e) => setForm({ ...form, ptkp_status: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="TK/0">TK/0 (Lajang - TER Kategori A)</option>
                      <option value="TK/1">TK/1 (1 Tanggungan - TER Kategori A)</option>
                      <option value="TK/2">TK/2 (2 Tanggungan - TER Kategori B)</option>
                      <option value="TK/3">TK/3 (3 Tanggungan - TER Kategori B)</option>
                      <option value="K/0">K/0 (Menikah 0 Anak - TER Kategori A)</option>
                      <option value="K/1">K/1 (Menikah 1 Anak - TER Kategori B)</option>
                      <option value="K/2">K/2 (Menikah 2 Anak - TER Kategori B)</option>
                      <option value="K/3">K/3 (Menikah 3 Anak - TER Kategori C)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nomor NPWP</label>
                    <input
                      type="text"
                      placeholder="e.g. 71.294.819.2-014.000"
                      value={form.npwp}
                      onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">No. BPJS Kesehatan</label>
                    <input
                      type="text"
                      placeholder="e.g. 0001892716281"
                      value={form.bpjs_kesehatan_no}
                      onChange={(e) => setForm({ ...form, bpjs_kesehatan_no: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">No. BPJS Ketenagakerjaan</label>
                    <input
                      type="text"
                      placeholder="e.g. 19028471928"
                      value={form.bpjs_ketenagakerjaan_no}
                      onChange={(e) => setForm({ ...form, bpjs_ketenagakerjaan_no: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nama Bank Payroll *</label>
                    <select
                      value={form.bank_name}
                      onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      <option value="Bank Central Asia (BCA)">Bank Central Asia (BCA)</option>
                      <option value="Bank Mandiri">Bank Mandiri</option>
                      <option value="Bank Negara Indonesia (BNI)">Bank Negara Indonesia (BNI)</option>
                      <option value="Bank Rakyat Indonesia (BRI)">Bank Rakyat Indonesia (BRI)</option>
                      <option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
                      <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Nomor Rekening Bank *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5271892019"
                      value={form.bank_account_no}
                      onChange={(e) => setForm({ ...form, bank_account_no: e.target.value })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Struktur Upah & Gaji */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 pb-2 border-b border-blue-100 mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>3. Konfigurasi Komponen Upah (Salary Base Configuration)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Gaji Pokok (Basic Salary) *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        required
                        placeholder="8500000"
                        value={form.basic_salary}
                        onChange={(e) => setForm({ ...form, basic_salary: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Tunjangan Tetap (Jabatan) *</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="1000000"
                        value={form.fixed_allowance}
                        onChange={(e) => setForm({ ...form, fixed_allowance: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Uang Makan Harian (Variabel)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="35000"
                        value={form.daily_meal_allowance}
                        onChange={(e) => setForm({ ...form, daily_meal_allowance: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Uang Transport Harian (Variabel)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                      <input
                        type="number"
                        placeholder="25000"
                        value={form.daily_transport_allowance}
                        onChange={(e) => setForm({ ...form, daily_transport_allowance: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
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
                  <span>{editingEmployee ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

