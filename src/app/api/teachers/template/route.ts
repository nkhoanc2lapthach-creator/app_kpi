import { NextResponse } from 'next/server';
import { generateTeacherTemplateBuffer } from '@/lib/excel-helper';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const buffer = generateTeacherTemplateBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_teachers.xlsx"',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Không thể tạo file template' },
      { status: 500 }
    );
  }
}
