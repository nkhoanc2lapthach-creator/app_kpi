import * as XLSX from 'xlsx';

export interface TeacherImportRow {
  stt?: number;
  fullName: string;
  email: string;
  phone?: string;
  departmentCode: string;
  departmentName?: string;
  role: 'GIAO_VIEN' | 'TO_TRUONG' | 'BGH' | 'ADMIN';
  concurrentRoles: string[];
  note?: string;
}

/**
 * Tạo buffer file mẫu Excel template_teachers.xlsx
 */
export function generateTeacherTemplateBuffer(): Buffer {
  const sampleData = [
    {
      'STT': 1,
      'Họ và Tên': 'Nguyễn Văn An',
      'Email': 'an.nguyen@thptchuyen.edu.vn',
      'Số Điện Thoại': '0912345678',
      'Mã Tổ': 'TOAN_TIN',
      'Tên Tổ': 'Tổ Toán - Tin học',
      'Vai Trò': 'GIAO_VIEN',
      'Nhiệm Vụ Kiêm Nhiệm': 'Chủ nhiệm lớp 12A1, Bồi dưỡng HSG Toán',
      'Ghi Chú': 'Giáo viên cốt cán'
    },
    {
      'STT': 2,
      'Họ và Tên': 'Trần Thị Bình',
      'Email': 'binh.tran@thptchuyen.edu.vn',
      'Số Điện Thoại': '0923456789',
      'Mã Tổ': 'TOAN_TIN',
      'Tên Tổ': 'Tổ Toán - Tin học',
      'Vai Trò': 'TO_TRUONG',
      'Nhiệm Vụ Kiêm Nhiệm': 'Tổ trưởng chuyên môn, Khảo thí',
      'Ghi Chú': 'Tổ trưởng Toán Tin'
    },
    {
      'STT': 3,
      'Họ và Tên': 'Lê Hoàng Cường',
      'Email': 'cuong.le@thptchuyen.edu.vn',
      'Số Điện Thoại': '0934567890',
      'Mã Tổ': 'NGU_VAN',
      'Tên Tổ': 'Tổ Ngữ Văn',
      'Vai Trò': 'GIAO_VIEN',
      'Nhiệm Vụ Kiêm Nhiệm': 'Bí thư Đoàn trường, Chủ nhiệm 10D1',
      'Ghi Chú': ''
    },
    {
      'STT': 4,
      'Họ và Tên': 'Phạm Thu Dung',
      'Email': 'dung.pham@thptchuyen.edu.vn',
      'Số Điện Thoại': '0945678901',
      'Mã Tổ': 'BGH',
      'Tên Tổ': 'Ban Giám Hiệu',
      'Vai Trò': 'BGH',
      'Nhiệm Vụ Kiêm Nhiệm': 'Phó Hiệu trưởng phụ trách chuyên môn',
      'Ghi Chú': 'Duyệt KPI vòng 2'
    },
    {
      'STT': 5,
      'Họ và Tên': 'Quản Trị Viên',
      'Email': 'admin@thptchuyen.edu.vn',
      'Số Điện Thoại': '0900000000',
      'Mã Tổ': 'ADMIN',
      'Tên Tổ': 'Quản trị hệ thống',
      'Vai Trò': 'ADMIN',
      'Nhiệm Vụ Kiêm Nhiệm': 'Quản trị viên',
      'Ghi Chú': 'Toàn quyền'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Thiết lập độ rộng cột
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 24 }, // Họ và Tên
    { wch: 30 }, // Email
    { wch: 15 }, // SĐT
    { wch: 14 }, // Mã Tổ
    { wch: 22 }, // Tên Tổ
    { wch: 14 }, // Vai Trò
    { wch: 40 }, // Kiêm nhiệm
    { wch: 20 }, // Ghi Chú
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'DanhSachGiaoVien');

  // Thêm sheet Hướng dẫn nhập liệu
  const guideData = [
    { 'Mã Tổ Hợp Lệ': 'TOAN_TIN', 'Tên Đầy Đủ': 'Tổ Toán - Tin học' },
    { 'Mã Tổ Hợp Lệ': 'NGU_VAN', 'Tên Đầy Đủ': 'Tổ Ngữ Văn' },
    { 'Mã Tổ Hợp Lệ': 'KHTN', 'Tên Đầy Đủ': 'Tổ Khoa học Tự nhiên' },
    { 'Mã Tổ Hợp Lệ': 'KHXH', 'Tên Đầy Đủ': 'Tổ Khoa học Xã hội' },
    { 'Mã Tổ Hợp Lệ': 'NGOAI_NGU', 'Tên Đầy Đủ': 'Tổ Ngoại Ngữ' },
    { 'Mã Tổ Hợp Lệ': 'VAN_PHONG', 'Tên Đầy Đủ': 'Tổ Văn Phòng - Gián tiếp' },
    { 'Mã Tổ Hợp Lệ': 'BGH', 'Tên Đầy Đủ': 'Ban Giám Hiệu' },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'HuongDanMaTo');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Đọc file Excel tải lên và parse thành danh sách giáo viên
 */
export function parseTeachersExcel(buffer: Buffer): TeacherImportRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(ws);

  const parsedTeachers: TeacherImportRow[] = [];

  for (const row of rawRows) {
    const fullName = String(row['Họ và Tên'] || row['fullName'] || row['Ho_Ten'] || '').trim();
    const email = String(row['Email'] || row['email'] || '').trim().toLowerCase();

    if (!fullName || !email) continue;

    const roleStr = String(row['Vai Trò'] || row['role'] || 'GIAO_VIEN').toUpperCase().trim();
    let role: 'GIAO_VIEN' | 'TO_TRUONG' | 'BGH' | 'ADMIN' = 'GIAO_VIEN';
    if (['ADMIN', 'BGH', 'TO_TRUONG', 'GIAO_VIEN'].includes(roleStr)) {
      role = roleStr as any;
    }

    const deptCode = String(row['Mã Tổ'] || row['departmentCode'] || 'TOAN_TIN').trim().toUpperCase();
    const deptName = String(row['Tên Tổ'] || row['departmentName'] || '').trim();
    const phone = String(row['Số Điện Thoại'] || row['phone'] || '').trim();

    // Phân tách nhiệm vụ kiêm nhiệm bằng dấu phẩy
    const rawConcurrent = String(row['Nhiệm Vụ Kiêm Nhiệm'] || row['concurrentRoles'] || '').trim();
    const concurrentRoles = rawConcurrent
      ? rawConcurrent.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    parsedTeachers.push({
      fullName,
      email,
      phone,
      departmentCode: deptCode,
      departmentName: deptName,
      role,
      concurrentRoles,
      note: String(row['Ghi Chú'] || ''),
    });
  }

  return parsedTeachers;
}

