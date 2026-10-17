export interface KpiTaskCalculationItem {
  id?: string;
  section: 'SECTION_I' | 'SECTION_II';
  taskCategory: 'FIXED' | 'EMERGING' | 'PROJECT';
  taskName: string;
  standardScore: number;         // Điểm chuẩn (VD: 10, 15)
  difficultyCoefficient: number; // Hệ số khó (VD: 1.0, 1.1, 1.2)
  progressPercent: number;       // % Tiến độ (0 - 100)
  qualityPercent: number;        // % Chất lượng (0 - 120, >100% là vượt yêu cầu)
  isProjectCompleted?: boolean;  // Dành cho nhiệm vụ dài hạn
}

export interface KpiCalculationResult {
  // Điểm Mục I (Thang 30)
  section1Score: number;
  section1MaxScore: number;

  // Điểm Mục II (Thang 70)
  section2RawScore: number;
  section2MaxScore: number;
  section2ConvertedScore: number;

  // Điểm thưởng (Bonus)
  exceededTaskCount: number;
  totalSection2Tasks: number;
  exceededRatio: number;
  bonusScore: number;
  isBonusEligible: boolean;

  // Tổng kết
  totalScore: number;
  grade: 'XUAT_SAC' | 'TOT' | 'HOAN_THANH' | 'CHUA_HOAN_THANH';
  gradeLabel: string;
}

/**
 * Tính điểm thực tế của 1 tiêu chí:
 * Điểm thực tế = Điểm chuẩn × Hệ số khó × (% Tiến độ / 100) × (% Chất lượng / 100)
 */
export function calculateItemScore(
  standardScore: number,
  difficultyCoefficient: number = 1.0,
  progressPercent: number = 100,
  qualityPercent: number = 100
): number {
  const diff = Number(difficultyCoefficient) || 1.0;
  const progress = Math.max(0, Math.min(100, Number(progressPercent) || 0)) / 100;
  const quality = Math.max(0, Math.min(150, Number(qualityPercent) || 0)) / 100;

  const rawScore = Number(standardScore) * diff * progress * quality;
  return Math.round(rawScore * 100) / 100;
}

/**
 * Tính toán toàn bộ bảng KPI theo công thức chuẩn:
 * - Mục I: Thang 30 điểm
 * - Mục II: Quy đổi thang 70 điểm: (Tổng điểm thực tế / Tổng điểm tối đa) × 70
 * - Điểm thưởng: Tỷ lệ nhiệm vụ vượt yêu cầu (Chất lượng > 100%) >= 30% -> Thưởng tối đa 10% điểm Mục II (7 điểm)
 */
export function calculateOverallKpi(
  items: KpiTaskCalculationItem[],
  options?: {
    bonusPercentageCap?: number;    // Mặc định 10% (7 điểm)
    bonusThresholdRatio?: number;   // Mặc định 30% (0.3)
  }
): KpiCalculationResult {
  const bonusCapPercent = options?.bonusPercentageCap ?? 10;
  const bonusThreshold = options?.bonusThresholdRatio ?? 0.30;

  // Lọc tiêu chí theo mục
  const section1Items = items.filter((i) => i.section === 'SECTION_I');
  const section2Items = items.filter((i) => i.section === 'SECTION_II');

  // 1. TÍNH MỤC I (Thang 30)
  let section1Score = 0;
  let section1MaxScore = 0;
  for (const item of section1Items) {
    const itemMax = (item.standardScore || 10) * (item.difficultyCoefficient || 1.0);
    const itemScore = calculateItemScore(
      item.standardScore,
      item.difficultyCoefficient,
      item.progressPercent,
      item.qualityPercent
    );
    section1MaxScore += itemMax;
    section1Score += itemScore;
  }
  // Giới hạn Mục I tối đa 30 điểm
  section1Score = Math.min(30, Math.round(section1Score * 100) / 100);

  // 2. TÍNH MỤC II (Thang 70)
  let section2RawScore = 0;
  let section2MaxScore = 0;
  let exceededTaskCount = 0;

  for (const item of section2Items) {
    const itemMax = (item.standardScore || 10) * (item.difficultyCoefficient || 1.0);
    const itemScore = calculateItemScore(
      item.standardScore,
      item.difficultyCoefficient,
      item.progressPercent,
      item.qualityPercent
    );

    section2MaxScore += itemMax;
    section2RawScore += itemScore;

    // Tiêu chí được coi là "Vượt yêu cầu" khi Tiến độ đạt 100% và Chất lượng > 100%
    if (item.progressPercent >= 100 && item.qualityPercent > 100) {
      exceededTaskCount++;
    }
  }

  // Điểm KPI Mục II quy đổi = (Tổng điểm thực tế các tiêu chí / Tổng điểm tối đa) × 70
  let section2ConvertedScore = 0;
  if (section2MaxScore > 0) {
    section2ConvertedScore = (section2RawScore / section2MaxScore) * 70;
    section2ConvertedScore = Math.round(section2ConvertedScore * 100) / 100;
  }

  // 3. TÍNH ĐIỂM THƯỞNG (BONUS)
  const totalSection2Tasks = section2Items.length;
  const exceededRatio = totalSection2Tasks > 0 ? exceededTaskCount / totalSection2Tasks : 0;
  const isBonusEligible = exceededRatio >= bonusThreshold;

  let bonusScore = 0;
  if (isBonusEligible) {
    // Thưởng theo tỷ lệ vượt nhưng không quá mức trần (10% của 70đ = 7đ)
    const maxBonus = (70 * bonusCapPercent) / 100;
    // Công thức thưởng động: 70 * (tỷ lệ vượt - ngưỡng 30%) hoặc cố định theo trần
    const calculatedBonus = Math.min(maxBonus, (exceededRatio - bonusThreshold + 0.05) * 20);
    bonusScore = Math.round(Math.max(2.0, Math.min(maxBonus, calculatedBonus)) * 100) / 100;
  }

  // 4. TỔNG ĐIỂM & XẾP LOẠI
  const totalScore = Math.round((section1Score + section2ConvertedScore + bonusScore) * 100) / 100;

  let grade: 'XUAT_SAC' | 'TOT' | 'HOAN_THANH' | 'CHUA_HOAN_THANH' = 'CHUA_HOAN_THANH';
  let gradeLabel = 'Chưa hoàn thành';

  if (totalScore >= 90) {
    grade = 'XUAT_SAC';
    gradeLabel = 'Xuất sắc';
  } else if (totalScore >= 75) {
    grade = 'TOT';
    gradeLabel = 'Tốt';
  } else if (totalScore >= 50) {
    grade = 'HOAN_THANH';
    gradeLabel = 'Hoàn thành';
  } else {
    grade = 'CHUA_HOAN_THANH';
    gradeLabel = 'Chưa hoàn thành';
  }

  return {
    section1Score,
    section1MaxScore: Math.round(section1MaxScore * 100) / 100,
    section2RawScore: Math.round(section2RawScore * 100) / 100,
    section2MaxScore: Math.round(section2MaxScore * 100) / 100,
    section2ConvertedScore,
    exceededTaskCount,
    totalSection2Tasks,
    exceededRatio: Math.round(exceededRatio * 100) / 100,
    bonusScore,
    isBonusEligible,
    totalScore,
    grade,
    gradeLabel,
  };
}
