'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useKpi } from '@/lib/kpi-context';
import { 
  GraduationCap, 
  BarChart3, 
  FileCheck2, 
  Settings, 
  ClipboardCheck, 
  Menu, 
  X, 
  RotateCcw,
  ChevronDown
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { 
    currentUser, 
    setCurrentUser, 
    allUsers, 
    schoolSettings, 
    period, 
    resetAllData 
  } = useKpi();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Tổng Quan', icon: BarChart3 },
    { href: '/kpi/my-kpi', label: 'Nhập KPI (GV)', icon: ClipboardCheck },
    { href: '/kpi/review', label: 'Duyệt KPI (B1/B2)', icon: FileCheck2 },
    { href: '/admin', label: 'Quản Trị', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-tight text-sm sm:text-base">
                  KPI GIÁO VIÊN
                </span>
                <span className="text-[11px] text-slate-500 truncate max-w-[170px] sm:max-w-none">
                  {schoolSettings.schoolName}
                </span>
              </div>
            </Link>

            {/* Kỳ đánh giá Badge */}
            <div className="hidden lg:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              {period.name} ({period.status === 'OPEN' ? 'Đang mở' : 'Đã khóa sổ'})
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User & Role Switcher */}
          <div className="flex items-center gap-2">
            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-xs text-left"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser.role.slice(0, 2)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="font-semibold text-slate-800 leading-none truncate max-w-[120px]">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">
                    {currentUser.role === 'ADMIN' && 'Quản trị viên'}
                    {currentUser.role === 'BGH' && 'Ban Giám Hiệu'}
                    {currentUser.role === 'TO_TRUONG' && 'Tổ Trưởng'}
                    {currentUser.role === 'GIAO_VIEN' && 'Giáo Viên'}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Chuyển đổi vai trò người dùng (Demo)
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUser(user);
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs hover:bg-slate-50 transition-colors ${
                          currentUser.id === user.id ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                          {user.role.slice(0, 2)}
                        </div>
                        <div className="flex flex-col flex-1 truncate">
                          <span className="truncate">{user.fullName}</span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {user.role} • {user.departmentName || 'Chung'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1 mt-1 px-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu?')) {
                          resetAllData();
                          setUserDropdownOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-1.5 py-1.5 text-[11px] text-slate-500 hover:text-rose-600"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Khôi phục dữ liệu mẫu ban đầu
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>{period.name}</span>
            <span className="font-semibold text-emerald-600">{period.status}</span>
          </div>
        </div>
      )}
    </header>
  );
}
