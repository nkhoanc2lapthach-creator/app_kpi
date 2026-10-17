'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  SchoolSettings, 
  KpiPeriod, 
  KpiSubmission, 
  KpiSubmissionItem,
  Department,
  KpiFrameworkTask 
} from './types';
import { 
  initialSchoolSettings, 
  initialDepartments, 
  initialProfiles, 
  initialPeriod, 
  initialSubmissions,
  initialFrameworkTasks 
} from './mock-data';
import { calculateOverallKpi, calculateItemScore } from './kpi-calculator';

interface KpiContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  allUsers: UserProfile[];
  departments: Department[];
  schoolSettings: SchoolSettings;
  updateSchoolSettings: (settings: Partial<SchoolSettings>) => void;
  period: KpiPeriod;
  updatePeriodStatus: (status: 'OPEN' | 'LOCKED' | 'ARCHIVED') => void;
  submissions: KpiSubmission[];
  getSubmissionByTeacherId: (teacherId: string) => KpiSubmission | undefined;
  saveTeacherDraft: (submission: Partial<KpiSubmission> & { items: KpiSubmissionItem[] }) => void;
  submitTeacherKpi: (submissionId: string) => void;
  reviewStep1ToTruong: (submissionId: string, reviewedItems: KpiSubmissionItem[], note: string) => void;
  reviewStep2Bgh: (submissionId: string, reviewedItems: KpiSubmissionItem[], note: string) => void;
  rejectSubmission: (submissionId: string, reason: string) => void;
  bulkReviewStep1: (submissionIds: string[], note: string) => void;
  bulkReviewStep2: (submissionIds: string[], note: string) => void;
  bulkReject: (submissionIds: string[], reason: string) => void;
  addTeachersFromExcel: (teachers: UserProfile[]) => void;
  addNewTeacher: (teacher: UserProfile) => void;
  removeTeacher: (teacherId: string) => void;

  // Quản lý khung tiêu chí KPI theo đơn vị
  frameworkTasks: KpiFrameworkTask[];
  getCriteriaForDepartment: (departmentId?: string) => KpiFrameworkTask[];
  addFrameworkTask: (task: KpiFrameworkTask) => void;
  updateFrameworkTask: (taskId: string, updates: Partial<KpiFrameworkTask>) => void;
  deleteFrameworkTask: (taskId: string) => void;
  importFrameworkTasks: (tasks: KpiFrameworkTask[]) => void;
  resetFrameworkTasks: (departmentId?: string) => void;

  resetAllData: () => void;
}

const KpiContext = createContext<KpiContextType | undefined>(undefined);

const STORAGE_KEY = 'APP_KPI_STATE_V2';

