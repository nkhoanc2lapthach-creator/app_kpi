import React from 'react';
import { SubmissionStatus, KpiGrade } from '@/lib/types';
import { Clock, CheckCircle2, AlertCircle, FileEdit, Award } from 'lucide-react';

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  switch (status) {
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <FileEdit className="w-3.5 h-3.5 text-slate-500" />
          Bản nháp
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          Chờ Tổ trưởng duyệt (B1)
        </span>
      );
    case 'STEP1_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Chờ BGH duyệt chốt (B2)
        </span>
      );
    case 'STEP2_APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          BGH đã duyệt chốt
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Yêu cầu điều chỉnh
        </span>
      );
    default:
      return null;
  }
}

export function GradeBadge({ grade, score }: { grade?: KpiGrade; score?: number }) {
  if (!grade && typeof score === 'number') {
    if (score >= 90) grade = 'XUAT_SAC';
    else if (score >= 75) grade = 'TOT';
    else if (score >= 50) grade = 'HOAN_THANH';
    else grade = 'CHUA_HOAN_THANH';
  }

  switch (grade) {
    case 'XUAT_SAC':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm">
          <Award className="w-3.5 h-3.5" />
          Xuất sắc
        </span>
      );
    case 'TOT':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          Tốt
        </span>
      );
    case 'HOAN_THANH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
          Hoàn thành
        </span>
      );
    case 'CHUA_HOAN_THANH':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200">
          Chưa hoàn thành
        </span>
      );
    default:
      return <span className="text-xs text-slate-400">Chưa xếp loại</span>;
  }
}
