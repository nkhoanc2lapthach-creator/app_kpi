export type UserRole = 'ADMIN' | 'BGH' | 'TO_TRUONG' | 'GIAO_VIEN';

export type SubmissionStatus = 
  | 'DRAFT'           // Đang soạn
  | 'SUBMITTED'       // Đã nộp, chờ Tổ trưởng duyệt
  | 'STEP1_APPROVED'  // Tổ trưởng đã duyệt, chờ BGH duyệt
  | 'STEP2_APPROVED'  // BGH đã chốt phê duyệt
  | 'REJECTED';       // Trả lại yêu cầu sửa

export type KpiGrade = 'XUAT_SAC' | 'TOT' | 'HOAN_THANH' | 'CHUA_HOAN_THANH';

export type TaskCategory = 'FIXED' | 'EMERGING' | 'PROJECT';

export type KpiSection = 'SECTION_I' | 'SECTION_II';

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  headTeacherId?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  isHeadOfDepartment?: boolean;
  concurrentRoles: string[]; // ["Chủ nhiệm 12A1", "Bí thư Đoàn", "Bồi dưỡng HSG"]
  avatarUrl?: string;
}

export interface KpiPeriod {
  id: string;
  academicYear: string; // "2024-2025"
  month: number;        // 1 - 12
  year: number;         // 2024
  name: string;         // "KPI Tháng 10/2024"
  status: 'OPEN' | 'LOCKED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
}

export interface ProofFile {
  fileId: string;
  fileName: string;
  webViewLink: string;
  size: number;
  uploadedAt: string;
  isMock?: boolean;
}

export interface KpiSubmissionItem {
  id: string;
  submissionId?: string;
  frameworkTaskId?: string;
  section: KpiSection;
  taskCategory: TaskCategory;
  taskName: string;
  description?: string;
  standardScore: number;
  difficultyCoefficient: number;
  progressPercent: number; // 0 - 100
  qualityPercent: number;  // 0 - 120
  selfScore: number;
  toTruongScore?: number;
  bghScore?: number;
  isProjectCompleted?: boolean;
  proofFiles: ProofFile[];
  teacherNote?: string;
  toTruongNote?: string;
  bghNote?: string;
  orderIndex?: number;
}

export interface KpiSubmission {
  id: string;
  periodId: string;
  periodName?: string;
  academicYear: string;
  month: number;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  departmentId?: string;
  departmentName?: string;
  concurrentRoles: string[];
  status: SubmissionStatus;

  // Điểm GV tự chấm
  selfScoreSection1: number;
  selfScoreSection2: number;
  selfBonusScore: number;
  selfTotalScore: number;

  // Bước 1: Tổ trưởng chấm
  toTruongScoreSection1?: number;
  toTruongScoreSection2?: number;
  toTruongBonusScore?: number;
  toTruongTotalScore?: number;
  toTruongNote?: string;
  toTruongReviewedBy?: string;
  toTruongReviewedAt?: string;

  // Bước 2: BGH duyệt chốt
  bghScoreSection1?: number;
  bghScoreSection2?: number;
  bghBonusScore?: number;
  bghFinalScore?: number;
  bghNote?: string;
  bghReviewedBy?: string;
  bghReviewedAt?: string;

  finalGrade?: KpiGrade;
  submittedAt?: string;
  items: KpiSubmissionItem[];
}

export interface SchoolSettings {
  id: string;
  schoolName: string;
  academicYear: string;
  currentMonth: number;
  googleDriveFolderId: string;
  bonusPercentageCap: number; // 10%
  bonusThresholdRatio: number; // 30%
}

export interface KpiFrameworkTask {
  id: string;
  academicYear: string;
  departmentId?: string; // 'ALL' hoặc ID của Tổ bộ môn cụ thể
  departmentName?: string;
  section: KpiSection;   // SECTION_I hoặc SECTION_II
  category: TaskCategory; // FIXED, EMERGING, PROJECT
  code: string;
  name: string;
  description?: string;
  standardScore: number;
  difficultyCoefficient: number;
  orderIndex: number;
  isActive: boolean;
}

