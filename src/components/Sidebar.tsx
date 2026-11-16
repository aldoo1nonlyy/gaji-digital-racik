'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck2,
  Hourglass,
  BadgePercent,
  UserCheck,
  ShieldCheck,
  Sparkles,
  Inbox,
  History
} from 'lucide-react';

interface SidebarProps {
  currentRole: string;
}

export default function Sidebar({ currentRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard HR',
      href: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'manager'],
      badge: null,
    },
    {
      label: 'Data Karyawan',
      href: '/employees',
      icon: Users,
      roles: ['admin', 'manager'],
      badge: null,
    },
    {
      label: 'Presensi & Absensi',
      href: '/attendance',
      icon: Clock,
      roles: ['admin', 'manager', 'employee'],
      badge: 'Live',
    },
    {
      label: 'Cuti & Izin',
      href: '/leaves',
      icon: CalendarCheck2,
      roles: ['admin', 'manager', 'employee'],
      badge: null,
    },
    {
      label: 'Lembur / Overtime',
      href: '/overtime',
      icon: Hourglass,
      roles: ['admin', 'manager', 'employee'],
      badge: null,
    },
    {
      label: 'Inbox Approval',
      href: '/approvals',
      icon: Inbox,
      roles: ['admin', 'manager'],
      badge: 'Action',
    },
    {
      label: 'Sistem Penggajian',
      href: '/payroll',
      icon: BadgePercent,
      roles: ['admin'],
      badge: 'TER 2024',
    },
    {
      label: 'Audit Log',
      href: '/audit-trail',
      icon: History,
      roles: ['admin', 'manager'],
      badge: 'Trail',
    },
    {
      label: 'Employee Self-Service',
      href: '/ess',
      icon: UserCheck,
      roles: ['admin', 'manager', 'employee'],
      badge: 'ESS',
    },
  ];

  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800 bg-[#0B1120]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 font-bold text-lg">
          N
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white tracking-tight text-sm">NUSANTARA HR</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Pro
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">PT Nusantara Teknologi Maju</p>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Akses Anda:</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] capitalize ${
            currentRole === 'admin'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : currentRole === 'manager'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            <ShieldCheck className="w-3 h-3" />
            {currentRole === 'admin' ? 'Super Admin' : currentRole === 'manager' ? 'Supervisor' : 'Employee ESS'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu Utama
        </div>

        {navItems
          .filter((item) => item.roles.includes(currentRole))
          .map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-800 text-blue-400 border border-blue-500/20'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-[#0B1120] text-xs text-slate-400">
        <div className="flex items-center gap-2 mb-1.5 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-white">UU Ketenagakerjaan & PPh 21</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Kalkulasi otomatis BPJS Kes 4%+1%, BPJS TK (JKK, JKM, JHT, JP), & PPh 21 TER 2024 PMK 168.
        </p>
      </div>
    </aside>
  );
}
