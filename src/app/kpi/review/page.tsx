'use client';

import React, { useState, useMemo } from 'react';
import { useKpi } from '@/lib/kpi-context';
import { KpiSubmission, KpiSubmissionItem } from '@/lib/types';
import { StatusBadge, GradeBadge } from '@/components/StatusBadge';
import { calculateOverallKpi } from '@/lib/kpi-calculator';
import { KpiPrintReportModal } from '@/components/KpiPrintReportModal';
import { ReportCustomizerModal } from '@/components/ReportCustomizerModal';
import { 
  FileCheck2, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Edit3, 
  X, 
  Send,
  Printer,
  Sliders
} from 'lucide-react';

export default function ReviewPage() {
  const { 
    currentUser, 
    period, 
    departments, 
    submissions, 
    schoolSettings,
    reviewStep1ToTruong, 
    reviewStep2Bgh, 
    rejectSubmission,
    bulkReviewStep1,
    bulkReviewStep2,
    bulkReject
  } = useKpi();

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Danh sách ID các bài nộp được tích chọn hàng loạt
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal duyệt 1 bài chi tiết Side-by-side
  const [activeSubmission, setActiveSubmission] = useState<KpiSubmission | null>(null);
  const [editingItems, setEditingItems] = useState<KpiSubmissionItem[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modal In / Xuất PDF & Word khổ A4
  const [printSubmissions, setPrintSubmissions] = useState<KpiSubmission[] | null>(null);

  // Modal tùy biến cấu hình xuất báo cáo
  const [showCustomizerModal, setShowCustomizerModal] = useState(false);

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

  // Danh sách các bài nộp đang được tích chọn
  const selectedSubmissionsList = useMemo(() => {
    const idSet = new Set(selectedIds);
    return submissions.filter((s) => idSet.has(s.id));
  }, [selectedIds, submissions]);

  // Xử lý chọn tất cả / bỏ chọn tất cả
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map((s) => s.id));
    }
  };

  // Toggle chọn 1 hàng
  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Mở modal duyệt bài đơn
  const handleOpenReview = (submission: KpiSubmission) => {
    setActiveSubmission(submission);
    const clonedItems = (submission.items || []).map((item) => {
      return {
        ...item,
        toTruongScore: item.toTruongScore ?? item.selfScore,
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

  // --- HÀNH ĐỘNG DUYỆT HÀNG LOẠT ---
  const handleBulkStep1Approve = () => {
    if (selectedIds.length === 0) return;
    const note = prompt(
      `Duyệt hàng loạt Bước 1 cho ${selectedIds.length} giáo viên đã chọn?\nNhập ghi chú chung của Tổ trưởng:`,
      'Tổ trưởng nhất trí và thông qua kết quả tự đánh giá của giáo viên.'
    );
    if (note !== null) {
      bulkReviewStep1(selectedIds, note);
      setActionMessage(`Đã duyệt Bước 1 thành công cho ${selectedIds.length} giáo viên!`);
      setSelectedIds([]);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleBulkStep2Approve = () => {
    if (selectedIds.length === 0) return;
    const note = prompt(
      `Ban Giám Hiệu phê duyệt chốt điểm hàng loạt cho ${selectedIds.length} giáo viên đã chọn?\nNhập nhận xét chung của BGH:`,
      'Ban Giám Hiệu phê duyệt chốt kết quả đánh giá KPI.'
    );
    if (note !== null) {
      bulkReviewStep2(selectedIds, note);
      setActionMessage(`Ban Giám Hiệu đã phê duyệt chốt điểm thành công cho ${selectedIds.length} giáo viên!`);
      setSelectedIds([]);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleBulkReject = () => {
    if (selectedIds.length === 0) return;
    const reason = prompt(
      `Yêu cầu điều chỉnh lại đối với ${selectedIds.length} bài nộp đã chọn?\nNhập lý do:`,
      'Hồ sơ minh chứng chưa đầy đủ hoặc cần rà soát lại số liệu.'
    );
    if (reason !== null) {
      bulkReject(selectedIds, reason);
      setActionMessage(`Đã trả lại ${selectedIds.length} bài nộp yêu cầu bổ sung.`);
      setSelectedIds([]);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Tiêu đề trang & Tóm tắt quyền */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/90">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                QUY TRÌNH DUYỆT & ĐÁNH GIÁ KPI
                <span className="text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full">
                  {period.name}
                </span>
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                {isToTruong && 'Tổ trưởng chuyên môn: Duyệt Bước 1 thành viên trong tổ • Duyệt hàng loạt hoặc sửa điểm từng tiêu chí'}
                {isBgh && 'Ban Giám Hiệu: Phê duyệt chốt Bước 2 toàn trường • Ghi đè điểm, nhận xét và khóa sổ đánh giá'}
                {!isToTruong && !isBgh && 'Chế độ xem tổng thể tiến độ đánh giá KPI nhà trường'}
              </p>
            </div>
          </div>
        </div>

        {/* Nút Xuất Báo Cáo & In Khổ A4 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút mở modal tùy biến báo cáo */}
          <button
            type="button"
            onClick={() => setShowCustomizerModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 transition-colors shadow-xs"
            title="Tùy biến cột, nội dung và định dạng xuất báo cáo"
          >
            <Sliders className="w-4 h-4 text-indigo-600" />
            Tùy Biến Báo Cáo
          </button>

          {/* Nút In / Xuất PDF Khổ A4 toàn bộ hoặc đã chọn */}
          <button
            type="button"
            onClick={() => {
              const target = selectedSubmissionsList.length > 0 ? selectedSubmissionsList : filteredSubmissions;
              setPrintSubmissions(target);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all"
            title="In hoặc Lưu PDF khổ A4 có chữ ký 3 bên"
          >
            <Printer className="w-4 h-4" />
            In / Xuất PDF (A4)
          </button>
        </div>
      </div>

      {/* Thông báo thao tác */}
      {actionMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-md flex items-center gap-2.5 text-sm font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          {actionMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* THANH THAO TÁC DUYỆT HÀNG LOẠT (BULK ACTIONS BAR)                         */}
      {/* ========================================================================= */}
      {selectedIds.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn border border-indigo-700">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center font-black text-xs text-indigo-200">
              {selectedIds.length}
            </span>
            <div>
              <span className="font-extrabold text-sm block">
                Đã chọn {selectedIds.length} giáo viên
              </span>
              <span className="text-[11px] text-indigo-200">
                Thực hiện duyệt hoặc xuất báo cáo hàng loạt cho các hồ sơ được chọn
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Tổ trưởng duyệt hàng loạt B1 */}
            {isToTruong && (
              <button
                type="button"
                onClick={handleBulkStep1Approve}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Duyệt Hàng Loạt Bước 1
              </button>
            )}

            {/* BGH duyệt chốt hàng loạt B2 */}
            {isBgh && (
              <button
                type="button"
                onClick={handleBulkStep2Approve}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Phê Duyệt Chốt Hàng Loạt (B2)
              </button>
            )}

            {/* Trả lại hàng loạt */}
            <button
              type="button"
              onClick={handleBulkReject}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors"
            >
              Yêu Cầu Sửa
            </button>

            {/* In / Xuất PDF A4 cho các GV đã chọn */}
            <button
              type="button"
              onClick={() => setPrintSubmissions(selectedSubmissionsList)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              In Phiếu A4 ({selectedIds.length})
            </button>

            {/* Bỏ chọn */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Bộ lọc & Tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-3">
        {/* Tìm kiếm */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email giáo viên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-indigo-600 bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Lọc Tổ bộ môn */}
        {!isToTruong && (
          <div className="w-full md:w-56">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full text-xs font-semibold border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50 focus:bg-white focus:outline-indigo-600"
            >
              <option value="ALL">⭐ Tất cả các tổ chuyên môn</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  📁 {d.name}
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
            className="w-full text-xs font-semibold border border-slate-200 rounded-xl py-2.5 px-3 bg-slate-50 focus:bg-white focus:outline-indigo-600"
          >
            <option value="ALL">🔍 Tất cả trạng thái nộp</option>
            <option value="SUBMITTED">Chờ Tổ trưởng duyệt (B1)</option>
            <option value="STEP1_APPROVED">Chờ BGH duyệt chốt (B2)</option>
            <option value="STEP2_APPROVED">BGH đã duyệt chốt</option>
            <option value="DRAFT">Bản nháp</option>
            <option value="REJECTED">Yêu cầu điều chỉnh</option>
          </select>
        </div>
      </div>

      {/* Bảng Danh sách bài nộp KPI */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={filteredSubmissions.length > 0 && selectedIds.length === filteredSubmissions.length}
                    onChange={handleToggleSelectAll}
                    className="accent-indigo-600 rounded cursor-pointer w-4 h-4"
                    title="Chọn tất cả"
                  />
                </th>
                <th className="py-3.5 px-3">Giáo Viên & Kiêm Nhiệm</th>
                <th className="py-3.5 px-3">Tổ Chuyên Môn</th>
                <th className="py-3.5 px-3 text-center">Tự Chấm</th>
                <th className="py-3.5 px-3 text-center">Tổ Trưởng (B1)</th>
                <th className="py-3.5 px-3 text-center">BGH Chốt (B2)</th>
                <th className="py-3.5 px-3 text-center">Xếp Loại</th>
                <th className="py-3.5 px-3 text-center">Trạng Thái</th>
                <th className="py-3.5 px-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy bài nộp nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isChecked = selectedIds.includes(sub.id);
                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isChecked ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      {/* Checkbox hàng */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRow(sub.id)}
                          className="accent-indigo-600 rounded cursor-pointer w-4 h-4"
                        />
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {sub.teacherName}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{sub.teacherEmail}</div>
                        {sub.concurrentRoles && sub.concurrentRoles.length > 0 && (
                          <div className="mt-1 flex gap-1 flex-wrap">
                            {sub.concurrentRoles.map((r, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.2 rounded border border-slate-200"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-800">
                        {sub.departmentName || 'Chung'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {sub.selfTotalScore} đ
                      </td>

                      <td className="py-3.5 px-3 text-center font-black text-blue-800">
                        {sub.toTruongTotalScore ? `${sub.toTruongTotalScore} đ` : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-black text-emerald-800">
                        {sub.bghFinalScore ? `${sub.bghFinalScore} đ` : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <GradeBadge
                          grade={sub.finalGrade}
                          score={sub.bghFinalScore || sub.toTruongTotalScore || sub.selfTotalScore}
                        />
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <StatusBadge status={sub.status} />
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem / In A4 cá nhân */}
                          <button
                            type="button"
                            onClick={() => setPrintSubmissions([sub])}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200"
                            title="Xem phiếu in / PDF / Word A4 có chữ ký"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Nút Chấm điểm & Duyệt */}
                          <button
                            type="button"
                            onClick={() => handleOpenReview(sub)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors border border-indigo-200 shadow-xs"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {sub.status === 'STEP2_APPROVED' ? 'Xem lại' : 'Chấm & Duyệt'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-sm shadow">
                  {activeSubmission.teacherName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    Duyệt KPI: {activeSubmission.teacherName}
                    <StatusBadge status={activeSubmission.status} />
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
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
              <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-xs text-blue-950 font-medium flex items-center justify-between">
                <span>
                  <strong>Hướng dẫn:</strong> So sánh điểm tự chấm của giáo viên, xem trực tiếp file minh chứng Drive và nhập điều chỉnh điểm của Tổ trưởng hoặc BGH trực tiếp vào ô số.
                </span>
              </div>

              {/* Bảng so sánh đa cột Side-by-Side */}
              <div className="space-y-3">
                {editingItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      {/* Cột 1: Thông tin tiêu chí */}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.taskName}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                            {item.section === 'SECTION_I' ? 'Mục I' : 'Mục II'} • Chuẩn: {item.standardScore}đ
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                        )}
                        {item.teacherNote && (
                          <p className="text-xs text-indigo-700 italic">
                            💬 GV ghi chú: &ldquo;{item.teacherNote}&rdquo;
                          </p>
                        )}

                        {/* Minh chứng Drive đính kèm */}
                        {item.proofFiles && item.proofFiles.length > 0 ? (
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-600">Minh chứng Drive:</span>
                            {item.proofFiles.map((f) => (
                              <a
                                key={f.fileId}
                                href={f.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-lg font-bold border border-indigo-200"
                              >
                                {f.fileName}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic pt-0.5">
                            Chưa có file minh chứng đính kèm
                          </div>
                        )}
                      </div>

                      {/* Cột 2: Bảng so sánh 3 cấp điểm Side-by-Side */}
                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex-shrink-0">
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
                          <span className="text-[10px] text-blue-700 block uppercase font-bold">
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
                              className="w-16 text-center font-bold text-xs py-1 border border-blue-300 rounded-lg bg-white text-blue-800 focus:outline-blue-500 shadow-xs"
                            />
                          ) : (
                            <span className="font-bold text-blue-800 text-sm">
                              {item.toTruongScore ?? '—'}
                            </span>
                          )}
                        </div>

                        <div className="h-7 w-px bg-slate-200"></div>

                        {/* 3. Điểm BGH duyệt chốt (B2) */}
                        <div className="text-center px-1">
                          <span className="text-[10px] text-emerald-700 block uppercase font-bold">
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
                              className="w-16 text-center font-bold text-xs py-1 border border-emerald-300 rounded-lg bg-white text-emerald-800 focus:outline-emerald-500 shadow-xs"
                            />
                          ) : (
                            <span className="font-bold text-emerald-800 text-sm">
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
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  {isBgh ? 'Nhận xét của Ban Giám Hiệu:' : 'Nhận xét của Tổ Trưởng chuyên môn:'}
                </label>
                <textarea
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Nhập ghi chú hoặc lý do điều chỉnh điểm số..."
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-3 focus:outline-indigo-500 shadow-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-3xl">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">TỔNG ĐIỂM DỰ KIẾN</span>
                  <span className="font-black text-indigo-700 text-lg">
                    {modalCalculatedScore?.totalScore} / 100
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">XẾP LOẠI</span>
                  <GradeBadge grade={modalCalculatedScore?.grade} />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                >
                  Yêu Cầu Sửa Lại
                </button>

                {isToTruong && (
                  <button
                    type="button"
                    onClick={handleConfirmStep1}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Duyệt B1 & Chuyển BGH
                  </button>
                )}

                {isBgh && (
                  <button
                    type="button"
                    onClick={handleConfirmStep2}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100 transition-all"
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

      {/* ========================================================= */}
      {/* MODAL IN / XUẤT PDF & WORD KHỔ A4 CÓ CHỮ KÝ               */}
      {/* ========================================================= */}
      {printSubmissions && (
        <KpiPrintReportModal
          isOpen={true}
          onClose={() => setPrintSubmissions(null)}
          submissions={printSubmissions}
          schoolSettings={schoolSettings}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL TÙY BIẾN CẤU HÌNH XUẤT BÁO CÁO (EXCEL, WORD, PDF)  */}
      {/* ========================================================= */}
      <ReportCustomizerModal
        isOpen={showCustomizerModal}
        onClose={() => setShowCustomizerModal(false)}
        submissions={filteredSubmissions}
        selectedSubmissions={selectedSubmissionsList}
        schoolSettings={schoolSettings}
        periodName={period.name}
        onOpenPrintModal={(subs) => setPrintSubmissions(subs)}
      />
    </div>
  );
}
