import { NextRequest, NextResponse } from 'next/server';
import { parseKpiCriteriaExcel } from '@/lib/excel-helper';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const defaultDepartmentId = (formData.get('departmentId') as string) || 'ALL';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn file Excel bảng tiêu chí KPI (.xlsx, .xls)' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsedCriteria = parseKpiCriteriaExcel(buffer);

    if (parsedCriteria.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy dữ liệu tiêu chí hợp lệ trong file Excel' },
        { status: 400 }
      );
    }

    // Format theo KpiFrameworkTask
    const formattedCriteria = parsedCriteria.map((c, idx) => ({
      id: `crit_imported_${Date.now()}_${idx}`,
      academicYear: '2024-2025',
      departmentId: c.departmentCode && c.departmentCode !== 'ALL'
        ? (c.departmentCode.startsWith('dept_') ? c.departmentCode : `dept_${c.departmentCode.toLowerCase()}`)
        : (defaultDepartmentId || 'ALL'),
      departmentName: c.departmentName || (c.departmentCode === 'ALL' ? 'Toàn trường (Mặc định)' : c.departmentCode),
      section: c.section,
      category: c.category,
      code: c.code || `TC_${idx + 1}`,
      name: c.name,
      description: c.description || '',
      standardScore: c.standardScore,
      difficultyCoefficient: c.difficultyCoefficient,
      orderIndex: c.orderIndex || idx + 1,
      isActive: true,
    }));

    return NextResponse.json({
      success: true,
      message: `Đã import thành công ${formattedCriteria.length} tiêu chí KPI từ file Excel!`,
      count: formattedCriteria.length,
      criteria: formattedCriteria,
    });
  } catch (error: any) {
    console.error('Lỗi import tiêu chí Excel:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi đọc file Excel tiêu chí' },
      { status: 500 }
    );
  }
}
