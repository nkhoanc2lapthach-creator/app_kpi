import { NextRequest, NextResponse } from 'next/server';
import { parseTeachersExcel } from '@/lib/excel-helper';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn file Excel danh sách giáo viên (.xlsx, .xls)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedTeachers = parseTeachersExcel(buffer);

    if (parsedTeachers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy dữ liệu giáo viên hợp lệ trong file Excel' },
        { status: 400 }
      );
    }

    // Chuyển đổi thành dạng UserProfile để lưu
    const formattedTeachers = parsedTeachers.map((t, idx) => ({
      id: `imported_user_${Date.now()}_${idx}`,
      email: t.email,
      fullName: t.fullName,
      phone: t.phone || '',
      role: t.role,
      departmentId: `dept_${t.departmentCode.toLowerCase()}`,
      departmentName: t.departmentName || t.departmentCode,
      concurrentRoles: t.concurrentRoles,
    }));

    return NextResponse.json({
      success: true,
      message: `Đã đọc thành công ${formattedTeachers.length} giáo viên từ file Excel!`,
      count: formattedTeachers.length,
      teachers: formattedTeachers,
    });
  } catch (error: any) {
    console.error('Lỗi import Excel:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi đọc file Excel' },
      { status: 500 }
    );
  }
}
