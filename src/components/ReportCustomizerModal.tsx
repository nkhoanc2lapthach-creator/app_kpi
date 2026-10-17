'use client';

import React, { useState } from 'react';
import { KpiSubmission, SchoolSettings } from '@/lib/types';
import { 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  X, 
  Settings2
} from 'lucide-react';

interface ReportCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: KpiSubmission[];
  selectedSubmissions: KpiSubmission[];
  schoolSettings: SchoolSettings;
  periodName: string;
  onOpenPrintModal: (subs: KpiSubmission[]) => void;
}

export function ReportCustomizerModal({
  isOpen,
  onClose,
  submissions,
  selectedSubmissions,
  schoolSettings,
  periodName,
  onOpenPrintModal,
}: ReportCustomizerModalProps) {
  const [scope, setScope] = useState<'selected' | 'all'>(
    selectedSubmissions.length > 0 ? 'selected' : 'all'
  );

  const [columns, setColumns] = useState({
    stt: true,
    fullName: true,
    email: true,
    department: true,
    concurrentRoles: true,
    section1Total: true,
    section1Details: false,
    section2Total: true,
    section2Details: false,
    bonus: true,
    selfScore: true,
    toTruongScore: true,
    bghScore: true,
    totalScore: true,
    grade: true,
    status: true,
    toTruongNote: true,
    bghNote: true,
  });

  const [loadingExcel, setLoadingExcel] = useState(false);
  const [loadingWord, setLoadingWord] = useState(false);

  if (!isOpen) return null;

  const targetSubmissions = scope === 'selected' && selectedSubmissions.length > 0
    ? selectedSubmissions
    : submissions;

  const toggleColumn = (key: keyof typeof columns) => {
    setColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAll = (val: boolean) => {
    setColumns({
      stt: val,
      fullName: val,
      email: val,
      department: val,
      concurrentRoles: val,
      section1Total: val,
      section1Details: val,
      section2Total: val,
      section2Details: val,
      bonus: val,
      selfScore: val,
      toTruongScore: val,
      bghScore: val,
      totalScore: val,
      grade: val,
      status: val,
      toTruongNote: val,
      bghNote: val,
    });
  };

  // Xuất file Excel tùy biến
  const handleExportCustomExcel = async () => {
    setLoadingExcel(true);
    try {
      const res = await fetch('/api/kpi/export-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions: targetSubmissions,
          periodName,
          columns,
        }),
      });

      if (!res.ok) throw new Error('Xuất Excel thất bại');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_Cao_KPI_Tuy_Chon_${targetSubmissions.length}_GV.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Lỗi xuất báo cáo Excel: ' + err.message);
    } finally {
      setLoadingExcel(false);
    }
  };

  // Xuất file Word (.docx)
  const handleExportWord = async () => {
    setLoadingWord(true);
    try {
      const res = await fetch('/api/kpi/export-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions: targetSubmissions,
          schoolSettings,
        }),
      });

      if (!res.ok) throw new Error('Xuất Word thất bại');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Danh_Sach_Phieu_KPI_${targetSubmissions.length}_GV.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Lỗi xuất file Word: ' + err.message);
    } finally {
      setLoadingWord(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tùy Biến Nội Dung Xuất Báo Cáo KPI
              </h3>
              <p className="text-xs text-slate-500">
                Chọn phạm vi giáo viên, cấu hình các cột hiển thị và định dạng xuất
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Chọn phạm vi xuất */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1. Phạm vi xuất báo cáo:
            </span>
            <div className="flex items-center gap-4 text-xs font-medium">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'selected'}
                  onChange={() => setScope('selected')}
                  disabled={selectedSubmissions.length === 0}
                  className="accent-indigo-600"
                />
                <span>
                  Các giáo viên được tích chọn (<strong>{selectedSubmissions.length}</strong> giáo viên)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'all'}
                  onChange={() => setScope('all')}
                  className="accent-indigo-600"
                />
                <span>
                  Toàn bộ danh sách hiện tại (<strong>{submissions.length}</strong> giáo viên)
                </span>
              </label>
            </div>
          </div>

          {/* 2. Chọn cột hiển thị */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Chọn các trường thông tin / tiêu chí hiển thị:
              </span>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => selectAll(true)}
                  className="text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  Chọn tất cả
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => selectAll(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs border border-slate-200 rounded-xl p-3 bg-white">
              {/* Cột cơ bản */}
              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={columns.fullName}
                  onChange={() => toggleColumn('fullName')}
                  className="accent-indigo-600 rounded"
                />
                <span>Họ và tên giáo viên</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={columns.department}
                  onChange={() => toggleColumn('department')}
                  className="accent-indigo-600 rounded"
                />
                <span>Tổ chuyên môn</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={columns.concurrentRoles}
                  onChange={() => toggleColumn('concurrentRoles')}
                  className="accent-indigo-600 rounded"
                />
                <span>Nhiệm vụ kiêm nhiệm</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={columns.email}
                  onChange={() => toggleColumn('email')}
                  className="accent-indigo-600 rounded"
                />
                <span>Email đăng nhập</span>
              </label>

              {/* Mục I */}
              <label className="flex items-center gap-2 p-1.5 hover:bg-blue-50/50 rounded cursor-pointer font-bold text-blue-900">
                <input
                  type="checkbox"
                  checked={columns.section1Total}
                  onChange={() => toggleColumn('section1Total')}
                  className="accent-indigo-600 rounded"
                />
                <span>Điểm Mục I (Tổng 30đ)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-blue-50/50 rounded cursor-pointer text-blue-800">
                <input
                  type="checkbox"
                  checked={columns.section1Details}
                  onChange={() => toggleColumn('section1Details')}
                  className="accent-indigo-600 rounded"
                />
                <span>Chi tiết từng tiêu chí Mục I</span>
              </label>

              {/* Mục II */}
              <label className="flex items-center gap-2 p-1.5 hover:bg-indigo-50/50 rounded cursor-pointer font-bold text-indigo-900">
                <input
                  type="checkbox"
                  checked={columns.section2Total}
                  onChange={() => toggleColumn('section2Total')}
                  className="accent-indigo-600 rounded"
                />
                <span>Điểm Mục II (Tổng 70đ quy đổi)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-indigo-50/50 rounded cursor-pointer text-indigo-800">
                <input
                  type="checkbox"
                  checked={columns.section2Details}
                  onChange={() => toggleColumn('section2Details')}
                  className="accent-indigo-600 rounded"
                />
                <span>Chi tiết từng tiêu chí Mục II</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-purple-50/50 rounded cursor-pointer font-semibold text-purple-900">
                <input
                  type="checkbox"
                  checked={columns.bonus}
                  onChange={() => toggleColumn('bonus')}
                  className="accent-indigo-600 rounded"
                />
                <span>Điểm Thưởng (Bonus)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={columns.selfScore}
                  onChange={() => toggleColumn('selfScore')}
                  className="accent-indigo-600 rounded"
                />
                <span>Điểm GV tự chấm</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer font-semibold text-blue-700">
                <input
                  type="checkbox"
                  checked={columns.toTruongScore}
                  onChange={() => toggleColumn('toTruongScore')}
                  className="accent-indigo-600 rounded"
                />
                <span>Điểm Tổ trưởng chấm (B1)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer font-bold text-emerald-700">
                <input
                  type="checkbox"
                  checked={columns.bghScore}
                  onChange={() => toggleColumn('bghScore')}
                  className="accent-indigo-600 rounded"
                />
                <span>Điểm BGH duyệt chốt (B2)</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-emerald-50/60 rounded cursor-pointer font-black text-emerald-900">
                <input
                  type="checkbox"
                  checked={columns.totalScore}
                  onChange={() => toggleColumn('totalScore')}
                  className="accent-indigo-600 rounded"
                />
                <span>Tổng Điểm KPI Cuối Cùng</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-emerald-50/60 rounded cursor-pointer font-bold text-emerald-900">
                <input
                  type="checkbox"
                  checked={columns.grade}
                  onChange={() => toggleColumn('grade')}
                  className="accent-indigo-600 rounded"
                />
                <span>Xếp Loại Thi Đua</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={columns.toTruongNote}
                  onChange={() => toggleColumn('toTruongNote')}
                  className="accent-indigo-600 rounded"
                />
                <span>Nhận xét của Tổ trưởng</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={columns.bghNote}
                  onChange={() => toggleColumn('bghNote')}
                  className="accent-indigo-600 rounded"
                />
                <span>Nhận xét của BGH</span>
              </label>
            </div>
          </div>
        </div>

        {/* 3. Nút xuất theo các định dạng */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Xuất Excel */}
            <button
              type="button"
              disabled={loadingExcel}
              onClick={handleExportCustomExcel}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {loadingExcel ? 'Đang xuất...' : 'Xuất Excel (.xlsx)'}
            </button>

            {/* Xuất Word */}
            <button
              type="button"
              disabled={loadingWord}
              onClick={handleExportWord}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {loadingWord ? 'Đang tạo...' : 'Xuất Word (.docx)'}
            </button>

            {/* In / Lưu PDF A4 */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPrintModal(targetSubmissions);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
              In / Xuất PDF (Khổ A4)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
