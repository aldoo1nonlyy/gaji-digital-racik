import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { getDb } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Nusantara HRIS & Payroll - PT Nusantara Teknologi Maju",
  description: "Sistem HRIS & Penggajian Otomatis Standar Indonesia (UU Ketenagakerjaan & PPh 21 TER 2024)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const currentRole = cookieStore.get('user_role')?.value || 'admin';

  let currentUser: any = null;
  try {
    const db = getDb();
    currentUser = db.prepare(`
      SELECT u.id as user_id, u.username, u.role,
             e.id as employee_id, e.nik, e.full_name, e.email, e.avatar_url,
             d.name as department_name, p.title as position_title
      FROM users u
      JOIN employees e ON u.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN positions p ON e.position_id = p.id
      WHERE u.role = ?
      LIMIT 1
    `).get(currentRole);
  } catch (e) {
    console.error('Error fetching layout user:', e);
  }

  return (
    <html lang="id">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F8FAFC] text-slate-800 flex h-screen overflow-hidden`}>
        {/* Sidebar */}
        <Sidebar currentRole={currentRole} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <Header currentRole={currentRole} currentUser={currentUser} />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
