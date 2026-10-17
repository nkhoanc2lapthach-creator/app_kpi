import { NextRequest, NextResponse } from 'next/server';
import { uploadProofFileToDrive } from '@/lib/google-drive';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const academicYear = (formData.get('academicYear') as string) || '2024-2025';
    const month = parseInt((formData.get('month') as string) || '10', 10);
    const departmentName = (formData.get('departmentName') as string) || 'To_Chuyen_Mon';
    const teacherName = (formData.get('teacherName') as string) || 'Giao_Vien';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn file minh chứng cần tải lên' },
        { status: 400 }
      );
    }

    // Kiểm tra định dạng (Ảnh hoặc PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ chấp nhận file định dạng Hình ảnh (JPG, PNG) hoặc tài liệu PDF' },
        { status: 400 }
      );
    }

    // Giới hạn dung lượng 20MB
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Dung lượng file không được vượt quá 20MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadProofFileToDrive({
      buffer,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      academicYear,
      month,
      departmentName,
      teacherName,
    });

    return NextResponse.json({
      success: true,
      message: result.isMock 
        ? 'Đã tải lên minh chứng (Chế độ mô phỏng Drive)'
        : 'Đã tải minh chứng lên Google Drive thành công!',
      file: result,
    });
  } catch (error: any) {
    console.error('Lỗi API /api/upload-drive:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý file upload' },
      { status: 500 }
    );
  }
}
