'use client';

import React, { useState, useRef } from 'react';
import { useKpi } from '@/lib/kpi-context';
import { UserProfile, UserRole, KpiFrameworkTask, KpiSection, TaskCategory } from '@/lib/types';
import { 
  Settings, 
  Users, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Save, 
  HardDrive, 
  Building2,
  Calendar,
  Layers,
  Edit,
  RotateCcw,
  X
} from 'lucide-react';

export default function AdminPage() {
  const { 
    schoolSettings, 
    updateSchoolSettings, 
    period, 
    updatePeriodStatus, 
    allUsers, 
    addNewTeacher, 
    removeTeacher, 
    addTeachersFromExcel, 
    departments,
    frameworkTasks,
    addFrameworkTask,
    updateFrameworkTask,
    deleteFrameworkTask,
    importFrameworkTasks,
    resetFrameworkTasks
  } = useKpi();

  const [activeTab, setActiveTab] = useState<'criteria' | 'settings' | 'teachers' | 'period'>('criteria');

  // --- CẤU HÌNH TIÊU CHÍ THEO ĐƠN VỊ ---
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const criteriaFileInputRef = useRef<HTMLInputElement>(null);
  const [criteriaImportLoading, setCriteriaImportLoading] = useState(false);
  const [criteriaMessage, setCriteriaMessage] = useState<string | null>(null);

  // Modal thêm/sửa tiêu chí
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskCode, setTaskCode] = useState('');
  const [taskSection, setTaskSection] = useState<KpiSection>('SECTION_II');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('FIXED');
  const [taskStandardScore, setTaskStandardScore] = useState(15);
  const [taskDifficulty, setTaskDifficulty] = useState(1.0);
  const [taskDesc, setTaskDesc] = useState('');
  const [taskOrder, setTaskOrder] = useState(1);

  // --- FORM CÀI ĐẶT TRƯỜNG ---
  const [schoolName, setSchoolName] = useState(schoolSettings.schoolName);
  const [academicYear, setAcademicYear] = useState(schoolSettings.academicYear);
  const [driveFolderId, setDriveFolderId] = useState(schoolSettings.googleDriveFolderId);
  const [bonusCap, setBonusCap] = useState(schoolSettings.bonusPercentageCap);
  const [bonusRatio, setBonusRatio] = useState(schoolSettings.bonusThresholdRatio * 100);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // --- FORM THÊM GIÁO VIÊN THỦ CÔNG ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [role, setRole] = useState<UserRole>('GIAO_VIEN');
  const [concurrentRolesText, setConcurrentRolesText] = useState('');

  // Import Excel Giáo Viên
  const teacherFileInputRef = useRef<HTMLInputElement>(null);
  const [importTeacherLoading, setImportTeacherLoading] = useState(false);
  const [importTeacherMessage, setImportTeacherMessage] = useState<string | null>(null);

  // Lọc tiêu chí theo đơn vị đang chọn
  const currentDeptCriteria = frameworkTasks.filter((t) => t.departmentId === selectedDeptId);
  const section1Tasks = currentDeptCriteria.filter((t) => t.section === 'SECTION_I');
  const section2Tasks = currentDeptCriteria.filter((t) => t.section === 'SECTION_II');

  const selectedDeptName = selectedDeptId === 'ALL' 
    ? 'Toàn trường (Khung tiêu chuẩn mặc định)' 
    : (departments.find((d) => d.id === selectedDeptId)?.name || 'Tổ chuyên môn');

  // Mở modal thêm mới tiêu chí
  const handleOpenAddTask = (section: KpiSection) => {
    setEditingTaskId(null);
    setTaskSection(section);
    setTaskCategory('FIXED');
    setTaskName('');
    setTaskCode(section === 'SECTION_I' ? `DD_0${section1Tasks.length + 1}` : `CM_0${section2Tasks.length + 1}`);
    setTaskStandardScore(section === 'SECTION_I' ? 10 : 15);
    setTaskDifficulty(1.0);
    setTaskDesc('');
    setTaskOrder(section === 'SECTION_I' ? section1Tasks.length + 1 : section2Tasks.length + 1);
    setShowTaskModal(true);
  };

  // Mở modal sửa tiêu chí
  const handleOpenEditTask = (task: KpiFrameworkTask) => {
    setEditingTaskId(task.id);
    setTaskSection(task.section);
    setTaskCategory(task.category);
    setTaskName(task.name);
    setTaskCode(task.code);
    setTaskStandardScore(task.standardScore);
    setTaskDifficulty(task.difficultyCoefficient);
    setTaskDesc(task.description || '');
    setTaskOrder(task.orderIndex);
    setShowTaskModal(true);
  };

  // Lưu tiêu chí (Thêm mới hoặc Cập nhật)
  const handleSaveTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    if (editingTaskId) {
      updateFrameworkTask(editingTaskId, {
        name: taskName.trim(),
        code: taskCode.trim(),
        section: taskSection,
        category: taskCategory,
        standardScore: Number(taskStandardScore),
        difficultyCoefficient: Number(taskDifficulty),
        description: taskDesc.trim(),
        orderIndex: Number(taskOrder),
      });
      setCriteriaMessage('Đã cập nhật tiêu chí thành công!');
    } else {
      const newTask: KpiFrameworkTask = {
        id: `crit_${Date.now()}`,
        academicYear: schoolSettings.academicYear,
        departmentId: selectedDeptId,
        departmentName: selectedDeptName,
        section: taskSection,
        category: taskCategory,
        code: taskCode.trim() || `TC_${Date.now()}`,
        name: taskName.trim(),
        description: taskDesc.trim(),
        standardScore: Number(taskStandardScore),
        difficultyCoefficient: Number(taskDifficulty),
        orderIndex: Number(taskOrder),
        isActive: true,
      };
      addFrameworkTask(newTask);
      setCriteriaMessage('Đã thêm tiêu chí mới vào khung đánh giá!');
    }

    setShowTaskModal(false);
    setTimeout(() => setCriteriaMessage(null), 3000);
  };

  // Xử lý Import Excel tiêu chí
  const handleCriteriaExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setCriteriaImportLoading(true);
    setCriteriaMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('departmentId', selectedDeptId);

    try {
      const res = await fetch('/api/kpi/criteria/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi import tiêu chí');
      }

      importFrameworkTasks(data.criteria);
      setCriteriaMessage(`Đã nạp thành công ${data.count} tiêu chí KPI vào hệ thống!`);
      setTimeout(() => setCriteriaMessage(null), 5000);
    } catch (err: any) {
      alert('Lỗi import tiêu chí Excel: ' + err.message);
    } finally {
      setCriteriaImportLoading(false);
      if (criteriaFileInputRef.current) criteriaFileInputRef.current.value = '';
    }
  };

  // Lưu cài đặt trường
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolSettings({
      schoolName,
      academicYear,
      googleDriveFolderId: driveFolderId,
      bonusPercentageCap: Number(bonusCap),
      bonusThresholdRatio: Number(bonusRatio) / 100,
    });
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 3000);
  };

  // Thêm giáo viên mới thủ công
  const handleAddTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    const selectedDept = departments.find((d) => d.id === deptId);
    const concurrentRoles = concurrentRolesText
      ? concurrentRolesText.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newTeacher: UserProfile = {
      id: `user_${Date.now()}`,
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
      departmentId: deptId,
      departmentName: selectedDept?.name || 'Tổ bộ môn',
      concurrentRoles,
    };

    addNewTeacher(newTeacher);
    setShowAddModal(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setConcurrentRolesText('');
  };

  // Xử lý Import Excel giáo viên
  const handleTeacherExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setImportTeacherLoading(true);
    setImportTeacherMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/teachers/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi import Excel');
      }

      addTeachersFromExcel(data.teachers);
      setImportTeacherMessage(`Import thành công ${data.count} giáo viên từ file Excel!`);
      setTimeout(() => setImportTeacherMessage(null), 5000);
    } catch (err: any) {
      alert('Lỗi import Excel: ' + err.message);
    } finally {
      setImportTeacherLoading(false);
      if (teacherFileInputRef.current) teacherFileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header khu vực quản trị */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                TRUNG TÂM QUẢN TRỊ NHÀ TRƯỜNG
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Cấu hình bảng tiêu chí KPI theo đơn vị, quản lý nhân sự, thư mục Google Drive và khóa sổ kỳ đánh giá
              </p>
            </div>
          </div>
        </div>

        {/* Thanh chuyển đổi phân vùng chức năng (Tabs) */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl text-xs font-semibold border border-slate-200/60 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('criteria')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'criteria' 
                ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            Cài Đặt Tiêu Chí KPI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'teachers' 
                ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            Nhân Sự & Excel ({allUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'settings' 
                ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-600" />
            Cấu Hình Trường & Drive
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('period')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'period' 
                ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/80' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-indigo-600" />
            Khóa Sổ KPI Tháng
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VÙNG 1: CÀI ĐẶT BẢNG TIÊU CHÍ KPI THEO ĐƠN VỊ / TỔ BỘ MÔN (YÊU CẦU 1)     */}
      {/* ========================================================================= */}
      {activeTab === 'criteria' && (
        <div className="space-y-6">
          {/* Thanh chọn đơn vị & Công cụ Import Excel tiêu chí */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Chọn Đơn Vị / Tổ Chuyên Môn Cần Cài Đặt:
              </span>
              <div className="flex items-center gap-3">
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="text-sm font-bold text-slate-900 border-2 border-indigo-200 bg-indigo-50/40 rounded-xl py-2 px-3 focus:outline-indigo-600 shadow-xs min-w-[260px]"
                >
                  <option value="ALL">⭐ Toàn trường (Khung tiêu chuẩn chung)</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      📁 {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-600 font-medium hidden sm:inline">
                  Tổng: <strong>{currentDeptCriteria.length}</strong> tiêu chí
                </span>
              </div>
            </div>

            {/* Các nút chức năng Excel tiêu chí */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tải mẫu Excel tiêu chí */}
              <a
                href="/api/kpi/criteria/template"
                download="template_kpi_criteria.xlsx"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shadow-xs"
                title="Tải file mẫu Excel cài đặt tiêu chí"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Tải Mẫu Excel Tiêu Chí
              </a>

              {/* Nút Import tiêu chí Excel */}
              <input
                type="file"
                ref={criteriaFileInputRef}
                onChange={handleCriteriaExcelImport}
                accept=".xlsx, .xls"
                className="hidden"
                id="criteria-excel-input"
              />
              <button
                type="button"
                disabled={criteriaImportLoading}
                onClick={() => criteriaFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {criteriaImportLoading ? 'Đang đọc...' : 'Import Tiêu Chí Excel'}
              </button>

              {/* Nút Khôi phục mặc định */}
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Khôi phục các tiêu chí về mặc định cho: ${selectedDeptName}?`)) {
                    resetFrameworkTasks(selectedDeptId);
                    setCriteriaMessage('Đã khôi phục khung tiêu chuẩn mặc định!');
                    setTimeout(() => setCriteriaMessage(null), 3000);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Khôi phục tiêu chí gốc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Mặc Định
              </button>
            </div>
          </div>

          {/* Thông báo thao tác tiêu chí */}
          {criteriaMessage && (
            <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              {criteriaMessage}
            </div>
          )}

          {/* 2 PHẦN TIÊU CHÍ (PHÂN VÙNG CỤ THỂ, TRỰC QUAN) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* ------------------------------------------------------------- */}
            {/* VÙNG I: PHẦN 1 - ĐẠO ĐỨC, KỶ LUẬT & NỀN NẾP (30 ĐIỂM)        */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-sm overflow-hidden">
              {/* Header Phần 1 */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
                      I
                    </span>
                    <h2 className="font-extrabold text-sm sm:text-base tracking-wide">
                      MỤC I: ĐẠO ĐỨC, KỶ LUẬT (30 ĐIỂM)
                    </h2>
                  </div>
                  <p className="text-xs text-blue-100 mt-1">
                    Chấp hành quy chế cơ quan, kỷ luật lao động và nền nếp chuyên môn
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddTask('SECTION_I')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-blue-800 hover:bg-blue-50 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Thêm Tiêu Chí
                </button>
              </div>

              {/* Danh sách tiêu chí Mục I */}
              <div className="p-4 space-y-3">
                {section1Tasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Chưa có tiêu chí Mục I nào cho đơn vị này. Bấm "+ Thêm Tiêu Chí" hoặc dùng tiêu chuẩn toàn trường.
                  </div>
                ) : (
                  section1Tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded font-mono">
                              {task.code}
                            </span>
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {task.name}
                            </h3>
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Thao tác Sửa / Xóa */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTask(task)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Sửa tiêu chí này"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Xóa tiêu chí "${task.name}"?`)) deleteFrameworkTask(task.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa tiêu chí này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
                        <span>Điểm chuẩn: <strong className="text-slate-800">{task.standardScore}đ</strong></span>
                        <span>Hệ số: <strong className="text-slate-800">{task.difficultyCoefficient}x</strong></span>
                        <span>Thứ tự: <strong className="text-slate-800">#{task.orderIndex}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* VÙNG II: PHẦN 2 - CHUYÊN MÔN & KIÊM NHIỆM (70 ĐIỂM QUY ĐỔI)   */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm overflow-hidden">
              {/* Header Phần 2 */}
              <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-4.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-xs font-black">
                      II
                    </span>
                    <h2 className="font-extrabold text-sm sm:text-base tracking-wide">
                      MỤC II: CHUYÊN MÔN & KIÊM NHIỆM (70 ĐIỂM)
                    </h2>
                  </div>
                  <p className="text-xs text-indigo-100 mt-1">
                    Giảng dạy, chủ nhiệm, HSG, dự án dài hạn và nhiệm vụ phát sinh
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAddTask('SECTION_II')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-900 hover:bg-indigo-50 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Thêm Tiêu Chí
                </button>
              </div>

              {/* Danh sách tiêu chí Mục II */}
              <div className="p-4 space-y-3">
                {section2Tasks.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Chưa có tiêu chí Mục II riêng cho đơn vị này. Bấm "+ Thêm Tiêu Chí" hoặc dùng tiêu chuẩn toàn trường.
                  </div>
                ) : (
                  section2Tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded font-mono">
                              {task.code}
                            </span>
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                              {task.name}
                            </h3>

                            {task.category === 'PROJECT' && (
                              <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full">
                                Dự án dài hạn
                              </span>
                            )}
                            {task.category === 'EMERGING' && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full">
                                Đột xuất
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Thao tác Sửa / Xóa */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditTask(task)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Sửa tiêu chí này"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Xóa tiêu chí "${task.name}"?`)) deleteFrameworkTask(task.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa tiêu chí này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 text-slate-500">
                        <span>Điểm chuẩn: <strong className="text-slate-800">{task.standardScore}đ</strong></span>
                        <span>Hệ số khó: <strong className="text-slate-800">{task.difficultyCoefficient}x</strong></span>
                        <span>Thứ tự: <strong className="text-slate-800">#{task.orderIndex}</strong></span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VÙNG 2: QUẢN LÝ GIÁO VIÊN & IMPORT EXCEL                                 */}
      {/* ========================================================================= */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Danh Sách Giáo Viên & Cán Bộ Nhà Trường
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Tổng cộng: <strong className="text-slate-900">{allUsers.length}</strong> cán bộ giáo viên trong cơ sở dữ liệu
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tải file mẫu Excel nhân sự */}
              <a
                href="/api/teachers/template"
                download="template_teachers.xlsx"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-slate-600" />
                Tải Mẫu Excel Giáo Viên
              </a>

              {/* Nút bấm Import Excel giáo viên */}
              <input
                type="file"
                ref={teacherFileInputRef}
                onChange={handleTeacherExcelImport}
                accept=".xlsx, .xls"
                className="hidden"
                id="teacher-excel-input"
              />
              <button
                type="button"
                disabled={importTeacherLoading}
                onClick={() => teacherFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {importTeacherLoading ? 'Đang đọc...' : 'Import Excel Nhân Sự'}
              </button>

              {/* Thêm thủ công */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                + Thêm Giáo Viên
              </button>
            </div>
          </div>

          {importTeacherMessage && (
            <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              {importTeacherMessage}
            </div>
          )}

          {/* Bảng danh sách giáo viên */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[11px] font-bold">
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Tổ Chuyên Môn</th>
                  <th className="py-3 px-4 text-center">Vai Trò</th>
                  <th className="py-3 px-4">Nhiệm Vụ Kiêm Nhiệm</th>
                  <th className="py-3 px-4 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.departmentName || 'Chung'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {u.concurrentRoles && u.concurrentRoles.length > 0 ? (
                          u.concurrentRoles.map((r, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Xóa giáo viên ${u.fullName}?`)) removeTeacher(u.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VÙNG 3: CẤU HÌNH TRƯỜNG & GOOGLE DRIVE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Thông Tin Đơn Vị & Thư Mục Drive Trung Tâm
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Tên Trường Học / Đơn vị *
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Năm học hiện tại *
                </label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="VD: 2024-2025"
                  className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>
            </div>

            {/* Google Drive Configuration Card */}
            <div className="bg-indigo-50/60 rounded-2xl p-5 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                  Tích hợp Google Drive Trung Tâm
                </h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Toàn bộ minh chứng ảnh/PDF của giáo viên sẽ tự động tạo cây thư mục <code>[Nam_Hoc]/[Thang_XX]/[Ten_To]/[Ho_Ten_GV]</code> bên trong Folder ID này.
              </p>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Google Drive Folder ID Gốc (Lấy từ URL thư mục chia sẻ)
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="VD: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up0I"
                  className="w-full text-xs border border-indigo-300 bg-white rounded-xl p-2.5 focus:outline-indigo-600 font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Công thức tính điểm & Thưởng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mức trần Điểm Thưởng Bonus (% điểm Mục II)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={bonusCap}
                    onChange={(e) => setBonusCap(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                  />
                  <span className="text-xs text-slate-600 font-bold">% (Tối đa 7đ)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Ngưỡng tỷ lệ nhiệm vụ &ldquo;Vượt yêu cầu&rdquo; để nhận thưởng
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={bonusRatio}
                    onChange={(e) => setBonusRatio(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                  />
                  <span className="text-xs text-slate-600 font-bold">% tổng nhiệm vụ</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {saveSettingsSuccess && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Đã lưu cấu hình trường thành công!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 transition-all"
              >
                <Save className="w-4 h-4" />
                Lưu Thay Đổi Cấu Hình
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VÙNG 4: KHÓA SỔ KPI THÁNG                                                */}
      {/* ========================================================================= */}
      {activeTab === 'period' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-6">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Quản Lý Trạng Thái Kỳ Đánh Giá KPI
          </h2>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">{period.name}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    period.status === 'OPEN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {period.status === 'OPEN' ? 'Đang Mở Nhập Liệu' : 'Đã Khóa Sổ'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Khi khóa sổ, toàn bộ giáo viên và tổ trưởng sẽ không thể chỉnh sửa điểm hay nộp lại bài. Chỉ BGH có quyền xem và xuất báo cáo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {period.status === 'OPEN' ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Khóa sổ kỳ đánh giá tháng này? Giáo viên sẽ không thể chỉnh sửa sau khi khóa.')) {
                      updatePeriodStatus('LOCKED');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  Khóa Sổ Kỳ Đánh Giá
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => updatePeriodStatus('OPEN')}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-colors"
                >
                  <Unlock className="w-4 h-4" />
                  Mở Lại Kỳ Đánh Giá
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL THÊM / SỬA TIÊU CHÍ KPI (MỤC I & MỤC II)                           */}
      {/* ========================================================================= */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingTaskId ? 'Chỉnh Sửa Tiêu Chí KPI' : 'Thêm Tiêu Chí KPI Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowTaskModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTaskSubmit} className="space-y-4 pt-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Tên tiêu chí đánh giá *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Chất lượng soạn bài giảng điện tử và ứng dụng CNTT"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Thuộc phần đánh giá
                  </label>
                  <select
                    value={taskSection}
                    onChange={(e) => setTaskSection(e.target.value as KpiSection)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    <option value="SECTION_I">Mục I: Đạo đức, Kỷ luật (30đ)</option>
                    <option value="SECTION_II">Mục II: Chuyên môn & Kiêm nhiệm (70đ)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Phân loại nhiệm vụ
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    <option value="FIXED">Cố định / Thường xuyên</option>
                    <option value="PROJECT">Dài hạn / Dự án</option>
                    <option value="EMERGING">Đột xuất / Phát sinh</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Mã tiêu chí</label>
                  <input
                    type="text"
                    required
                    value={taskCode}
                    onChange={(e) => setTaskCode(e.target.value)}
                    placeholder="VD: CM_06"
                    className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Điểm chuẩn</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={taskStandardScore}
                    onChange={(e) => setTaskStandardScore(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Hệ số khó</label>
                  <input
                    type="number"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={taskDifficulty}
                    onChange={(e) => setTaskDifficulty(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Mô tả chi tiết & Yêu cầu minh chứng
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi rõ nội dung yêu cầu và loại minh chứng cần đính kèm..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-100"
                >
                  {editingTaskId ? 'Cập Nhật Tiêu Chí' : 'Lưu Vào Bảng KPI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM GIÁO VIÊN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-extrabold text-slate-900 mb-1">Thêm Giáo Viên Mới</h3>
            <p className="text-xs text-slate-600 mb-4">Nhập thông tin hồ sơ và phân tổ chuyên môn.</p>

            <form onSubmit={handleAddTeacherSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Tổ chuyên môn</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs font-semibold border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    <option value="GIAO_VIEN">Giáo Viên</option>
                    <option value="TO_TRUONG">Tổ Trưởng</option>
                    <option value="BGH">Ban Giám Hiệu</option>
                    <option value="ADMIN">Quản Trị Viên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Nhiệm vụ kiêm nhiệm (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="VD: Chủ nhiệm 11A, Bồi dưỡng HSG"
                  value={concurrentRolesText}
                  onChange={(e) => setConcurrentRolesText(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-300 rounded-xl p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow"
                >
                  Lưu Giáo Viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
