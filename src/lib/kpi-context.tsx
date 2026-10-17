'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  SchoolSettings, 
  KpiPeriod, 
  KpiSubmission, 
  KpiSubmissionItem,
  Department 
} from './types';
import { 
  initialSchoolSettings, 
  initialDepartments, 
  initialProfiles, 
  initialPeriod, 
  initialSubmissions 
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
  addTeachersFromExcel: (teachers: UserProfile[]) => void;
  addNewTeacher: (teacher: UserProfile) => void;
  removeTeacher: (teacherId: string) => void;
  resetAllData: () => void;
}

const KpiContext = createContext<KpiContextType | undefined>(undefined);

const STORAGE_KEY = 'APP_KPI_STATE_V1';

export function KpiProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(initialProfiles);
  const [currentUser, setCurrentUser] = useState<UserProfile>(initialProfiles[3]); // Default Thầy An (GIAO_VIEN)
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings>(initialSchoolSettings);
  const [period, setPeriod] = useState<KpiPeriod>(initialPeriod);
  const [submissions, setSubmissions] = useState<KpiSubmission[]>(initialSubmissions);

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
      }
    } catch (e) {
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
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Lỗi lưu state vào localStorage');
    }
  }, [allUsers, currentUser, departments, schoolSettings, period, submissions, isLoaded]);

  // Cập nhật cài đặt trường
  const updateSchoolSettings = (newSettings: Partial<SchoolSettings>) => {
    setSchoolSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Cập nhật trạng thái kỳ đánh giá (Khóa sổ / Mở lại)
  const updatePeriodStatus = (status: 'OPEN' | 'LOCKED' | 'ARCHIVED') => {
    setPeriod((prev) => ({ ...prev, status }));
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
        addTeachersFromExcel,
        addNewTeacher,
        removeTeacher,
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