export function KpiProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(initialProfiles);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialProfiles[3]); // Default Thầy An (GIAO_VIEN)
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(initialSchoolSettings);
  const [period, setPeriod] = useState<KpiPeriod>(initialPeriod);
  const [submissions, setSubmissions] = useState<KpiSubmission[]>(initialSubmissions);
  const [frameworkTasks, setFrameworkTasks] = useState<KpiFrameworkTask[]>(initialFrameworkTasks);

  // Load state từ localStorage khi mở app
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.allUsers) setAllUsers(data.allUsers);
        if (data.currentUser) setCurrentUser(data.currentUser);
        if (data.departments) setDepartments(data.departments);
        if (data.schoolSettings) setSchoolSettings(data.schoolSettings);
        if (data.period) setPeriod(data.period);
        if (data.submissions) setSubmissions(data.submissions);
        if (data.frameworkTasks && data.frameworkTasks.length > 0) {
          setFrameworkTasks(data.frameworkTasks);
        }
      }
    } catch {
      console.warn('Lỗi load state từ localStorage, sử dụng mock ban đầu');
    }
    setIsLoaded(true);
  }, []);

  // Lưu state vào localStorage khi thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        allUsers,
        currentUser,
        departments,
        schoolSettings,
        period,
        submissions,
        frameworkTasks,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      console.warn('Lỗi lưu state vào localStorage');
    }
  }, [allUsers, currentUser, departments, schoolSettings, period, submissions, frameworkTasks, isLoaded]);

  // Cập nhật cài đặt trường
  const updateSchoolSettings = (newSettings: Partial<SchoolSettings>) => {
    setSchoolSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Cập nhật trạng thái kỳ đánh giá (Khóa sổ / Mở lại)
  const updatePeriodStatus = (status: 'OPEN' | 'LOCKED' | 'ARCHIVED') => {
    setPeriod((prev) => ({ ...prev, status }));
  };

  // Lấy danh sách tiêu chí phù hợp với đơn vị (Tổ bộ môn)
  // Ưu tiên tiêu chí riêng của tổ; nếu tổ chưa cấu hình riêng thì dùng tiêu chí mặc định toàn trường ('ALL')
  const getCriteriaForDepartment = (deptId?: string): KpiFrameworkTask[] => {
    if (!deptId || deptId === 'ALL') {
      return frameworkTasks.filter((t) => t.departmentId === 'ALL' && t.isActive);
    }

    const deptTasks = frameworkTasks.filter((t) => t.departmentId === deptId && t.isActive);
    if (deptTasks.length > 0) {
      // Nếu tổ có tiêu chí riêng, kết hợp thêm Mục I chung nếu tổ chưa tự định nghĩa Mục I
      const hasSection1 = deptTasks.some((t) => t.section === 'SECTION_I');
      if (!hasSection1) {
        const defaultSection1 = frameworkTasks.filter((t) => t.departmentId === 'ALL' && t.section === 'SECTION_I' && t.isActive);
        return [...defaultSection1, ...deptTasks];
      }
      return deptTasks;
    }

    // Mặc định trả về tiêu chí toàn trường
    return frameworkTasks.filter((t) => t.departmentId === 'ALL' && t.isActive);
  };

  // Thêm tiêu chí mới
  const addFrameworkTask = (task: KpiFrameworkTask) => {
    setFrameworkTasks((prev) => [...prev, task]);
  };

  // Cập nhật tiêu chí
  const updateFrameworkTask = (taskId: string, updates: Partial<KpiFrameworkTask>) => {
    setFrameworkTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  // Xóa tiêu chí
  const deleteFrameworkTask = (taskId: string) => {
    setFrameworkTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Import danh sách tiêu chí từ Excel
  const importFrameworkTasks = (imported: KpiFrameworkTask[]) => {
    setFrameworkTasks((prev) => {
      // Cập nhật hoặc thêm mới dựa trên mã tiêu chí và mã đơn vị
      const existingKeys = new Set(prev.map((t) => `${t.departmentId}_${t.code}`));
      const newItems = imported.filter((t) => !existingKeys.has(`${t.departmentId}_${t.code}`));
      return [...prev, ...newItems];
    });
  };

  // Khôi phục khung tiêu chí ban đầu cho đơn vị hoặc toàn bộ
  const resetFrameworkTasks = (deptId?: string) => {
    if (!deptId || deptId === 'ALL') {
      setFrameworkTasks(initialFrameworkTasks);
    } else {
      setFrameworkTasks((prev) => {
        const withoutDept = prev.filter((t) => t.departmentId !== deptId);
        const originalDeptTasks = initialFrameworkTasks.filter((t) => t.departmentId === deptId);
        return [...withoutDept, ...originalDeptTasks];
      });
    }
  };

  // Lấy bài nộp theo teacherId
  const getSubmissionByTeacherId = (teacherId: string) => {
    return submissions.find((s) => s.teacherId === teacherId && s.periodId === period.id);
  };

  // Lưu bản nháp KPI của Giáo viên
  const saveTeacherDraft = (data: Partial<KpiSubmission> & { items: KpiSubmissionItem[] }) => {
    setSubmissions((prev) => {
      const existingIndex = prev.findIndex(
        (s) => s.teacherId === currentUser.id && s.periodId === period.id
      );

      // Tính toán lại điểm số tự chấm
      const calcItems = data.items.map((i) => ({
        section: i.section,
        taskCategory: i.taskCategory,
        taskName: i.taskName,
        standardScore: i.standardScore,
        difficultyCoefficient: i.difficultyCoefficient,
        progressPercent: i.progressPercent,
        qualityPercent: i.qualityPercent,
      }));

      const calc = calculateOverallKpi(calcItems, {
        bonusPercentageCap: schoolSettings.bonusPercentageCap,
        bonusThresholdRatio: schoolSettings.bonusThresholdRatio,
      });

      // Cập nhật selfScore cho từng item
      const updatedItems = data.items.map((i) => ({
        ...i,
        selfScore: calculateItemScore(
          i.standardScore,
          i.difficultyCoefficient,
          i.progressPercent,
          i.qualityPercent
        ),
      }));

      const updatedSub: KpiSubmission = {
        id: existingIndex >= 0 ? prev[existingIndex].id : `sub_${currentUser.id}_${period.id}`,
        periodId: period.id,
        periodName: period.name,
        academicYear: period.academicYear,
        month: period.month,
        teacherId: currentUser.id,
        teacherName: currentUser.fullName,
        teacherEmail: currentUser.email,
        departmentId: currentUser.departmentId,
        departmentName: currentUser.departmentName,
        concurrentRoles: currentUser.concurrentRoles || [],
        status: existingIndex >= 0 ? prev[existingIndex].status : 'DRAFT',
        selfScoreSection1: calc.section1Score,
        selfScoreSection2: calc.section2ConvertedScore,
        selfBonusScore: calc.bonusScore,
        selfTotalScore: calc.totalScore,
        items: updatedItems,
        submittedAt: existingIndex >= 0 ? prev[existingIndex].submittedAt : undefined,
      };

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...prev[existingIndex], ...updatedSub };
        return next;
      } else {
        return [...prev, updatedSub];
      }
    });
  };

  // Giáo viên nộp bài KPI chính thức
  const submitTeacherKpi = (submissionId: string) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId || (s.teacherId === currentUser.id && s.periodId === period.id)) {
          return {
            ...s,
            status: 'SUBMITTED',
            submittedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );
  };

  // Bước 1: Tổ trưởng chuyên môn duyệt
  const reviewStep1ToTruong = (
    submissionId: string,
    reviewedItems: KpiSubmissionItem[],
    note: string
  ) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;

        // Tính toán điểm số do Tổ trưởng chấm
        const calcItems = reviewedItems.map((i) => ({
          section: i.section,
          taskCategory: i.taskCategory,
          taskName: i.taskName,
          standardScore: i.standardScore,
          difficultyCoefficient: i.difficultyCoefficient,
          progressPercent: i.progressPercent,
          qualityPercent: i.qualityPercent,
        }));

        const calc = calculateOverallKpi(calcItems, {
          bonusPercentageCap: schoolSettings.bonusPercentageCap,
          bonusThresholdRatio: schoolSettings.bonusThresholdRatio,
        });

        return {
          ...s,
          status: 'STEP1_APPROVED',
          toTruongScoreSection1: calc.section1Score,
          toTruongScoreSection2: calc.section2ConvertedScore,
          toTruongBonusScore: calc.bonusScore,
          toTruongTotalScore: calc.totalScore,
          toTruongNote: note,
          toTruongReviewedBy: currentUser.id,
          toTruongReviewedAt: new Date().toISOString(),
          items: reviewedItems,
        };
      })
    );
  };

  // Bước 2: BGH duyệt chốt toàn trường
  const reviewStep2Bgh = (
    submissionId: string,
    reviewedItems: KpiSubmissionItem[],
    note: string
  ) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== submissionId) return s;

        // Tính điểm chốt BGH
        const calcItems = reviewedItems.map((i) => ({
          section: i.section,
          taskCategory: i.taskCategory,
          taskName: i.taskName,
          standardScore: i.standardScore,
          difficultyCoefficient: i.difficultyCoefficient,
          progressPercent: i.progressPercent,
          qualityPercent: i.qualityPercent,
        }));

        const calc = calculateOverallKpi(calcItems, {
          bonusPercentageCap: schoolSettings.bonusPercentageCap,
          bonusThresholdRatio: schoolSettings.bonusThresholdRatio,
        });

        return {
          ...s,
          status: 'STEP2_APPROVED',
          bghScoreSection1: calc.section1Score,
          bghScoreSection2: calc.section2ConvertedScore,
          bghBonusScore: calc.bonusScore,
          bghFinalScore: calc.totalScore,
          finalGrade: calc.grade,
          bghNote: note,
          bghReviewedBy: currentUser.id,
          bghReviewedAt: new Date().toISOString(),
          items: reviewedItems,
        };
      })
    );
  };

  // Trả lại bài nộp yêu cầu bổ sung minh chứng / điều chỉnh
  const rejectSubmission = (submissionId: string, reason: string) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          return {
            ...s,
            status: 'REJECTED',
            toTruongNote: reason,
          };
        }
        return s;
      })
    );
  };

  // Duyệt hàng loạt Bước 1 (Tổ trưởng)
  const bulkReviewStep1 = (submissionIds: string[], note: string) => {
    const idSet = new Set(submissionIds);
    setSubmissions((prev) =>
      prev.map((s) => {
        if (!idSet.has(s.id)) return s;
        const updatedItems = (s.items || []).map((item) => ({
          ...item,
          toTruongScore: item.toTruongScore ?? item.selfScore,
        }));
        return {
          ...s,
          status: 'STEP1_APPROVED',
          toTruongScoreSection1: s.toTruongScoreSection1 ?? s.selfScoreSection1,
          toTruongScoreSection2: s.toTruongScoreSection2 ?? s.selfScoreSection2,
          toTruongBonusScore: s.toTruongBonusScore ?? s.selfBonusScore,
          toTruongTotalScore: s.toTruongTotalScore ?? s.selfTotalScore,
          toTruongNote: note || 'Tổ trưởng duyệt đồng ý với kết quả tự đánh giá của giáo viên.',
          toTruongReviewedBy: currentUser.id,
          toTruongReviewedAt: new Date().toISOString(),
          items: updatedItems,
        };
      })
    );
  };

  // Duyệt chốt hàng loạt Bước 2 (Ban Giám Hiệu)
  const bulkReviewStep2 = (submissionIds: string[], note: string) => {
    const idSet = new Set(submissionIds);
    setSubmissions((prev) =>
      prev.map((s) => {
        if (!idSet.has(s.id)) return s;
        const finalSec1 = s.toTruongScoreSection1 ?? s.selfScoreSection1;
        const finalSec2 = s.toTruongScoreSection2 ?? s.selfScoreSection2;
        const finalBonus = s.toTruongBonusScore ?? s.selfBonusScore;
        const finalScore = s.toTruongTotalScore ?? s.selfTotalScore;

        let finalGrade: 'XUAT_SAC' | 'TOT' | 'HOAN_THANH' | 'CHUA_HOAN_THANH' = 'CHUA_HOAN_THANH';
        if (finalScore >= 90) finalGrade = 'XUAT_SAC';
        else if (finalScore >= 75) finalGrade = 'TOT';
        else if (finalScore >= 50) finalGrade = 'HOAN_THANH';

        const updatedItems = (s.items || []).map((item) => ({
          ...item,
          bghScore: item.bghScore ?? (item.toTruongScore ?? item.selfScore),
        }));

        return {
          ...s,
          status: 'STEP2_APPROVED',
          bghScoreSection1: finalSec1,
          bghScoreSection2: finalSec2,
          bghBonusScore: finalBonus,
          bghFinalScore: finalScore,
          finalGrade,
          bghNote: note || 'Ban Giám Hiệu phê duyệt chốt kết quả đánh giá KPI.',
          bghReviewedBy: currentUser.id,
          bghReviewedAt: new Date().toISOString(),
          items: updatedItems,
        };
      })
    );
  };

  // Trả lại hàng loạt
  const bulkReject = (submissionIds: string[], reason: string) => {
    const idSet = new Set(submissionIds);
    setSubmissions((prev) =>
      prev.map((s) => {
        if (!idSet.has(s.id)) return s;
        return {
          ...s,
          status: 'REJECTED',
          toTruongNote: reason,
        };
      })
    );
  };

  // Import danh sách giáo viên từ Excel
  const addTeachersFromExcel = (newTeachers: UserProfile[]) => {
    setAllUsers((prev) => {
      const existingEmails = new Set(prev.map((u) => u.email.toLowerCase()));
      const filtered = newTeachers.filter((t) => !existingEmails.has(t.email.toLowerCase()));
      return [...prev, ...filtered];
    });
  };

  // Thêm 1 giáo viên mới
  const addNewTeacher = (teacher: UserProfile) => {
    setAllUsers((prev) => [...prev, teacher]);
  };

  // Xóa giáo viên
  const removeTeacher = (teacherId: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== teacherId));
  };

  // Khôi phục dữ liệu mẫu ban đầu
  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAllUsers(initialProfiles);
    setCurrentUser(initialProfiles[3]);
    setDepartments(initialDepartments);
    setSchoolSettings(initialSchoolSettings);
    setPeriod(initialPeriod);
    setSubmissions(initialSubmissions);
    setFrameworkTasks(initialFrameworkTasks);
  };

  return (
    <KpiContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        allUsers,
        departments,
        schoolSettings,
        updateSchoolSettings,
        period,
        updatePeriodStatus,
        submissions,
        getSubmissionByTeacherId,
        saveTeacherDraft,
        submitTeacherKpi,
        reviewStep1ToTruong,
        reviewStep2Bgh,
        rejectSubmission,
        bulkReviewStep1,
        bulkReviewStep2,
        bulkReject,
        addTeachersFromExcel,
        addNewTeacher,
        removeTeacher,
        frameworkTasks,
        getCriteriaForDepartment,
        addFrameworkTask,
        updateFrameworkTask,
        deleteFrameworkTask,
        importFrameworkTasks,
        resetFrameworkTasks,
        resetAllData,
      }}
    >
      {children}
    </KpiContext.Provider>
  );
}

export function useKpi() {
  const context = useContext(KpiContext);
  if (!context) {
    throw new Error('useKpi phải được sử dụng bên trong KpiProvider');
  }
  return context;
}
