'use client';

import React, { useRef } from 'react';
import { KpiSubmission, SchoolSettings } from '@/lib/types';
import { Printer, Download, X, FileText } from 'lucide-react';

interface KpiPrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissions: KpiSubmission[];
  schoolSettings: SchoolSettings;
  title?: string;
}

export function KpiPrintReportModal({
  isOpen,
  onClose,
  submissions,
  schoolSettings,
  title = 'Phiếu Đánh Giá & Xếp Loại KPI Giáo Viên (Chuẩn Khổ A4)',
}: KpiPrintReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || submissions.length === 0) return null;

  // Xử lý in / lưu PDF qua trình duyệt
  const handlePrint = () => {
    window.print();
  };

  // Tải file Word (.docx)
  const handleDownloadWord = async () => {
    try {
      const res = await fetch('/api/kpi/export-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissions,
          schoolSettings,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Xuất file Word thất bại');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = submissions.length === 1
        ? `Phieu_KPI_${submissions[0].teacherName.replace(/\s+/g, '_')}.docx`
        : `Danh_Sach_Phieu_KPI_${submissions.length}_GiaoVien.docx`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      alert('Lỗi xuất file Word: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 my-auto print:max-w-none print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Header Modal (Ẩn khi In) */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">{title}</h3>
              <p className="text-xs text-slate-500">
                Hiển thị {submissions.length} phiếu đánh giá • Dàn trang chuẩn A4 có chữ ký 3 bên
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadWord}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              title="Tải file Microsoft Word (.docx)"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất File Word (.docx)
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
              title="In trực tiếp hoặc Lưu file PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              In / Xuất PDF (A4)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung trang A4 xem trước & in */}
        <div
          ref={printAreaRef}
          className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-serif leading-relaxed print:p-0 print:overflow-visible"
        >
          {submissions.map((sub, sIdx) => {
            const s1Items = (sub.items || []).filter((i) => i.section === 'SECTION_I');
            const s2Items = (sub.items || []).filter((i) => i.section === 'SECTION_II');
            const finalScore = sub.bghFinalScore ?? (sub.toTruongTotalScore ?? sub.selfTotalScore);
            const gradeLabel = sub.finalGrade === 'XUAT_SAC' ? 'Xuất sắc' :
                               sub.finalGrade === 'TOT' ? 'Tốt' :
                               sub.finalGrade === 'HOAN_THANH' ? 'Hoàn thành' : 'Chưa hoàn thành';

            return (
              <div
                key={sub.id}
                className={`max-w-[210mm] mx-auto bg-white p-6 sm:p-8 border border-slate-200 shadow-sm rounded-xl mb-8 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none ${
                  sIdx > 0 ? 'print:break-before-page' : ''
                }`}
                style={{ minHeight: '297mm' }}
              >
                {/* 1. QUỐC HIỆU & TIÊU NGỮ */}
                <div className="grid grid-cols-2 text-center text-xs pb-4 border-b border-slate-300">
                  <div className="space-y-0.5">
                    <p className="font-semibold uppercase text-slate-700">SỞ GIÁO DỤC VÀ ĐÀO TẠO</p>
                    <p className="font-bold uppercase text-slate-900 text-sm">
                      {schoolSettings.schoolName}
                    </p>
                    <div className="w-24 h-0.5 bg-slate-400 mx-auto mt-1"></div>
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold uppercase text-slate-900">
                      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                    </p>
                    <p className="font-bold text-slate-800 text-xs">Độc lập - Tự do - Hạnh phúc</p>
                    <div className="w-28 h-0.5 bg-slate-400 mx-auto mt-1"></div>
                  </div>
                </div>

                {/* 2. TIÊU ĐỀ BÁO CÁO */}
                <div className="text-center my-6 space-y-1">
                  <h1 className="text-lg sm:text-xl font-bold uppercase text-slate-900 tracking-wide font-sans">
                    PHIẾU ĐÁNH GIÁ VÀ XẾP LOẠI KPI GIÁO VIÊN
                  </h1>
                  <p className="text-xs text-slate-600 italic">
                    Kỳ đánh giá: {sub.periodName || `Tháng ${sub.month}/${sub.academicYear}`} • Năm học: {sub.academicYear}
                  </p>
                </div>

                {/* 3. THÔNG TIN GIÁO VIÊN */}
                <div className="text-xs text-slate-800 space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans mb-5 print:bg-transparent print:p-0 print:border-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p>
                      <strong>Họ và tên:</strong> <span className="text-sm font-bold text-slate-900">{sub.teacherName}</span>
                    </p>
                    <p>
                      <strong>Tổ chuyên môn:</strong> {sub.departmentName || 'Chung'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p>
                      <strong>Email:</strong> {sub.teacherEmail}
                    </p>
                    <p>
                      <strong>Nhiệm vụ kiêm nhiệm:</strong>{' '}
                      {(sub.concurrentRoles && sub.concurrentRoles.length > 0)
                        ? sub.concurrentRoles.join(', ')
                        : 'Không có'}
                    </p>
                  </div>
                </div>

                {/* 4. BẢNG TIÊU CHÍ ĐÁNH GIÁ CHI TIẾT */}
                <div className="overflow-x-auto mb-5 font-sans">
                  <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase">
                        <th className="py-2 px-2.5 border-r border-slate-300 text-center w-8">STT</th>
                        <th className="py-2 px-3 border-r border-slate-300">Nội dung tiêu chí đánh giá</th>
                        <th className="py-2 px-2 border-r border-slate-300 text-center w-14">Chuẩn</th>
                        <th className="py-2 px-2 border-r border-slate-300 text-center w-12">Hệ số</th>
                        <th className="py-2 px-2 border-r border-slate-300 text-center w-14">Tự chấm</th>
                        <th className="py-2 px-2 border-r border-slate-300 text-center w-16">Tổ Trưởng</th>
                        <th className="py-2 px-2 text-center w-16">BGH Chốt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Mục I */}
                      <tr className="bg-blue-50/70 font-bold text-blue-900 text-[11px]">
                        <td colSpan={7} className="py-1.5 px-3">
                          I. MỤC I: ĐẠO ĐỨC, KỶ LUẬT & NỀN NẾP (30 ĐIỂM)
                        </td>
                      </tr>
                      {s1Items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 font-medium">{idx + 1}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200">
                            <span className="font-semibold text-slate-800">{item.taskName}</span>
                            {item.description && <p className="text-[10px] text-slate-500 italic mt-0.5">{item.description}</p>}
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200">{item.standardScore}</td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200">{item.difficultyCoefficient}x</td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold">{item.selfScore}</td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 text-blue-800 font-semibold">{item.toTruongScore ?? '—'}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-800">{item.bghScore ?? '—'}</td>
                        </tr>
                      ))}

                      {/* Mục II */}
                      <tr className="bg-purple-50/70 font-bold text-purple-900 text-[11px]">
                        <td colSpan={7} className="py-1.5 px-3">
                          II. MỤC II: CHUYÊN MÔN, KIÊM NHIỆM & DỰ ÁN (70 ĐIỂM QUY ĐỔI)
                        </td>
                      </tr>
                      {s2Items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 font-medium">{idx + 1}</td>
                          <td className="py-1.5 px-3 border-r border-slate-200">
                            <div className="font-semibold text-slate-800">{item.taskName}</div>
                            <div className="text-[10px] text-indigo-700 font-medium">
                              Tiến độ: {item.progressPercent}% | Chất lượng: {item.qualityPercent}%
                              {item.taskCategory === 'PROJECT' && ' (Dự án dài hạn)'}
                              {item.taskCategory === 'EMERGING' && ' (Đột xuất)'}
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200">{item.standardScore}</td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200">{item.difficultyCoefficient}x</td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 font-bold">{item.selfScore}</td>
                          <td className="py-1.5 px-2 text-center border-r border-slate-200 text-blue-800 font-semibold">{item.toTruongScore ?? '—'}</td>
                          <td className="py-1.5 px-2 text-center font-bold text-emerald-800">{item.bghScore ?? '—'}</td>
                        </tr>
                      ))}

                      {/* Dòng tổng kết điểm */}
                      <tr className="bg-amber-50 font-bold text-slate-900 text-[11px]">
                        <td colSpan={4} className="py-2 px-3 text-right border-r border-slate-200">
                          TỔNG ĐIỂM KPI (Mục I + Mục II + Thưởng):
                        </td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 font-extrabold">{sub.selfTotalScore} đ</td>
                        <td className="py-2 px-2 text-center border-r border-slate-200 text-blue-800 font-extrabold">{sub.toTruongTotalScore ? `${sub.toTruongTotalScore} đ` : '—'}</td>
                        <td className="py-2 px-2 text-center bg-emerald-100 text-emerald-900 font-black">{finalScore} đ</td>
                      </tr>
                      <tr className="bg-emerald-50 text-emerald-950 font-bold text-xs">
                        <td colSpan={7} className="py-2 px-4 text-center">
                          XẾP LOẠI ĐÁNH GIÁ CUỐI CÙNG: <span className="uppercase text-sm font-black text-emerald-800">{gradeLabel}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. Ý KIẾN NHẬN XÉT */}
                <div className="text-xs space-y-2 mb-8 font-sans">
                  <p>
                    <strong>Nhận xét của Tổ trưởng:</strong>{' '}
                    <span className="italic">{sub.toTruongNote || 'Nhất trí với kết quả tự chấm của giáo viên.'}</span>
                  </p>
                  <p>
                    <strong>Nhận xét của Ban Giám Hiệu:</strong>{' '}
                    <span className="italic">{sub.bghNote || 'Phê duyệt kết quả đánh giá KPI của giáo viên.'}</span>
                  </p>
                </div>

                {/* 6. KHỐI CHỮ KÝ 3 BÊN */}
                <div className="grid grid-cols-3 text-center text-xs pt-4 font-sans gap-2">
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-slate-900">NGƯỜI TỰ ĐÁNH GIÁ</p>
                    <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900">{sub.teacherName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-slate-900">TỔ TRƯỞNG CHUYÊN MÔN</p>
                    <p className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900">........................................</p>
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold uppercase text-slate-900">HIỆU TRƯỞNG / BGH</p>
                    <p className="text-[11px] text-slate-500 italic">(Ký, đóng dấu và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900">........................................</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
