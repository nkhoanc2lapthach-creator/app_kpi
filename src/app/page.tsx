'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useKpi } from '@/lib/kpi-context';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  Award, 
  ArrowRight, 
  ClipboardCheck, 
  FileCheck2, 
  Building, 
  BarChart2 
} from 'lucide-react';

export default function HomePage() {
  const { 
    period, 
    schoolSettings, 
    allUsers, 
    submissions, 
    departments 
  } = useKpi();

  // Thống kê số liệu toàn trường
  const stats = useMemo(() => {
    const totalTeachers = allUsers.filter((u) => u.role !== 'ADMIN').length;
    const submittedCount = submissions.filter((s) => s.status !== 'DRAFT').length;
    const step1Count = submissions.filter((s) => s.status === 'STEP1_APPROVED').length;
    const finalizedCount = submissions.filter((s) => s.status === 'STEP2_APPROVED').length;
    const waitingStep1Count = submissions.filter((s) => s.status === 'SUBMITTED').length;

    // Tỷ lệ nộp bài
    const submissionRate = totalTeachers > 0 ? Math.round((submittedCount / totalTeachers) * 100) : 0;

    // Phân loại xếp loại
    let xuatSac = 0;
    let tot = 0;
    let hoanThanh = 0;
    let chuaHoanThanh = 0;

    let totalScoreSum = 0;
    let scoredCount = 0;

    for (const sub of submissions) {
      const finalScore = sub.bghFinalScore || sub.toTruongTotalScore || sub.selfTotalScore;
      if (finalScore > 0) {
        totalScoreSum += finalScore;
        scoredCount++;
      }

      if (finalScore >= 90) xuatSac++;
      else if (finalScore >= 75) tot++;
      else if (finalScore >= 50) hoanThanh++;
      else chuaHoanThanh++;
    }

    const avgScore = scoredCount > 0 ? (totalScoreSum / scoredCount).toFixed(1) : '0';

    return {
      totalTeachers,
      submittedCount,
      waitingStep1Count,
      step1Count,
      finalizedCount,
      submissionRate,
      avgScore,
      gradeDistribution: [
        { label: 'Xuất sắc (≥90đ)', count: xuatSac, color: 'bg-emerald-500', text: 'text-emerald-700' },
        { label: 'Tốt (75-89đ)', count: tot, color: 'bg-blue-500', text: 'text-blue-700' },
        { label: 'Hoàn thành (50-74đ)', count: hoanThanh, color: 'bg-amber-500', text: 'text-amber-700' },
        { label: 'Chưa đạt (<50đ)', count: chuaHoanThanh, color: 'bg-rose-500', text: 'text-rose-700' },
      ],
    };
  }, [allUsers, submissions]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Banner Chào mừng & Trạng thái kỳ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-blue-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm border border-indigo-400/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Hệ thống Quản lý & Đánh giá KPI Giáo viên • {period.name}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {schoolSettings.schoolName}
          </h1>
          <p className="text-sm text-indigo-200 leading-relaxed">
            Hệ thống minh bạch hóa quy trình đánh giá chất lượng chuyên môn giáo viên. Tự động lưu minh chứng Google Drive, tính điểm thưởng và quy trình phê duyệt 2 bước chuẩn mực.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link
              href="/kpi/my-kpi"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition-all shadow-md shadow-black/10"
            >
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              Nhập KPI Cá Nhân
            </Link>
            <Link
              href="/kpi/review"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white font-semibold text-xs transition-all border border-indigo-500/30"
            >
              <FileCheck2 className="w-4 h-4 text-indigo-300" />
              Duyệt KPI (Tổ & BGH)
            </Link>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* 4 Thẻ chỉ số tổng quan (KPI Summary Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Thẻ 1: Tổng giáo viên */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Tổng Nhân Sự
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{stats.totalTeachers}</span>
              <span className="text-xs text-slate-500">giáo viên</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 2: Tỷ lệ nộp bài */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Tiến Độ Nộp Bài
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{stats.submissionRate}%</span>
              <span className="text-xs text-slate-500">({stats.submittedCount}/{stats.totalTeachers})</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 3: BGH Đã duyệt chốt */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              BGH Đã Phê Duyệt
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600">{stats.finalizedCount}</span>
              <span className="text-xs text-slate-500">hồ sơ đã chốt</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Thẻ 4: Điểm trung bình */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Điểm TB Toàn Trường
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-indigo-700">{stats.avgScore}</span>
              <span className="text-xs text-slate-500">/ 100 điểm</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Bảng Biểu Đồ Thống Kê & Tiến Độ Quy Trình */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: Phân bổ xếp loại KPI & Tiến độ nộp bài */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Phân Bố Xếp Loại KPI & Trạng Thái Duyệt
            </h2>
            <span className="text-xs text-slate-400">Cập nhật thời gian thực</span>
          </div>

          {/* Thanh tỷ lệ xếp loại */}
          <div className="space-y-3">
            <span className="text-xs font-semibold text-slate-700">Tỷ lệ các mức xếp loại:</span>
            <div className="space-y-2">
              {stats.gradeDistribution.map((item, idx) => {
                const percent = stats.totalTeachers > 0 ? Math.round((item.count / stats.totalTeachers) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.label}</span>
                      <span className={`font-bold ${item.text}`}>{item.count} GV ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tiến độ quy trình 2 bước */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-700 block mb-3">
              Trạng thái hồ sơ trong quy trình 2 bước:
            </span>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3">
                <span className="text-[11px] text-blue-700 font-semibold block">Chờ Tổ Trưởng (B1)</span>
                <span className="text-xl font-bold text-blue-900 mt-1 block">{stats.waitingStep1Count}</span>
              </div>
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                <span className="text-[11px] text-amber-700 font-semibold block">Chờ BGH Duyệt (B2)</span>
                <span className="text-xl font-bold text-amber-900 mt-1 block">{stats.step1Count}</span>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
                <span className="text-[11px] text-emerald-700 font-semibold block">BGH Đã Phê Duyệt</span>
                <span className="text-xl font-bold text-emerald-900 mt-1 block">{stats.finalizedCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cột 3: Danh sách các Tổ chuyên môn */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Tổ Chuyên Môn ({departments.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {departments.map((dept) => {
              const countInDept = allUsers.filter((u) => u.departmentId === dept.id).length;
              return (
                <div
                  key={dept.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/70 transition-colors"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{dept.name}</span>
                    <span className="text-[10px] text-slate-500">{dept.code}</span>
                  </div>
                  <span className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-lg shadow-xs">
                    {countInDept} nhân sự
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <Link
              href="/kpi/review"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
            >
              Xem danh sách duyệt theo tổ <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
