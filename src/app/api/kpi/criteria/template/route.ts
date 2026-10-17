import { NextResponse } from 'next/server';
import { generateKpiCriteriaTemplateBuffer } from '@/lib/excel-helper';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const buffer = generateKpiCriteriaTemplateBuffer();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template_kpi_criteria.xlsx"',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Không thể tạo file template tiêu chí KPI' },
      { status: 500 }
    );
  }
}
