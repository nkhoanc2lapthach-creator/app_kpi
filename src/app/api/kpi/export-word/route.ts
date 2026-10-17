import { NextRequest, NextResponse } from 'next/server';
import { generateTeacherKpiWordBuffer } from '@/lib/word-export';
import { KpiSubmission, SchoolSettings } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const submissions: KpiSubmission[] = body.submissions || [];
    const schoolSettings: SchoolSettings = body.schoolSettings || {
      id: 'school_01',
      schoolName: 'Trường THPT Chuyên Nguyễn Trãi',
      academicYear: '2024-2025',
      currentMonth: 10,
      googleDriveFolderId: '',
      bonusPercentageCap: 10,
      bonusThresholdRatio: 0.3,
    };

    if (submissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu bài nộp để xuất file Word' },
        { status: 400 }
      );
    }

    const buffer = await generateTeacherKpiWordBuffer(submissions, schoolSettings);

    const filename = submissions.length === 1
      ? `Phieu_KPI_${encodeURIComponent(submissions[0].teacherName.replace(/\s+/g, '_'))}.docx`
      : `Danh_Sach_Phieu_KPI_${submissions.length}_GiaoVien.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Lỗi xuất file Word:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tạo file Word' },
      { status: 500 }
    );
  }
}
