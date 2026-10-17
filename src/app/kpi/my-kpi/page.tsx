'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useKpi } from '@/lib/kpi-context';
import { KpiSubmissionItem } from '@/lib/types';
import { calculateOverallKpi, calculateItemScore } from '@/lib/kpi-calculator';
import { StatusBadge, GradeBadge } from '@/components/StatusBadge';
import { SliderControl } from '@/components/SliderControl';
import { ProofUploadModal } from '@/components/ProofUploadModal';
import { 
  Sparkles, 
  PlusCircle, 
  Save, 
  Send, 
  CheckCircle2, 
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function MyKpiPage() {
  const { 
    currentUser, 
    period, 
    schoolSettings, 
    getSubmissionByTeacherId, 
    saveTeacherDraft, 
    submitTeacherKpi,
    getCriteriaForDepartment
  } = useKpi();

  const existingSubmission = getSubmissionByTeacherId(currentUser.id);

  const [items, setItems] = useState<KpiSubmissionItem[]>([]);
  const [concurrentRoles, setConcurrentRoles] = useState<string[]>(currentUser.concurrentRoles || []);
  const [newRoleInput, setNewRoleInput] = useState('');
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [showEmergingModal, setShowEmergingModal] = useState(false);
  const [emergingTitle, setEmergingTitle] = useState('');
  const [emergingStandardScore, setEmergingStandardScore] = useState(10);
  const [emergingDifficulty, setEmergingDifficulty] = useState(1.0);
  const [emergingDesc, setEmergingDesc] = useState('');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Hàm đồng bộ tiêu chí từ Tổ bộ môn
  const syncCriteriaFromDepartment = useCallback(() => {
    const deptCriteria = getCriteriaForDepartment(currentUser.departmentId);
    if (deptCriteria && deptCriteria.length > 0) {
      const generatedItems: KpiSubmissionItem[] = deptCriteria.map((crit, idx) => ({
        id: `item_${crit.code}_${Date.now()}_${idx}`,
        frameworkTaskId: crit.id,
        section: crit.section,
        taskCategory: crit.category,
        taskName: crit.name,
        description: crit.description,
        standardScore: crit.standardScore,
        difficultyCoefficient: crit.difficultyCoefficient,
        progressPercent: 100,
        qualityPercent: 100,
        selfScore: calculateItemScore(crit.standardScore, crit.difficultyCoefficient, 100, 100),
        proofFiles: [],
        teacherNote: '',
      }));
      setItems(generatedItems);
    }
  }, [currentUser.departmentId, getCriteriaForDepartment]);

  // Load items từ bài nộp hiện có hoặc tạo mặc định từ tiêu chí của Tổ
  useEffect(() => {
    if (existingSubmission && existingSubmission.items && existingSubmission.items.length > 0) {
      setItems(existingSubmission.items);
    } else {
      // Khởi tạo các tiêu chí chuẩn theo đúng Tổ của giáo viên
      syncCriteriaFromDepartment();
    }
  }, [existingSubmission, currentUser.id, currentUser.departmentId, syncCriteriaFromDepartment]);

  const isReadOnly = existingSubmission?.status === 'SUBMITTED' || 
                     existingSubmission?.status === 'STEP1_APPROVED' || 
                     existingSubmission?.status === 'STEP2_APPROVED';

  // Tính điểm tổng hợp tự động theo thời gian thực
  const kpiCalc = useMemo(() => {
    const calcItems = items.map((i) => ({
      section: i.section,
      taskCategory: i.taskCategory,
      taskName: i.taskName,
      standardScore: i.standardScore,
      difficultyCoefficient: i.difficultyCoefficient,
      progressPercent: i.progressPercent,
      qualityPercent: i.qualityPercent,
    }));

    return calculateOverallKpi(calcItems, {
      bonusPercentageCap: schoolSettings.bonusPercentageCap,
      bonusThresholdRatio: schoolSettings.bonusThresholdRatio,
    });
  }, [items, schoolSettings]);

  // Cập nhật 1 item
  const updateItem = (id: string, updates: Partial<KpiSubmissionItem>) => {
    if (isReadOnly) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        next.selfScore = calculateItemScore(
          next.standardScore,
          next.difficultyCoefficient,
          next.progressPercent,
          next.qualityPercent
        );
        return next;
      })
    );
  };

  // Thêm nhiệm vụ phát sinh
  const handleAddEmergingTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergingTitle.trim()) return;

    const newTask: KpiSubmissionItem = {
      id: `emerging_${Date.now()}`,
      section: 'SECTION_II',
      taskCategory: 'EMERGING',
      taskName: emergingTitle.trim(),
      description: emergingDesc.trim() || 'Nhiệm vụ đột xuất phát sinh trong tháng',
      standardScore: Number(emergingStandardScore) || 10,
      difficultyCoefficient: Number(emergingDifficulty) || 1.0,
      progressPercent: 100,
      qualityPercent: 100,
      selfScore: calculateItemScore(emergingStandardScore, emergingDifficulty, 100, 100),
      proofFiles: [],
      teacherNote: 'Nhiệm vụ đột xuất hoàn thành',
    };

    setItems((prev) => [...prev, newTask]);
    setShowEmergingModal(false);
    setEmergingTitle('');
    setEmergingDesc('');
    setEmergingStandardScore(10);
    setEmergingDifficulty(1.0);
  };

  // Xóa nhiệm vụ phát sinh
  const handleRemoveItem = (id: string) => {
    if (isReadOnly) return;
    if (confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Lưu nháp
  const handleSaveDraft = () => {
    saveTeacherDraft({ items });
    setSaveMessage('Đã lưu bản nháp thành công!');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  // Nộp bài chính thức
  const handleSubmit = () => {
    if (items.some((i) => i.section === 'SECTION_II' && (!i.proofFiles || i.proofFiles.length === 0))) {
      if (!confirm('Một số tiêu chí Mục II chưa đính kèm minh chứng Google Drive. Bạn có chắc chắn muốn nộp không?')) {
        return;
      }
    }

    saveTeacherDraft({ items });
    submitTeacherKpi(existingSubmission?.id || `sub_${currentUser.id}_${period.id}`);
    setSaveMessage('Đã nộp bài đánh giá KPI lên Tổ trưởng chuyên môn!');
    setTimeout(() => setSaveMessage(null), 4000);
  };

  // Thêm vai trò kiêm nhiệm
  const handleAddRole = () => {
    if (!newRoleInput.trim()) return;
    const updated = [...concurrentRoles, newRoleInput.trim()];
    setConcurrentRoles(updated);
    currentUser.concurrentRoles = updated;
    setNewRoleInput('');
    setIsAddingRole(false);
  };

  const section1Items = items.filter((i) => i.section === 'SECTION_I');
  const section2Items = items.filter((i) => i.section === 'SECTION_II');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-7 pb-32">
      {/* KHỐI 1: HỒ SƠ CÁ NHÂN & KỲ ĐÁNH GIÁ (CARD RÕ RÀNG) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/90">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-indigo-100 flex-shrink-0">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  {currentUser.fullName}
                </h1>
                <span className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">
                  {currentUser.departmentName || 'Chưa phân tổ'}
                </span>
                <StatusBadge status={existingSubmission?.status || 'DRAFT'} />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {currentUser.email} • {period.name} ({period.status === 'OPEN' ? 'Đang mở nộp bài' : 'Đã khóa sổ'})
              </p>

              {/* Danh sách nhiệm vụ kiêm nhiệm */}
              <div className="pt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Nhiệm vụ kiêm nhiệm:
                </span>
                {concurrentRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-800 font-semibold px-2.5 py-0.5 rounded-lg border border-slate-200"
                  >
                    {role}
                  </span>
                ))}
                {!isReadOnly && (
                  <>
                    {isAddingRole ? (
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="text"
                          value={newRoleInput}
                          onChange={(e) => setNewRoleInput(e.target.value)}
                          placeholder="VD: Chủ nhiệm 11A"
                          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1 w-36 focus:outline-indigo-600 font-medium"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                        />
                        <button
                          type="button"
                          onClick={handleAddRole}
                          className="text-xs bg-indigo-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-indigo-700"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingRole(false)}
                          className="text-xs text-slate-500 hover:text-slate-800 px-1 font-medium"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingRole(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline ml-1"
                      >
                        + Thêm kiêm nhiệm
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Công cụ Đồng bộ lại tiêu chí từ Tổ */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Làm mới và áp dụng lại khung tiêu chí chuẩn từ Tổ chuyên môn? (Tiến độ và minh chứng đã nhập sẽ được tạo lại theo khung mới)')) {
                  syncCriteriaFromDepartment();
                  setSaveMessage('Đã đồng bộ lại khung tiêu chí của Tổ!');
                  setTimeout(() => setSaveMessage(null), 3000);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-indigo-700 bg-slate-100 hover:bg-indigo-50 border border-slate-200 transition-colors self-start md:self-auto"
              title="Đồng bộ lại khung tiêu chí do Admin/Tổ trưởng cấu hình"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Đồng Bộ Tiêu Chí Tổ
            </button>
          )}

          {/* Ghi chú nhận xét duyệt */}
          {(existingSubmission?.toTruongNote || existingSubmission?.bghNote) && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-950 max-w-sm space-y-1">
              <span className="font-extrabold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Nhận xét duyệt:
              </span>
              {existingSubmission.toTruongNote && (
                <p>
                  <strong>Tổ trưởng:</strong> &ldquo;{existingSubmission.toTruongNote}&rdquo;
                </p>
              )}
              {existingSubmission.bghNote && (
                <p>
                  <strong>BGH:</strong> &ldquo;{existingSubmission.bghNote}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thông báo thao tác */}
      {saveMessage && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2.5 text-sm font-bold animate-fadeIn">
          <CheckCircle2 className="w-5 h-5" />
          {saveMessage}
        </div>
      )}

      {/* Cảnh báo chế độ chỉ đọc khi đã nộp */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 px-5 py-3.5 rounded-2xl text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>
              Bài đánh giá KPI tháng này đã nộp thành công ({existingSubmission?.status}). Bạn đang ở chế độ xem lại.
            </span>
          </div>
          <GradeBadge 
            grade={existingSubmission?.finalGrade} 
            score={existingSubmission?.bghFinalScore || existingSubmission?.toTruongTotalScore || existingSubmission?.selfTotalScore} 
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* VÙNG 2: MỤC I - ĐẠO ĐỨC, KỶ LUẬT & NỀN NẾP (30 ĐIỂM)                      */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-sm overflow-hidden space-y-4">
        {/* Header Mục I */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-xs font-black">
                I
              </span>
              <h2 className="text-base font-extrabold tracking-wide">
                MỤC I: ĐẠO ĐỨC, KỶ LUẬT & NỀN NẾP (30 ĐIỂM)
              </h2>
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Chấp hành quy chế cơ quan, giờ giấc, đạo đức nhà giáo và nền nếp chuyên môn
            </p>
          </div>
          <span className="text-sm font-black text-white bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30 self-start sm:self-auto">
            {kpiCalc.section1Score} / 30 điểm
          </span>
        </div>

        {/* Danh sách tiêu chí Mục I */}
        <div className="p-5 space-y-4">
          {section1Items.map((item, index) => (
            <div
              key={item.id}
              className="bg-slate-50/60 rounded-2xl p-5 border border-slate-200/90 hover:border-blue-300 hover:bg-white transition-all shadow-xs flex flex-col gap-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md font-mono">
                      #0{index + 1}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{item.taskName}</h3>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-blue-800 bg-blue-100/80 px-3 py-1 rounded-lg border border-blue-200">
                    Tự chấm: {item.selfScore} đ
                  </span>
                </div>
              </div>

              {/* Thanh trượt điều chỉnh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-slate-200/70">
                <SliderControl
                  label="Tiến độ thực hiện"
                  value={item.progressPercent}
                  onChange={(val) => updateItem(item.id, { progressPercent: val })}
                  disabled={isReadOnly}
                  type="progress"
                />
                <SliderControl
                  label="Chất lượng & Ý thức"
                  value={item.qualityPercent}
                  max={100}
                  onChange={(val) => updateItem(item.id, { qualityPercent: val })}
                  disabled={isReadOnly}
                  type="quality"
                />
              </div>

              {/* Ghi chú */}
              <div>
                <input
                  type="text"
                  placeholder="Ghi chú tự đánh giá kết quả chấp hành (nếu có)..."
                  value={item.teacherNote || ''}
                  onChange={(e) => updateItem(item.id, { teacherNote: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-blue-500 shadow-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VÙNG 3: MỤC II - CHUYÊN MÔN & KIÊM NHIỆM (70 ĐIỂM QUY ĐỔI)                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-sm overflow-hidden space-y-4">
        {/* Header Mục II */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-xs font-black">
                II
              </span>
              <h2 className="text-base font-extrabold tracking-wide">
                MỤC II: CHUYÊN MÔN & KIÊM NHIỆM (70 ĐIỂM QUY ĐỔI)
              </h2>
            </div>
            <p className="text-xs text-indigo-100 mt-1">
              Công thức: (Tổng điểm thực tế / Điểm tối đa) × 70 + Điểm thưởng nếu vượt yêu cầu ≥ 30%
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="text-sm font-black text-white bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/30">
              {kpiCalc.section2ConvertedScore} / 70 đ
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setShowEmergingModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-white text-indigo-900 hover:bg-indigo-50 shadow-md transition-all"
              >
                <PlusCircle className="w-4 h-4 text-indigo-700" />
                + Nhiệm Vụ Phát Sinh
              </button>
            )}
          </div>
        </div>

        {/* Danh sách thẻ nhiệm vụ Mục II */}
        <div className="p-5 space-y-4">
          {section2Items.map((item, index) => {
            const isEmerging = item.taskCategory === 'EMERGING';
            const isProject = item.taskCategory === 'PROJECT';

            return (
              <div
                key={item.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col gap-3.5 shadow-xs ${
                  isEmerging
                    ? 'border-amber-300 bg-amber-50/30 hover:bg-white'
                    : isProject
                    ? 'border-purple-300 bg-purple-50/30 hover:bg-white'
                    : 'border-slate-200/90 bg-slate-50/50 hover:bg-white'
                }`}
              >
                {/* Header thẻ */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md font-mono">
                        #0{index + 1}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {item.taskName}
                      </h3>

                      {isEmerging && (
                        <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                          ⚡ Đột xuất / Phát sinh
                        </span>
                      )}

                      {isProject && (
                        <span className="text-[10px] font-extrabold bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300">
                          📌 Dài hạn / Dự án
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    )}

                    <div className="flex items-center gap-3 pt-0.5 text-xs text-slate-500 font-medium">
                      <span>Điểm chuẩn: <strong className="text-slate-800">{item.standardScore}đ</strong></span>
                      <span>•</span>
                      <span>Hệ số khó: <strong className="text-slate-800">{item.difficultyCoefficient}x</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs font-black text-indigo-800 bg-indigo-100/90 px-3 py-1 rounded-xl border border-indigo-200">
                      Tự chấm: {item.selfScore} đ
                    </span>
                    {isEmerging && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs p-1 rounded hover:bg-rose-50"
                        title="Xóa nhiệm vụ phát sinh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Công tắc kết thúc dự án dài hạn (nếu là PROJECT) */}
                {isProject && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-purple-100/70 border border-purple-200 text-xs">
                    <div>
                      <span className="font-extrabold text-purple-950 block">
                        Công tắc &ldquo;Kết thúc KPI Dự án&rdquo;:
                      </span>
                      <p className="text-[11px] text-purple-800 mt-0.5">
                        Bật khi đã nghiệm thu dự án để chốt điểm và tự động không lặp lại ở các tháng tiếp theo.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() =>
                        updateItem(item.id, { isProjectCompleted: !item.isProjectCompleted })
                      }
                      className="flex items-center gap-1.5 font-bold text-xs"
                    >
                      {item.isProjectCompleted ? (
                        <span className="text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 font-bold shadow-xs">
                          <ToggleRight className="w-5 h-5 text-emerald-600" /> Đã hoàn thành
                        </span>
                      ) : (
                        <span className="text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1 font-semibold shadow-xs">
                          <ToggleLeft className="w-5 h-5 text-slate-400" /> Đang thực hiện
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Slider Tiến độ & Chất lượng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-3.5 rounded-xl border border-slate-200/80">
                  <SliderControl
                    label="% Tiến độ công việc"
                    value={item.progressPercent}
                    onChange={(val) => updateItem(item.id, { progressPercent: val })}
                    disabled={isReadOnly}
                    type="progress"
                  />
                  <SliderControl
                    label="% Chất lượng hoàn thành"
                    value={item.qualityPercent}
                    max={120}
                    onChange={(val) => updateItem(item.id, { qualityPercent: val })}
                    disabled={isReadOnly}
                    type="quality"
                  />
                </div>

                {/* Tải minh chứng Google Drive */}
                <div className="pt-1">
                  <span className="text-xs font-bold text-slate-800 mb-1.5 block">
                    Minh chứng đính kèm (Ảnh chụp / Hồ sơ PDF lưu Drive tự động):
                  </span>
                  <ProofUploadModal
                    proofFiles={item.proofFiles || []}
                    onFilesChange={(files) => updateItem(item.id, { proofFiles: files })}
                    academicYear={period.academicYear}
                    month={period.month}
                    departmentName={currentUser.departmentName || 'To_Chuyen_Mon'}
                    teacherName={currentUser.fullName}
                    disabled={isReadOnly}
                  />
                </div>

                {/* Ghi chú giáo viên */}
                <div>
                  <input
                    type="text"
                    placeholder="Ghi chú minh chứng / kết quả đạt được..."
                    value={item.teacherNote || ''}
                    onChange={(e) => updateItem(item.id, { teacherNote: e.target.value })}
                    disabled={isReadOnly}
                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-indigo-500 shadow-xs"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL THÊM NHIỆM VỤ PHÁT SINH */}
      {showEmergingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              Thêm Nhiệm Vụ Đột Xuất / Phát Sinh Trong Tháng
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Nhiệm vụ đột xuất phát sinh sẽ được cộng điểm vào Mục II sau khi Tổ trưởng duyệt.
            </p>

            <form onSubmit={handleAddEmergingTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Tên nhiệm vụ phát sinh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tham gia chấm thi HSG cấp Tỉnh đột xuất"
                  value={emergingTitle}
                  onChange={(e) => setEmergingTitle(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Điểm chuẩn (10 hoặc 15)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={emergingStandardScore}
                    onChange={(e) => setEmergingStandardScore(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Hệ số khó
                  </label>
                  <select
                    value={emergingDifficulty}
                    onChange={(e) => setEmergingDifficulty(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    <option value={1.0}>1.0 (Bình thường)</option>
                    <option value={1.1}>1.1 (Khá phức tạp)</option>
                    <option value={1.2}>1.2 (Đòi hỏi chuyên môn cao)</option>
                    <option value={1.5}>1.5 (Cấp Tỉnh / Quốc gia)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mô tả chi tiết & Căn cứ phân công
                </label>
                <textarea
                  rows={2}
                  placeholder="Theo Quyết định phân công số..."
                  value={emergingDesc}
                  onChange={(e) => setEmergingDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmergingModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  Thêm vào bảng KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* THANH TỔNG HỢP & NÚT NỘP DƯỚI ĐÁY (STICKY FOOTER MOBILE/DESKTOP)          */}
      {/* ========================================================================= */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 z-30 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Thông số điểm */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-center sm:justify-start text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">MỤC I (30đ)</span>
              <span className="font-extrabold text-slate-800 text-sm">{kpiCalc.section1Score} đ</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">MỤC II (70đ)</span>
              <span className="font-extrabold text-slate-800 text-sm">{kpiCalc.section2ConvertedScore} đ</span>
            </div>
            {kpiCalc.isBonusEligible && (
              <>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div>
                  <span className="text-purple-600 block text-[10px] font-black flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> THƯỞNG
                  </span>
                  <span className="font-black text-purple-700 text-sm">+{kpiCalc.bonusScore} đ</span>
                </div>
              </>
            )}
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-slate-400 block text-[10px] font-bold">TỔNG ĐIỂM</span>
              <span className="font-black text-indigo-700 text-lg">{kpiCalc.totalScore} / 100</span>
            </div>
            <div>
              <GradeBadge grade={kpiCalc.grade} />
            </div>
          </div>

          {/* Nút thao tác */}
          {!isReadOnly ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Lưu Nháp
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-extrabold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-200"
              >
                <Send className="w-4 h-4" />
                Nộp Bài KPI
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic font-medium">
              Đã nộp vào: {existingSubmission?.submittedAt ? new Date(existingSubmission.submittedAt).toLocaleDateString('vi-VN') : 'Đang xử lý'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
