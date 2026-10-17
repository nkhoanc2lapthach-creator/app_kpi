'use client';

import React, { useState, useMemo } from 'react';
import { useKpi } from '@/lib/kpi-context';
import { KpiSubmission, KpiSubmissionItem } from '@/lib/types';
import { StatusBadge, GradeBadge } from '@/components/StatusBadge';
import { calculateOverallKpi } from '@/lib/kpi-calculator';
import { 
  FileCheck2, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  FileSpreadsheet, 
  Edit3, 
  X, 
  Send 
} from 'lucide-react';

export default function ReviewPage() {
  const { 
    currentUser, 
    period, 
    departments, 
    submissions, 
    reviewStep1ToTruong, 
    reviewStep2Bgh, 
    rejectSubmission 
  } = useKpi();

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal duyệt bài
  const [activeSubmission, setActiveSubmission] = useState<KpiSubmission | null>(null);
  const [editingItems, setEditingItems] = useState<KpiSubmissionItem[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Phân quyền: Tổ trưởng chỉ xem và duyệt thành viên trong tổ; BGH & Admin xem toàn trường
  const isToTruong = currentUser.role === 'TO_TRUONG';
  const isBgh = currentUser.role === 'BGH' || currentUser.role === 'ADMIN';

  // Lọc danh sách bài nộp
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Nếu là Tổ trưởng thì chỉ hiển thị tổ của mình
      if (isToTruong && sub.departmentId !== currentUser.departmentId) {
        return false;
      }

      // Bộ lọc tổ
      if (selectedDept !== 'ALL' && sub.departmentId !== selectedDept) {
        return false;
      }

      // Bộ lọc trạng thái
      if (selectedStatus !== 'ALL' && sub.status !== selectedStatus) {
        return false;
      }

      // Tìm kiếm theo tên / email
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = sub.teacherName.toLowerCase().includes(query);
        const matchEmail = sub.teacherEmail.toLowerCase().includes(query);
        return matchName || matchEmail;
      }

      return true;
    });
  }, [submissions, isToTruong, currentUser.departmentId, selectedDept, selectedStatus, searchQuery]);

  // Mở modal duyệt bài
  const handleOpenReview = (submission: KpiSubmission) => {
    setActiveSubmission(submission);
    // Khởi tạo bản sao items để chỉnh sửa điểm
    const clonedItems = (submission.items || []).map((item) => {
      return {
        ...item,
        // Nếu là Tổ trưởng và chưa có điểm B1 thì mặc định lấy điểm tự chấm
        toTruongScore: item.toTruongScore ?? item.selfScore,
        // Nếu là BGH và chưa có điểm B2 thì lấy điểm B1 (hoặc điểm tự chấm)
        bghScore: item.bghScore ?? (item.toTruongScore ?? item.selfScore),
      };
    });
    setEditingItems(clonedItems);
    setReviewNote(
      isBgh 
        ? submission.bghNote || '' 
        : submission.toTruongNote || ''
    );
  };

  // Cập nhật điểm của 1 item trong modal
  const handleScoreChange = (itemId: string, field: 'toTruongScore' | 'bghScore', value: number) => {
    setEditingItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  // Tính toán điểm số thời gian thực trong modal
  const modalCalculatedScore = useMemo(() => {
    if (!editingItems || editingItems.length === 0) return null;

    const calcItems = editingItems.map((item) => {
      // Quy đổi tạm để tính tỷ lệ
      return {
        section: item.section,
        taskCategory: item.taskCategory,
        taskName: item.taskName,
        standardScore: item.standardScore,
        difficultyCoefficient: item.difficultyCoefficient,
        progressPercent: item.progressPercent,
        qualityPercent: item.qualityPercent,
      };
    });

    return calculateOverallKpi(calcItems);
  }, [editingItems]);

  // Xác nhận duyệt Bước 1 (Tổ trưởng)
  const handleConfirmStep1 = () => {
    if (!activeSubmission) return;
    reviewStep1ToTruong(activeSubmission.id, editingItems, reviewNote);
    setActionMessage(`Đã duyệt Bước 1 cho giáo viên ${activeSubmission.teacherName} và chuyển BGH!`);
    setActiveSubmission(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Xác nhận duyệt Bước 2 (BGH phê duyệt chốt)
  const handleConfirmStep2 = () => {
    if (!activeSubmission) return;
    reviewStep2Bgh(activeSubmission.id, editingItems, reviewNote);
    setActionMessage(`BGH đã phê duyệt chốt điểm thành công cho giáo viên ${activeSubmission.teacherName}!`);
    setActiveSubmission(null);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Trả lại yêu cầu chỉnh sửa
  const handleReject = () => {
    if (!activeSubmission) return;
    const reason = prompt('Nhập lý do yêu cầu điều chỉnh lại:', 'Minh chứng chưa đầy đủ hoặc số liệu chưa khớp.');
    if (reason) {
      rejectSubmission(activeSubmission.id, reason);
      setActionMessage(`Đã trả lại bài nộp của ${activeSubmission.teacherName} kèm lý do.`);
      setActiveSubmission(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Xuất file Excel báo cáo
  const handleExportExcel = async () => {
    try {
      const res = await fetch('/api/kpi/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodName: period.name,
          submissions: filteredSubmissions.map((s) => ({
            teacherName: s.teacherName,
            email: s.teacherEmail,
            departmentName: s.departmentName,
            concurrentRoles: s.concurrentRoles,
            section1Score: s.bghScoreSection1 ?? (s.toTruongScoreSection1 ?? s.selfScoreSection1),
            section2Score: s.bghScoreSection2 ?? (s.toTruongScoreSection2 ?? s.selfScoreSection2),
            bonusScore: s.bghBonusScore ?? (s.toTruongBonusScore ?? s.selfBonusScore),
            totalScore: s.bghFinalScore ?? (s.toTruongTotalScore ?? s.selfTotalScore),
            gradeLabel: s.finalGrade || 'Đang xử lý',
            statusLabel: s.status,
            toTruongScore: s.toTruongTotalScore,
            bghScore: s.bghFinalScore,
            bghNote: s.bghNote,
          })),
        }),
      });

      if (!res.ok) throw new Error('Xuất file thất bại');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao_Cao_KPI_${period.name.replace(/\s+/g, '_')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Lỗi xuất file Excel: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Tiêu đề trang & Tóm tắt quyền */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-indigo-600" />
              QUY TRÌNH DUYỆT KPI 2 BƯỚC
            </h1>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
              {period.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isToTruong && 'Vai trò hiện tại: Tổ trưởng chuyên môn (Duyệt Bước 1 thành viên trong tổ)'}
            {isBgh && 'Vai trò hiện tại: Ban Giám Hiệu / Quản trị viên (Phê duyệt chốt Bước 2 toàn trường)'}
            {!isToTruong && !isBgh && 'Bạn đang xem ở vai trò Giáo viên (Chỉ xem tổng thể)'}
          </p>
        </div>

        {/* Nút xuất Excel */}
        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Xuất Báo Cáo Excel
        </button>
      </div>

      {/* Thông báo thao tác */}
      {actionMessage && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          {actionMessage}
        </div>
      )}

      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email giáo viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-indigo-500 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Lọc Tổ bộ môn (Chỉ cho phép BGH/Admin chọn các tổ khác; Tổ trưởng cố định tổ mình) */}
        {!isToTruong && (
          <div className="w-full md:w-56">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg py-2 px-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500"
            >
              <option value="ALL">-- Tất cả các tổ --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lọc Trạng thái */}
        <div className="w-full md:w-56">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg py-2 px-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500"
          >
            <option value="ALL">-- Tất cả trạng thái --</option>
            <option value="SUBMITTED">Chờ Tổ trưởng duyệt (B1)</option>
            <option value="STEP1_APPROVED">Chờ BGH duyệt chốt (B2)</option>
            <option value="STEP2_APPROVED">BGH đã duyệt chốt</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="REJECTED">Yêu cầu điều chỉnh</option>
          </select>
        </div>
      </div>

      {/* Bảng Danh sách bài nộp KPI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Giáo Viên & Kiêm Nhiệm</th>
                <th className="py-3 px-4">Tổ Chuyên Môn</th>
                <th className="py-3 px-4 text-center">Tự Chấm</th>
                <th className="py-3 px-4 text-center">Tổ Trưởng (B1)</th>
                <th className="py-3 px-4 text-center">BGH Chốt (B2)</th>
                <th className="py-3 px-4 text-center">Xếp Loại</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Không tìm thấy bài nộp nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-medium">#{idx + 1}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sub.teacherName}</div>
                      <div className="text-[11px] text-slate-400">{sub.teacherEmail}</div>
                      {sub.concurrentRoles && sub.concurrentRoles.length > 0 && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          {sub.concurrentRoles.map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {sub.departmentName || 'Chung'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                      {sub.selfTotalScore} đ
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-blue-700">
                      {sub.toTruongTotalScore ? `${sub.toTruongTotalScore} đ` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-emerald-700">
                      {sub.bghFinalScore ? `${sub.bghFinalScore} đ` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <GradeBadge
                        grade={sub.finalGrade}
                        score={sub.bghFinalScore || sub.toTruongTotalScore || sub.selfTotalScore}
                      />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenReview(sub)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        {sub.status === 'STEP2_APPROVED' ? 'Xem lại' : 'Chấm & Duyệt'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL DUYỆT BÀI CHI TIẾT SIDE-BY-SIDE                     */}
      {/* ========================================================= */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">
                  {activeSubmission.teacherName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    Duyệt KPI: {activeSubmission.teacherName}
                    <StatusBadge status={activeSubmission.status} />
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeSubmission.departmentName} • {activeSubmission.periodName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubmission(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Danh sách tiêu chí Side-by-side */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                <span>
                  <strong>Hướng dẫn:</strong> So sánh điểm tự chấm của giáo viên, xem trực tiếp file minh chứng Drive và nhập điều chỉnh điểm của Tổ trưởng hoặc BGH trực tiếp vào ô số.
                </span>
              </div>

              {/* Bảng so sánh đa cột Side-by-Side */}
              <div className="space-y-3">
                {editingItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Cột 1: Thông tin tiêu chí */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-slate-800 text-xs">{item.taskName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                            {item.section === 'SECTION_I' ? 'Mục I' : 'Mục II'} • Chuẩn: {item.standardScore}đ
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                        )}
                        {item.teacherNote && (
                          <p className="text-[11px] text-indigo-700 mt-1 italic">
                            💬 GV ghi chú: &ldquo;{item.teacherNote}&rdquo;
                          </p>
                        )}

                        {/* Minh chứng Drive đính kèm */}
                        {item.proofFiles && item.proofFiles.length > 0 ? (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] font-semibold text-slate-500">Minh chứng Drive:</span>
                            {item.proofFiles.map((f) => (
                              <a
                                key={f.fileId}
                                href={f.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium border border-indigo-200"
                              >
                                {f.fileName}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 mt-1 italic">
                            Chưa có file minh chứng đính kèm
                          </div>
                        )}
                      </div>

                      {/* Cột 2: Bảng so sánh 3 cấp điểm Side-by-Side */}
                      <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex-shrink-0">
                        {/* 1. Điểm GV tự chấm */}
                        <div className="text-center px-2">
                          <span className="text-[10px] text-slate-500 block uppercase font-bold">
                            GV Chấm
                          </span>
                          <span className="font-black text-slate-800 text-sm">{item.selfScore}</span>
                        </div>

                        <div className="h-7 w-px bg-slate-200"></div>

                        {/* 2. Điểm Tổ trưởng chấm (B1) */}
                        <div className="text-center px-1">
                          <span className="text-[10px] text-blue-600 block uppercase font-bold">
                            Tổ Trưởng
                          </span>
                          {isToTruong ? (
                            <input
                              type="number"
                              step="0.5"
                              value={item.toTruongScore ?? item.selfScore}
                              onChange={(e) =>
                                handleScoreChange(item.id, 'toTruongScore', Number(e.target.value))
                              }
                              className="w-16 text-center font-bold text-xs py-1 border border-blue-300 rounded bg-white text-blue-800 focus:outline-blue-500"
                            />
                          ) : (
                            <span className="font-bold text-blue-700 text-sm">
                              {item.toTruongScore ?? '—'}
                            </span>
                          )}
                        </div>

                        <div className="h-7 w-px bg-slate-200"></div>

                        {/* 3. Điểm BGH duyệt chốt (B2) */}
                        <div className="text-center px-1">
                          <span className="text-[10px] text-emerald-600 block uppercase font-bold">
                            BGH Chốt
                          </span>
                          {isBgh ? (
                            <input
                              type="number"
                              step="0.5"
                              value={item.bghScore ?? (item.toTruongScore ?? item.selfScore)}
                              onChange={(e) =>
                                handleScoreChange(item.id, 'bghScore', Number(e.target.value))
                              }
                              className="w-16 text-center font-bold text-xs py-1 border border-emerald-300 rounded bg-white text-emerald-800 focus:outline-emerald-500"
                            />
                          ) : (
                            <span className="font-bold text-emerald-700 text-sm">
                              {item.bghScore ?? '—'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Nhận xét của người duyệt */}
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {isBgh ? 'Nhận xét của Ban Giám Hiệu:' : 'Nhận xét của Tổ Trưởng chuyên môn:'}
                </label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do điều chỉnh điểm số..."
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-500"
                />
              </div>
            </div>

            {/* Modal Footer: Tổng điểm quy đổi & Nút phê duyệt */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">TỔNG ĐIỂM DỰ KIẾN</span>
                  <span className="font-black text-indigo-700 text-lg">
                    {modalCalculatedScore?.totalScore} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">XẾP LOẠI</span>
                  <GradeBadge grade={modalCalculatedScore?.grade} />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Yêu Cầu Sửa Lại
                </button>

                {isToTruong && (
                  <button
                    type="button"
                    onClick={handleConfirmStep1}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Duyệt B1 & Chuyển BGH
                  </button>
                )}

                {isBgh && (
                  <button
                    type="button"
                    onClick={handleConfirmStep2}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Phê Duyệt Chốt Điểm (B2)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
