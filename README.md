# Nusantara HRIS & Automated Indonesian Payroll (Mekari Talenta Inspired)

A production-ready, full-stack Human Resource Information System (HRIS) and Automated Payroll web & hybrid mobile application inspired by **Mekari Talenta**, tailored specifically for Indonesian labor laws, tax regulations, and statutory contributions.

Built for **PT Nusantara Teknologi Maju** — Jakarta, Indonesia.

---

## 🌟 Key Highlights & Legal Compliance

- **PPh 21 TER 2024 (PP No. 58/2023 & PMK No. 168/2023):**
  - Complete TER Categories:
    - **Category A:** TK/0, TK/1, K/0
    - **Category B:** TK/2, TK/3, K/1, K/2
    - **Category C:** K/3
  - Precise Gross Taxable Income (*Penghasilan Bruto Pajak*) computation, adding company-paid BPJS Kesehatan (4%), JKK (0.24%), and JKM (0.30%) to cash earnings before lookup against official TER brackets.
- **Kemenaker Overtime Regulations (PP No. 35/2021):**
  - Hourly wage rate formula: $\frac{1}{173} \times (\text{Basic Salary} + \text{Fixed Allowance})$.
  - Tiered multiplier: $1.5\times$ for the first hour, $2.0\times$ for each subsequent hour.
  - Live wage estimator before submitting overtime requests.
- **BPJS Kesehatan & BPJS Ketenagakerjaan Caps:**
  - **BPJS Kesehatan:** 4% paid by employer (capped at Rp 12,000,000 salary base), 1% deducted from employee.
  - **BPJS Ketenagakerjaan JHT:** 3.7% employer, 2% employee.
  - **BPJS Ketenagakerjaan JP (Jaminan Pensiun):** 2% employer, 1% employee (capped at statutory limit Rp 10,042,300).
  - **BPJS Ketenagakerjaan JKK & JKM:** 0.24% & 0.30% employer-funded.
- **GPS SCBD Geofencing Attendance:**
  - Validates live clock-in & clock-out against company headquarters coordinates (`-6.2255, 106.8095` at Treasury Tower SCBD Jakarta) within a 250m radius using the Haversine distance formula.
- **Official Indonesian e-Payslip:**
  - Standard banking and legal layout with two-column earnings & deductions breakdown, company contributions, automatic Indonesian number spelling (*Terbilang* text in Rupiah), digital QR verification, and print/PDF optimization.
- **Multi-Tier Approval Center with Auto-Sync to Payroll:**
  - Unified inbox for managers & HR admins to approve/reject Cuti (Leave), Lembur (Overtime), and Koreksi Absen (Attendance Corrections).
  - Approving a request instantly recalculates and synchronizes the employee's draft payroll item for that period.
- **Comprehensive Audit Trail (Log Aktivitas):**
  - Full compliance log capturing user ID, timestamp, entity, and visual diffs of old vs. new values for salary base adjustments, payroll locking/unlocking, and attendance corrections.

---

## 📱 Core Modules & Features

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Nusantara HRIS & Payroll                          │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Executive Dashboard      │ Real-time attendance, KPIs, payroll trend│
│ 2. Employee Directory       │ NIK, PTKP, NPWP, Bank, BPJS & Salary Base│
│ 3. Presensi & Absensi       │ GPS Geofencing, Live Clock, Timesheets   │
│ 4. Cuti & Izin              │ Annual leave quota tracking, sick leave  │
│ 5. Lembur (Overtime)        │ PP 35/2021 calculation & approval        │
│ 6. Run Payroll              │ Period picker, draft generation, e-slip  │
│ 7. Employee Self-Service    │ Mobile-first app (iOS mockup / desktop)  │
│ 8. Inbox Approval           │ Centralized approval queue + payroll sync│
│ 9. Audit Trail              │ Full activity log with old vs new diffs  │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. Employee Self-Service (ESS Mobile) — `/ess`
Designed with a mobile-first philosophy inspired by the Mekari Talenta mobile app:
- **Beranda (Home):** Live digital clock, real-time Clock-In & Clock-Out buttons with GPS geofence validation, today's shift card, and quick action shortcuts.
- **Pengajuan (Request Center):** 4 sub-forms:
  - Cuti Tahunan (with live remaining annual quota badge).
  - Izin Sakit (with doctor's note / SKD file attachment).
  - Lembur (with instant live Kemenaker PP 35/2021 wage calculator).
  - Koreksi Absen (to correct missed clock-in/out times).
- **Riwayat Absensi:** Monthly attendance log with on-time/late badges.
- **Slip Gaji Saya:** Protected personal view of finalized monthly payslips with instant PDF print/download.

### 2. Inbox Approval — `/approvals`
- Unified workflow queue for Managers and HR Super Admins.
- Modal confirmation for approval and rejection with reason notes.
- Automatic synchronization with active draft payroll periods.

### 3. Audit Trail — `/audit-trail`
- Audit log table tracking critical operations:
  - `UPDATE_SALARY`: Employee base salary or fixed allowance modification.
  - `CORRECT_ATTENDANCE`: Manual attendance adjustment.
  - `LOCK_PAYROLL` / `UNLOCK_PAYROLL`: Locking finalized payroll or unlocking draft.
  - `APPROVE_LEAVE` / `APPROVE_OVERTIME` / `APPROVE_CORRECTION`.
  - `SYNC_PAYROLL`: Automatic recalculation triggered by approval.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, React 18, Server Components)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS with custom design system (Deep Navy `#0F172A`, Blue `#2563EB`, Emerald `#059669`, Crimson `#E11D48`)
- **Icons:** Lucide React
- **Database:** SQLite with [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) in WAL mode
- **Architecture:** Modular service layers, deterministic calculation engine, and cookie-based RBAC session simulation.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.17+ or Node.js 20+
- npm or yarn

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/aldoo1nonlyy/gaji-digital-racik.git
   cd gaji-digital-racik
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Initialization & Seeding:**
   The SQLite database is auto-created in `./data/hris.db`. To seed with realistic Indonesian dummy data (PT Nusantara Teknologi Maju):
   ```bash
   npm run build
   # Or trigger seed via API endpoint: POST http://localhost:3000/api/seed
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

   Or run production build:
   ```bash
   npm run build
   npm run start
   ```

5. **Open in Browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 👥 Simulated Roles & Switcher

A quick role switcher pill bar is located in the top navigation header:
- **Super Admin / HR Admin:** Full access to all modules, employee master data, payroll run, approval inbox, and audit logs.
- **Manager / Supervisor:** Team approval for leaves, overtime, attendance corrections, and team overview.
- **Employee / ESS:** Direct mobile-first employee portal (`/ess`) for GPS attendance, self requests, and personal locked payslips.

---

## 📄 License

MIT License. Designed and developed for PT Nusantara Teknologi Maju.
