import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { KpiProvider } from '@/lib/kpi-context';
import { Navbar } from '@/components/Navbar';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'Hệ Thống Quản Lý & Đánh Giá KPI Giáo Viên (Self-Hosted)',
  description:
    'Hệ thống quản lý, chấm điểm và đánh giá KPI hàng tháng dành cho giáo viên và nhân viên nhà trường với quy trình duyệt 2 bước và tích hợp Google Drive tự động.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen flex flex-col text-slate-800`}
      >
        <KpiProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            <div className="max-w-7xl mx-auto px-4 space-y-1">
              <p className="font-semibold text-slate-700">
                Hệ Thống Quản Lý & Chấm Điểm KPI Giáo Viên Nhà Trường (Open Source / Self-Hosted)
              </p>
              <p className="text-[11px] text-slate-400">
                Quy trình duyệt 2 bước • Tự động đẩy minh chứng lên Google Drive • Deploy 1-Click lên Vercel
              </p>
            </div>
          </footer>
        </KpiProvider>
      </body>
    </html>
  );
}
