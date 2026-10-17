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
