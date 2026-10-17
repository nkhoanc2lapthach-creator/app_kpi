'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Trash2
} from 'lucide-react';

export default function MyKpiPage() {
  const { 
    currentUser, 
    period, 
    schoolSettings, 
    getSubmissionByTeacherId, 
    saveTeacherDraft, 
    submitTeacherKpi 
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

  // Load items từ bài nộp hiện có hoặc tạo mặc định
  useEffect(() => {
    if (existingSubmission && existingSubmission.items && existingSubmission.items.length > 0) {
      setItems(existingSubmission.items);
    } else {
      // Khởi tạo các tiêu chí chuẩn từ default
      import('@/lib/mock-data').then((mod) => {
        setItems(JSON.parse(JSON.stringify(mod.defaultStandardItems)));
      });
    }
  }, [existingSubmission, currentUser.id]);

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
        // Tự động tính selfScore
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
    if (items.some((i) => i.section === 'SECTION_II' && i.proofFiles.length === 0)) {
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
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6 pb-28">
      {/* Thông tin hồ sơ & Kỳ đánh giá */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-100 flex-shrink-0">
              {currentUser.fullName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-900">{currentUser.fullName}</h1>
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                  {currentUser.departmentName || 'Chưa phân tổ'}
                </span>
                <StatusBadge status={existingSubmission?.status || 'DRAFT'} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{currentUser.email} • {period.name}</p>

              {/* Danh sách nhiệm vụ kiêm nhiệm */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Kiêm nhiệm:
                </span>
                {concurrentRoles.map((role, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200"
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
                          className="text-xs border border-slate-300 rounded px-2 py-0.5 w-32 focus:outline-indigo-500"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRole()}
                        />
                        <button
                          type="button"
                          onClick={handleAddRole}
                          className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-700"
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingRole(false)}
                          className="text-xs text-slate-500 hover:text-slate-700 px-1"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingRole(true)}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium underline"
                      >
                        + Thêm kiêm nhiệm
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Ghi chú nhận xét từ Tổ trưởng hoặc BGH nếu có */}
          {(existingSubmission?.toTruongNote || existingSubmission?.bghNote) && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 text-xs text-amber-900 max-w-sm">
              <span className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Nhận xét duyệt:
              </span>
              {existingSubmission.toTruongNote && (
                <p className="mt-1">
                  <strong>Tổ trưởng:</strong> {existingSubmission.toTruongNote}
                </p>
              )}
              {existingSubmission.bghNote && (
                <p className="mt-1">
                  <strong>BGH:</strong> {existingSubmission.bghNote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thông báo thao tác */}
      {saveMessage && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            {saveMessage}
          </div>
        </div>
      )}

      {/* Cảnh báo chế độ chỉ đọc khi đã nộp */}
      {isReadOnly && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>
              Bài đánh giá KPI tháng này đã nộp ({existingSubmission?.status}). Bạn đang ở chế độ xem lại.
            </span>
          </div>
          <GradeBadge grade={existingSubmission?.finalGrade} score={existingSubmission?.bghFinalScore || existingSubmission?.toTruongTotalScore || existingSubmission?.selfTotalScore} />
        </div>
      )}

      {/* ========================================================= */}
      {/* PHẦN I: ĐẠO ĐỨC, KỶ LUẬT, NỀN NẾP (30 ĐIỂM)               */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                I
              </span>
              MỤC I: ĐẠO ĐỨC, KỶ LUẬT & NỀN NẾP (30 ĐIỂM)
            </h2>
            <p className="text-xs text-slate-500">Chấp hành quy chế cơ quan, giờ giấc, kỷ cương chuyên môn</p>
          </div>
          <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            {kpiCalc.section1Score} / 30 điểm
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {section1Items.map((item, index) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-slate-300 transition-all flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">#0{index + 1}</span>
                    <h3 className="font-semibold text-slate-800 text-sm">{item.taskName}</h3>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Điểm tự chấm: {item.selfScore} đ
                  </span>
                </div>
              </div>

              {/* Thanh trượt điều chỉnh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Ghi chú tự đánh giá (nếu có)..."
                  value={item.teacherNote || ''}
                  onChange={(e) => updateItem(item.id, { teacherNote: e.target.value })}
                  disabled={isReadOnly}
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* PHẦN II: CHUYÊN MÔN & KIÊM NHIỆM (70 ĐIỂM QUY ĐỔI)         */}
      {/* ========================================================= */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                II
              </span>
              MỤC II: CHUYÊN MÔN & KIÊM NHIỆM (70 ĐIỂM QUY ĐỔI)
            </h2>
            <p className="text-xs text-slate-500">
              Công thức: (Tổng điểm thực tế / Điểm tối đa) × 70 + Điểm thưởng nếu vượt yêu cầu ≥ 30%
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              {kpiCalc.section2ConvertedScore} / 70 đ
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => setShowEmergingModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                + Thêm nhiệm vụ phát sinh
              </button>
            )}
          </div>
        </div>

        {/* Thẻ nhiệm vụ */}
        <div className="grid grid-cols-1 gap-4">
          {section2Items.map((item, index) => {
            const isEmerging = item.taskCategory === 'EMERGING';
            const isProject = item.taskCategory === 'PROJECT';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl p-4 shadow-sm border transition-all flex flex-col gap-3.5 ${
                  isEmerging
                    ? 'border-amber-200 bg-amber-50/20'
                    : isProject
                    ? 'border-purple-200 bg-purple-50/20'
                    : 'border-slate-200'
                }`}
              >
                {/* Header thẻ */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400">#0{index + 1}</span>
                      <h3 className="font-semibold text-slate-900 text-sm">{item.taskName}</h3>

                      {isEmerging && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                          Đột xuất / Phát sinh
                        </span>
                      )}

                      {isProject && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          Dài hạn / Dự án
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>Điểm chuẩn: <strong>{item.standardScore}đ</strong></span>
                      <span>•</span>
                      <span>Hệ số khó: <strong>{item.difficultyCoefficient}x</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      Tự chấm: {item.selfScore} đ
                    </span>
                    {isEmerging && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 text-xs p-1"
                        title="Xóa nhiệm vụ phát sinh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Công tắc kết thúc dự án dài hạn (nếu là PROJECT) */}
                {isProject && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50/80 border border-purple-200 text-xs">
                    <div>
                      <span className="font-bold text-purple-900">Công tắc &ldquo;Kết thúc KPI Dự án&rdquo;:</span>
                      <p className="text-[11px] text-purple-700">
                        Bật khi đã nghiệm thu dự án để chốt điểm và không lặp lại ở các tháng tiếp theo.
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() =>
                        updateItem(item.id, { isProjectCompleted: !item.isProjectCompleted })
                      }
                      className="flex items-center gap-1 font-bold text-xs"
                    >
                      {item.isProjectCompleted ? (
                        <span className="text-emerald-700 flex items-center gap-1 font-bold">
                          <ToggleRight className="w-6 h-6 text-emerald-600" /> Đã hoàn thành
                        </span>
                      ) : (
                        <span className="text-slate-600 flex items-center gap-1">
                          <ToggleLeft className="w-6 h-6 text-slate-400" /> Đang thực hiện
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Slider Tiến độ & Chất lượng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
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
                  <span className="text-xs font-semibold text-slate-700 mb-1 block">
                    Minh chứng đính kèm (Ảnh / File PDF):
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
                    className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Thêm nhiệm vụ phát sinh */}
      {showEmergingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Thêm Nhiệm Vụ Đột Xuất / Phát Sinh
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhiệm vụ đột xuất phát sinh trong tháng sẽ được tính điểm vào Mục II sau khi Tổ trưởng duyệt.
            </p>

            <form onSubmit={handleAddEmergingTask} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên nhiệm vụ phát sinh *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tham gia chấm thi HSG cấp Tỉnh đột xuất"
                  value={emergingTitle}
                  onChange={(e) => setEmergingTitle(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Điểm chuẩn (Thang 10 hoặc 15)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={emergingStandardScore}
                    onChange={(e) => setEmergingStandardScore(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Hệ số khó (1.0, 1.2, 1.5)
                  </label>
                  <select
                    value={emergingDifficulty}
                    onChange={(e) => setEmergingDifficulty(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    <option value={1.0}>1.0 (Bình thường)</option>
                    <option value={1.1}>1.1 (Khá phức tạp)</option>
                    <option value={1.2}>1.2 (Đòi hỏi chuyên môn cao)</option>
                    <option value={1.5}>1.5 (Cấp Tỉnh / Quốc gia)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mô tả chi tiết & Căn cứ phân công
                </label>
                <textarea
                  rows={2}
                  placeholder="VD: Theo Quyết định số 123/QĐ-SGDĐT về việc điều động giám khảo..."
                  value={emergingDesc}
                  onChange={(e) => setEmergingDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmergingModal(false)}
                  className="px-3 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow"
                >
                  Thêm vào bảng KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* THANH TỔNG HỢP & NÚT NỘP DƯỚI ĐÁY (STICKY FOOTER MOBILE)    */}
      {/* ========================================================= */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 px-4 z-30 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Thông số điểm */}
          <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-center sm:justify-start text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">MỤC I (30đ)</span>
              <span className="font-bold text-slate-800">{kpiCalc.section1Score} đ</span>
            </div>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div>
              <span className="text-slate-400 block text-[10px]">MỤC II (70đ)</span>
              <span className="font-bold text-slate-800">{kpiCalc.section2ConvertedScore} đ</span>
            </div>
            {kpiCalc.isBonusEligible && (
              <>
                <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                <div>
                  <span className="text-purple-600 block text-[10px] font-bold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> THƯỞNG
                  </span>
                  <span className="font-bold text-purple-700">+{kpiCalc.bonusScore} đ</span>
                </div>
              </>
            )}
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <span className="text-slate-400 block text-[10px]">TỔNG ĐIỂM</span>
              <span className="font-black text-indigo-700 text-base">{kpiCalc.totalScore} / 100</span>
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
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-sm"
              >
                <Save className="w-4 h-4 text-slate-500" />
                Lưu nháp
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-200"
              >
                <Send className="w-4 h-4" />
                Nộp bài KPI
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic">
              Đã nộp vào: {existingSubmission?.submittedAt ? new Date(existingSubmission.submittedAt).toLocaleDateString('vi-VN') : 'Đang xử lý'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
