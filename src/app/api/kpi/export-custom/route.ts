import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { KpiSubmission } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const submissions: KpiSubmission[] = body.submissions || [];
    const periodName = body.periodName || 'Bao_Cao_KPI';
    const columns: Record<string, boolean> = body.columns || {};

    if (submissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu bài nộp để xuất báo cáo' },
        { status: 400 }
      );
    }

    const exportRows = submissions.map((sub, index) => {
      const row: Record<string, any> = {};

      if (columns.stt ?? true) row['STT'] = index + 1;
      if (columns.fullName ?? true) row['Họ và Tên'] = sub.teacherName;
      if (columns.email ?? true) row['Email'] = sub.teacherEmail;
      if (columns.department ?? true) row['Tổ Chuyên Môn'] = sub.departmentName || 'Chung';
      if (columns.concurrentRoles ?? true) {
        row['Nhiệm Vụ Kiêm Nhiệm'] = Array.isArray(sub.concurrentRoles) ? sub.concurrentRoles.join(', ') : '';
      }

      // Điểm Mục I
      if (columns.section1Total ?? true) {
        row['Mục I (30đ)'] = sub.bghScoreSection1 ?? (sub.toTruongScoreSection1 ?? sub.selfScoreSection1);
      }
      if (columns.section1Details) {
        const s1 = (sub.items || []).filter((i) => i.section === 'SECTION_I');
        s1.forEach((item, i) => {
          row[`Mục I - Tiêu chí ${i + 1} (${item.taskName.slice(0, 20)})`] =
            item.bghScore ?? (item.toTruongScore ?? item.selfScore);
        });
      }

      // Điểm Mục II
      if (columns.section2Total ?? true) {
        row['Mục II (70đ)'] = sub.bghScoreSection2 ?? (sub.toTruongScoreSection2 ?? sub.selfScoreSection2);
      }
      if (columns.section2Details) {
        const s2 = (sub.items || []).filter((i) => i.section === 'SECTION_II');
        s2.forEach((item, i) => {
          row[`Mục II - Tiêu chí ${i + 1} (${item.taskName.slice(0, 20)})`] =
            item.bghScore ?? (item.toTruongScore ?? item.selfScore);
        });
      }

      if (columns.bonus ?? true) {
        row['Điểm Thưởng (Bonus)'] = sub.bghBonusScore ?? (sub.toTruongBonusScore ?? sub.selfBonusScore);
      }
      if (columns.selfScore) row['Điểm Tự Chấm'] = sub.selfTotalScore;
      if (columns.toTruongScore ?? true) row['Điểm Tổ Trưởng'] = sub.toTruongTotalScore ?? 'Chưa duyệt';
      if (columns.bghScore ?? true) row['Điểm BGH Chốt'] = sub.bghFinalScore ?? 'Chưa duyệt';

      if (columns.totalScore ?? true) {
        row['Tổng Điểm KPI'] = sub.bghFinalScore ?? (sub.toTruongTotalScore ?? sub.selfTotalScore);
      }
      if (columns.grade ?? true) {
        const score = sub.bghFinalScore ?? (sub.toTruongTotalScore ?? sub.selfTotalScore);
        row['Xếp Loại'] = sub.finalGrade === 'XUAT_SAC' ? 'Xuất sắc' :
                          sub.finalGrade === 'TOT' ? 'Tốt' :
                          sub.finalGrade === 'HOAN_THANH' ? 'Hoàn thành' :
                          score >= 90 ? 'Xuất sắc' :
                          score >= 75 ? 'Tốt' :
                          score >= 50 ? 'Hoàn thành' : 'Chưa hoàn thành';
      }
      if (columns.status ?? true) row['Trạng Thái'] = sub.status;
      if (columns.toTruongNote ?? true) row['Nhận Xét Tổ Trưởng'] = sub.toTruongNote || '';
      if (columns.bghNote ?? true) row['Nhận Xét BGH'] = sub.bghNote || '';

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    const cleanSheetName = (periodName || 'BaoCaoTuyChon').slice(0, 31).replace(/[\\/?*[\]]/g, '');
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Bao_Cao_KPI_Tuy_Chon_${encodeURIComponent(cleanSheetName)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Lỗi xuất báo cáo tùy biến:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tạo file báo cáo tùy biến' },
      { status: 500 }
    );
  }
}