/**
 * Xuất báo cáo tổng hợp KPI ra file Excel
 */
export function exportKpiReportExcel(submissions: any[], periodName: string): Buffer {
  const exportData = submissions.map((sub, index) => ({
    'STT': index + 1,
    'Họ và Tên': sub.teacherName,
    'Email': sub.email,
    'Tổ Chuyên Môn': sub.departmentName,
    'Nhiệm Vụ Kiêm Nhiệm': Array.isArray(sub.concurrentRoles) ? sub.concurrentRoles.join(', ') : '',
    'Điểm Mục I (30đ)': sub.section1Score,
    'Điểm Mục II (70đ)': sub.section2Score,
    'Điểm Thưởng (Bonus)': sub.bonusScore || 0,
    'Tổng Điểm KPI': sub.totalScore,
    'Xếp Loại': sub.gradeLabel,
    'Trạng Thái Duyệt': sub.statusLabel,
    'Tổ Trưởng Duyệt': sub.toTruongScore ?? 'Chưa duyệt',
    'BGH Duyệt': sub.bghScore ?? 'Chưa duyệt',
    'Nhận Xét Của BGH': sub.bghNote || '',
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  const cleanSheetName = (periodName || 'BaoCaoKPI').slice(0, 31).replace(/[\\/?*[\]]/g, '');
  XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

export interface KpiCriteriaImportRow {
  stt?: number;
  departmentCode: string;
  departmentName?: string;
  section: 'SECTION_I' | 'SECTION_II';
  category: 'FIXED' | 'EMERGING' | 'PROJECT';
  code: string;
  name: string;
  description?: string;
  standardScore: number;
  difficultyCoefficient: number;
  orderIndex?: number;
}

/**
 * Tạo buffer file mẫu template_kpi_criteria.xlsx để cài đặt khung tiêu chí KPI
 */
export function generateKpiCriteriaTemplateBuffer(): Buffer {
  const sampleCriteria = [
    {
      'STT': 1,
      'Mã Đơn Vị (ALL/Mã Tổ)': 'ALL',
      'Tên Đơn Vị': 'Toàn trường (Mặc định)',
      'Phần Đánh Giá (MUC_I/MUC_II)': 'MUC_I',
      'Loại Nhiệm Vụ (CO_DINH/DOT_XUAT/DU_AN)': 'CO_DINH',
      'Mã Tiêu Chí': 'DD_01',
      'Tên Tiêu Chí KPI': 'Chấp hành chủ trương, đường lối, pháp luật và đạo đức nhà giáo',
      'Mô Tả Tiêu Chí': 'Gương mẫu, tận tụy, không vi phạm đạo đức nhà giáo và quy chế trường',
      'Điểm Chuẩn': 10,
      'Hệ Số Khó': 1.0,
      'Thứ Tự': 1
    },
    {
      'STT': 2,
      'Mã Đơn Vị (ALL/Mã Tổ)': 'ALL',
      'Tên Đơn Vị': 'Toàn trường (Mặc định)',
      'Phần Đánh Giá (MUC_I/MUC_II)': 'MUC_I',
      'Loại Nhiệm Vụ (CO_DINH/DOT_XUAT/DU_AN)': 'CO_DINH',
      'Mã Tiêu Chí': 'DD_02',
      'Tên Tiêu Chí KPI': 'Thực hiện quy chế chuyên môn, nền nếp kỷ luật lao động',
      'Mô Tả Tiêu Chí': 'Đúng giờ lên lớp, hồ sơ giáo án đầy đủ, không bỏ tiết, chấm bài đúng lịch',
      'Điểm Chuẩn': 10,
      'Hệ Số Khó': 1.0,
      'Thứ Tự': 2
    },
    {
      'STT': 3,
      'Mã Đơn Vị (ALL/Mã Tổ)': 'ALL',
      'Tên Đơn Vị': 'Toàn trường (Mặc định)',
      'Phần Đánh Giá (MUC_I/MUC_II)': 'MUC_I',
      'Loại Nhiệm Vụ (CO_DINH/DOT_XUAT/DU_AN)': 'CO_DINH',
      'Mã Tiêu Chí': 'DD_03',
      'Tên Tiêu Chí KPI': 'Tinh thần đoàn kết, xây dựng tập thể, văn hóa công sở',
      'Mô Tả Tiêu Chí': 'Tích cực tham gia hoạt động đoàn thể, hỗ trợ đồng nghiệp, ứng xử chuẩn mực',
      'Điểm Chuẩn': 10,
      'Hệ Số Khó': 1.0,
      'Thứ Tự': 3
    },
    {
      'STT': 4,
      'Mã Đơn Vị (ALL/Mã Tổ)': 'ALL',
      'Tên Đơn Vị': 'Toàn trường (Mặc định)',
      'Phần Đánh Giá (MUC_I/MUC_II)': 'MUC_II',
      'Loại Nhiệm Vụ (CO_DINH/DOT_XUAT/DU_AN)': 'CO_DINH',
      'Mã Tiêu Chí': 'CM_01',
      'Tên Tiêu Chí KPI': 'Chất lượng soạn giáo án và đổi mới phương pháp giảng dạy',
      'Mô Tả Tiêu Chí': 'Thiết kế bài dạy phát triển năng lực, ứng dụng CNTT, đồ dùng trực quan số',
      'Điểm Chuẩn': 15,
      'Hệ Số Khó': 1.0,
      'Thứ Tự': 1
    },
    {
      'STT': 5,
      'Mã Đơn Vị (ALL/Mã Tổ)': 'ALL',
      'Tên Đơn Vị': 'Toàn trường (Mặc định)',
      'Phần Đánh Giá (MUC_I/MUC_II)': 'MUC_II',
      'Loại Nhiệm Vụ (CO_DINH/DOT_XUAT/DU_AN)': 'CO_DINH',
      'Mã Tiêu Chí': 'CM_02',
      'Tên Tiêu Chí KPI': 'Thực hiện giờ dạy trên lớp và kiểm tra đánh giá thường xuyên',
      'Mô Tả Tiêu Chí': 'Đảm bảo chuẩn kiến thức kỹ năng, chấm chữa bài kịp thời, nhập điểm đúng hạn',
      'Điểm Chuẩn': 15,
      'Hệ Số Khó': 1.0,
      'Thứ Tự': 2
    },
    {
      'STT': 6,
      'Mã Đơn Vị (ALL/Mã Tổ)': 'TOAN_TIN',
      'Tên Đơn Vị': 'Tổ Toán - Tin học',
      'Phần Đánh Giá (MUC_I/MUC_II)': 'MUC_II',
      'Loại Nhiệm Vụ (CO_DINH/DOT_XUAT/DU_AN)': 'DU_AN',
      'Mã Tiêu Chí': 'TT_01',
      'Tên Tiêu Chí KPI': 'Số hóa ngân hàng đề thi trắc nghiệm và ứng dụng GeoGebra / lập trình',
      'Mô Tả Tiêu Chí': 'Xây dựng kho câu hỏi chuẩn ma trận và hướng dẫn HS ứng dụng phần mềm',
      'Điểm Chuẩn': 15,
      'Hệ Số Khó': 1.2,
      'Thứ Tự': 6
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleCriteria);
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 22 }, // Mã Đơn Vị
    { wch: 25 }, // Tên Đơn Vị
    { wch: 28 }, // Phần Đánh Giá
    { wch: 34 }, // Loại Nhiệm Vụ
    { wch: 14 }, // Mã Tiêu Chí
    { wch: 45 }, // Tên Tiêu Chí
    { wch: 55 }, // Mô Tả
    { wch: 12 }, // Điểm Chuẩn
    { wch: 12 }, // Hệ Số Khó
    { wch: 8 },  // Thứ Tự
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'KhungTieuChiKPI');

  // Sheet Hướng dẫn
  const guideData = [
    { 'Thuộc tính': 'Mã Đơn Vị', 'Giá trị hợp lệ': 'ALL (Toàn trường) hoặc mã tổ: TOAN_TIN, NGU_VAN, KHTN, KHXH, NGOAI_NGU, VAN_PHONG' },
    { 'Thuộc tính': 'Phần Đánh Giá', 'Giá trị hợp lệ': 'MUC_I (Mục I - Thang 30đ) hoặc MUC_II (Mục II - Thang 70đ quy đổi)' },
    { 'Thuộc tính': 'Loại Nhiệm Vụ', 'Giá trị hợp lệ': 'CO_DINH (Cố định), DOT_XUAT (Đột xuất), DU_AN (Dài hạn/Dự án)' },
    { 'Thuộc tính': 'Điểm Chuẩn', 'Giá trị hợp lệ': 'Số nguyên hoặc số thập phân (VD: 10, 15)' },
    { 'Thuộc tính': 'Hệ Số Khó', 'Giá trị hợp lệ': 'Số thập phân (VD: 1.0, 1.1, 1.2, 1.5)' },
  ];
  const wsGuide = XLSX.utils.json_to_sheet(guideData);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'HuongDanQuyUoc');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Đọc file Excel tải lên và parse thành danh sách tiêu chí KPI
 */
export function parseKpiCriteriaExcel(buffer: Buffer): KpiCriteriaImportRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(ws);

  const parsedCriteria: KpiCriteriaImportRow[] = [];

  for (const row of rawRows) {
    const name = String(row['Tên Tiêu Chí KPI'] || row['name'] || row['Ten_Tieu_Chi'] || '').trim();
    if (!name) continue;

    // Xác định phần Mục I hay Mục II
    const rawSection = String(row['Phần Đánh Giá (MUC_I/MUC_II)'] || row['Phần'] || row['section'] || 'MUC_II').toUpperCase();
    const section: 'SECTION_I' | 'SECTION_II' = (rawSection.includes('I') && !rawSection.includes('II')) ? 'SECTION_I' : 'SECTION_II';

    // Xác định loại nhiệm vụ
    const rawCat = String(row['Loại Nhiệm Vụ (CO_DINH/DOT_XUAT/DU_AN)'] || row['Loại'] || row['category'] || 'CO_DINH').toUpperCase();
    let category: 'FIXED' | 'EMERGING' | 'PROJECT' = 'FIXED';
    if (rawCat.includes('DOT_XUAT') || rawCat.includes('EMERGING')) category = 'EMERGING';
    else if (rawCat.includes('DU_AN') || rawCat.includes('PROJECT')) category = 'PROJECT';

    const deptCode = String(row['Mã Đơn Vị (ALL/Mã Tổ)'] || row['departmentCode'] || 'ALL').trim().toUpperCase();
    const deptName = String(row['Tên Đơn Vị'] || row['departmentName'] || '').trim();
    const code = String(row['Mã Tiêu Chí'] || row['code'] || `TC_${Date.now()}`).trim();
    const description = String(row['Mô Tả Tiêu Chí'] || row['description'] || '').trim();
    const standardScore = Number(row['Điểm Chuẩn'] || row['standardScore'] || (section === 'SECTION_I' ? 10 : 15));
    const difficultyCoefficient = Number(row['Hệ Số Khó'] || row['difficultyCoefficient'] || 1.0);
    const orderIndex = Number(row['Thứ Tự'] || row['orderIndex'] || parsedCriteria.length + 1);

    parsedCriteria.push({
      departmentCode: deptCode,
      departmentName: deptName,
      section,
      category,
      code,
      name,
      description,
      standardScore: isNaN(standardScore) ? 10 : standardScore,
      difficultyCoefficient: isNaN(difficultyCoefficient) ? 1.0 : difficultyCoefficient,
      orderIndex,
    });
  }

  return parsedCriteria;
}

