'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RotateCcw,
  Shield,
  User,
  Users,
  Calendar,
  Building
} from 'lucide-react';
import { formatDateIndo } from '@/lib/utils';

interface HeaderProps {
  currentRole: string;
  currentUser?: any;
}

export default function Header({ currentRole, currentUser }: HeaderProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const todayStr = formatDateIndo(new Date(), true);

  const handleRoleChange = async (role: string) => {
    try {
      setIsSwitching(true);
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        if (role === 'employee') {
          window.location.href = '/ess';
        } else if (window.location.pathname === '/ess') {
          window.location.href = '/';
        } else {
          window.location.reload();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Reset dan pasang ulang data demo realistis PT Nusantara Maju?')) return;
    try {
      setIsResetting(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        alert('Data demo berhasil di-reset ke kondisi awal!');
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Organization context & date */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200/60">
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium text-slate-700">{todayStr}</span>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span>Kantor SCBD Jakarta</span>
        </div>
      </div>

      {/* Right: Switch Role Controls + User Profile */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Pill Bar */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-600 px-2 hidden lg:inline">
            Simulasi Role:
          </span>
          <button
            onClick={() => handleRoleChange('admin')}
            disabled={isSwitching}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'admin'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Super Admin: Akses penuh HR, Gaji, Karyawan, Presensi"
          >
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </button>
          <button
            onClick={() => handleRoleChange('manager')}
            disabled={isSwitching}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'manager'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Manager: Persetujuan cuti, lembur, dan tim"
          >
            <Users className="w-3 h-3" />
            <span>Manager</span>
          </button>
          <button
            onClick={() => handleRoleChange('employee')}
            disabled={isSwitching}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentRole === 'employee'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title="Employee / ESS: Absensi GPS, ajukan cuti/lembur, slip gaji saya"
          >
            <User className="w-3 h-3" />
            <span>Employee (ESS)</span>
          </button>
        </div>

        {/* Reset Data Button */}
        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
          title="Reset database ke data dummy awal"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin text-blue-600' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* Current User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <img
            src={currentUser?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
          />
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {currentUser?.full_name || 'Budi Santoso'}
            </p>
            <p className="text-[11px] text-slate-500 capitalize leading-tight">
              {currentUser?.position_title || (currentRole === 'admin' ? 'HR Super Admin' : currentRole === 'manager' ? 'Engineering Lead' : 'Senior Developer')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
