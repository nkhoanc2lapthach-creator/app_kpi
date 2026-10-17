import { NextRequest, NextResponse } from 'next/server';
import { exportKpiReportExcel } from '@/lib/excel-helper';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const submissions = body.submissions || [];
    const periodName = body.periodName || 'Bao_Cao_KPI';

    const buffer = exportKpiReportExcel(submissions, periodName);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Bao_Cao_KPI_${encodeURIComponent(periodName)}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Lỗi xuất Excel KPI:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo file báo cáo Excel' },
      { status: 500 }
    );
  }
}
