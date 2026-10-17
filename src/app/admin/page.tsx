'use client';

import React, { useState, useRef } from 'react';
import { useKpi } from '@/lib/kpi-context';
import { UserProfile, UserRole } from '@/lib/types';
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
  Calendar
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
    departments 
  } = useKpi();

  const [activeTab, setActiveTab] = useState<'settings' | 'teachers' | 'period'>('settings');

  // Form cài đặt trường
  const [schoolName, setSchoolName] = useState(schoolSettings.schoolName);
  const [academicYear, setAcademicYear] = useState(schoolSettings.academicYear);
  const [driveFolderId, setDriveFolderId] = useState(schoolSettings.googleDriveFolderId);
  const [bonusCap, setBonusCap] = useState(schoolSettings.bonusPercentageCap);
  const [bonusRatio, setBonusRatio] = useState(schoolSettings.bonusThresholdRatio * 100);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // Form thêm giáo viên thủ công
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deptId, setDeptId] = useState(departments[0]?.id || '');
  const [role, setRole] = useState<UserRole>('GIAO_VIEN');
  const [concurrentRolesText, setConcurrentRolesText] = useState('');

  // Import Excel
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

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

  // Xử lý Import Excel
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setImportLoading(true);
    setImportMessage(null);

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

      // Thêm danh sách giáo viên mới vào store
      addTeachersFromExcel(data.teachers);
      setImportMessage(`Import thành công ${data.count} giáo viên từ file Excel!`);
      setTimeout(() => setImportMessage(null), 5000);
    } catch (err: any) {
      alert('Lỗi import Excel: ' + err.message);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            TRANG QUẢN TRỊ TRƯỜNG HỌC (ADMIN)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình đơn vị, Google Drive, khóa sổ kỳ đánh giá và quản lý danh sách giáo viên
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'settings' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Cấu Hình Trường
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'teachers' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Nhân Sự & Excel ({allUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('period')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'period' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
            }`}
          >
            Khóa Sổ KPI
          </button>
        </div>
      </div>

      {/* Thông báo Import */}
      {importMessage && (
        <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 animate-fadeIn shadow-md">
          <CheckCircle2 className="w-4 h-4" />
          {importMessage}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: CẤU HÌNH TRƯỜNG & GOOGLE DRIVE                      */}
      {/* ========================================================= */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Thông Tin Trường & Thư Mục Drive Trung Tâm
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên Trường Học / Đơn vị *
                </label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Năm học hiện tại *
                </label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="VD: 2024-2025"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                />
              </div>
            </div>

            {/* Google Drive Configuration */}
            <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                  Tích hợp Google Drive Trung Tâm
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Toàn bộ minh chứng ảnh/PDF của giáo viên sẽ tự động tạo cấu trúc cây thư mục <code>[Nam_Hoc]/[Thang_XX]/[Ten_To]/[Ho_Ten_GV]</code> bên trong Folder ID này.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Google Drive Folder ID Gốc (Lấy từ URL thư mục chia sẻ)
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  placeholder="VD: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up0I"
                  className="w-full text-xs border border-indigo-200 bg-white rounded-lg p-2.5 focus:outline-indigo-600 font-mono"
                />
              </div>
            </div>

            {/* Công thức tính điểm & Thưởng */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Mức trần Điểm Thưởng Bonus (% điểm Mục II)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={bonusCap}
                    onChange={(e) => setBonusCap(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                  />
                  <span className="text-xs text-slate-500 font-bold">% (Tối đa 7đ)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ngưỡng tỷ lệ nhiệm vụ &ldquo;Vượt yêu cầu&rdquo; để nhận thưởng
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={bonusRatio}
                    onChange={(e) => setBonusRatio(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                  />
                  <span className="text-xs text-slate-500 font-bold">% tổng nhiệm vụ</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {saveSettingsSuccess && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
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

      {/* ========================================================= */}
      {/* TAB 2: QUẢN LÝ GIÁO VIÊN & IMPORT EXCEL                   */}
      {/* ========================================================= */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Danh Sách Giáo Viên & Cán Bộ Nhà Trường
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng cộng: {allUsers.length} nhân sự trong hệ thống
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Tải file mẫu Excel */}
              <a
                href="/api/teachers/template"
                download="template_teachers.xlsx"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Tải Mẫu Excel
              </a>

              {/* Nút bấm Import Excel */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleExcelImport}
                accept=".xlsx, .xls"
                className="hidden"
                id="excel-import-input"
              />
              <button
                type="button"
                disabled={importLoading}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {importLoading ? 'Đang đọc...' : 'Import Excel'}
              </button>

              {/* Thêm thủ công */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                + Thêm Giáo Viên
              </button>
            </div>
          </div>

          {/* Bảng danh sách giáo viên */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-semibold">
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Tổ Chuyên Môn</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Kiêm Nhiệm</th>
                  <th className="py-3 px-4 text-right">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{u.email}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{u.departmentName || 'Chung'}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {u.concurrentRoles && u.concurrentRoles.length > 0 ? (
                          u.concurrentRoles.map((r, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
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
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
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

      {/* ========================================================= */}
      {/* TAB 3: KHÓA SỔ KPI THÁNG                                  */}
      {/* ========================================================= */}
      {activeTab === 'period' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Quản Lý Trạng Thái Kỳ Đánh Giá KPI
          </h2>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">{period.name}</h3>
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
              <p className="text-xs text-slate-500 mt-1">
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

      {/* Modal thêm giáo viên */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Thêm Giáo Viên Mới</h3>
            <p className="text-xs text-slate-500 mb-4">Nhập thông tin hồ sơ và phân tổ chuyên môn.</p>

            <form onSubmit={handleAddTeacherSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Họ và Tên *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Email đăng nhập *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tổ chuyên môn</label>
                  <select
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600 bg-white"
                  >
                    <option value="GIAO_VIEN">Giáo Viên</option>
                    <option value="TO_TRUONG">Tổ Trưởng</option>
                    <option value="BGH">Ban Giám Hiệu</option>
                    <option value="ADMIN">Quản Trị Viên</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nhiệm vụ kiêm nhiệm (cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  placeholder="VD: Chủ nhiệm 11A, Bồi dưỡng HSG"
                  value={concurrentRolesText}
                  onChange={(e) => setConcurrentRolesText(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow"
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
