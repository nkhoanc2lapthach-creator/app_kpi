-- ====================================================================
-- HỆ THỐNG QUẢN LÝ VÀ ĐÁNH GIÁ KPI GIÁO VIÊN - SCHEMA POSTGRESQL (SUPABASE)
-- Hỗ trợ phân quyền RLS, Workflow 2 bước, Google Drive & Báo cáo
-- ====================================================================

-- 1. BẬT EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TẠO CÁC LOẠI ENUM
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'BGH', 'TO_TRUONG', 'GIAO_VIEN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kpi_section AS ENUM ('SECTION_I', 'SECTION_II');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_category AS ENUM ('FIXED', 'EMERGING', 'PROJECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_status AS ENUM (
        'DRAFT',           -- Đang soạn / Lưu nháp
        'SUBMITTED',       -- Đã nộp, chờ Tổ trưởng duyệt (Bước 1)
        'STEP1_APPROVED',  -- Tổ trưởng đã duyệt, chờ BGH phê duyệt (Bước 2)
        'STEP2_APPROVED',  -- BGH đã phê duyệt chốt điểm
        'REJECTED'         -- Yêu cầu điều chỉnh lại
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE period_status AS ENUM ('OPEN', 'LOCKED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE kpi_grade AS ENUM ('XUAT_SAC', 'TOT', 'HOAN_THANH', 'CHUA_HOAN_THANH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. BẢNG CẤU HÌNH TRƯỜNG HỌC (SCHOOL SETTINGS)
CREATE TABLE IF NOT EXISTS school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name VARCHAR(255) NOT NULL DEFAULT 'Trường THPT Chuyên Chất Lượng Cao',
    academic_year VARCHAR(50) NOT NULL DEFAULT '2024-2025',
    current_month INT NOT NULL DEFAULT 10 CHECK (current_month BETWEEN 1 AND 12),
    google_drive_folder_id VARCHAR(255) DEFAULT '',
    bonus_percentage_cap NUMERIC(5, 2) DEFAULT 10.00, -- Tối đa 10% điểm Mục II (tương đương 7 điểm)
    bonus_threshold_ratio NUMERIC(5, 2) DEFAULT 0.30, -- Tỷ lệ nhiệm vụ vượt yêu cầu >= 30%
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BẢNG TỔ CHUYÊN MÔN / PHÒNG BAN (DEPARTMENTS)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG HỒ SƠ GIÁO VIÊN / NGƯỜI DÙNG (PROFILES)
-- Liên kết với auth.users của Supabase (hoặc chạy độc lập)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Tham chiếu auth.users(id) nếu dùng Supabase Auth
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'GIAO_VIEN',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_head_of_department BOOLEAN DEFAULT FALSE,
    concurrent_roles JSONB DEFAULT '[]'::jsonb, -- VD: ["Chủ nhiệm 12A1", "Bí thư Đoàn", "Bồi dưỡng HSG"]
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm trường trưởng tổ vào departments sau khi có bảng profiles
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS head_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 6. BẢNG KỲ ĐÁNH GIÁ KPI (KPI PERIODS)
CREATE TABLE IF NOT EXISTS kpi_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year VARCHAR(50) NOT NULL DEFAULT '2024-2025',
    month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status period_status DEFAULT 'OPEN',
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_period_month_year UNIQUE (academic_year, month, year)
);

-- 7. BẢNG KHUNG TIÊU CHÍ KPI MẪU (KPI FRAMEWORK TASKS)
CREATE TABLE IF NOT EXISTS kpi_framework_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year VARCHAR(50) NOT NULL DEFAULT '2024-2025',
    section kpi_section NOT NULL, -- SECTION_I (30đ) hoặc SECTION_II (70đ)
    category task_category NOT NULL DEFAULT 'FIXED',
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    standard_score NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
    difficulty_coefficient NUMERIC(4, 2) NOT NULL DEFAULT 1.00, -- Hệ số khó (1.0, 1.2, 1.5...)
    target_roles JSONB DEFAULT '["ALL"]'::jsonb,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BẢNG BÀI NỘP KPI THÁNG (KPI SUBMISSIONS)
CREATE TABLE IF NOT EXISTS kpi_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    status submission_status NOT NULL DEFAULT 'DRAFT',

    -- Điểm Giáo viên tự chấm
    self_score_section_1 NUMERIC(6, 2) DEFAULT 0,
    self_score_section_2 NUMERIC(6, 2) DEFAULT 0,
    self_bonus_score NUMERIC(6, 2) DEFAULT 0,
    self_total_score NUMERIC(6, 2) DEFAULT 0,

    -- Điểm Tổ trưởng duyệt (Bước 1)
    to_truong_score_section_1 NUMERIC(6, 2),
    to_truong_score_section_2 NUMERIC(6, 2),
    to_truong_bonus_score NUMERIC(6, 2),
    to_truong_total_score NUMERIC(6, 2),
    to_truong_note TEXT,
    to_truong_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    to_truong_reviewed_at TIMESTAMPTZ,

    -- Điểm BGH duyệt (Bước 2 - Điểm chốt)
    bgh_score_section_1 NUMERIC(6, 2),
    bgh_score_section_2 NUMERIC(6, 2),
    bgh_bonus_score NUMERIC(6, 2),
    bgh_final_score NUMERIC(6, 2),
    bgh_note TEXT,
    bgh_reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    bgh_reviewed_at TIMESTAMPTZ,

    -- Xếp loại cuối cùng
    final_grade kpi_grade,
    
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_teacher_period UNIQUE (period_id, teacher_id)
);

-- 9. BẢNG CHI TIẾT TIÊU CHÍ BÀI NỘP (KPI SUBMISSION ITEMS)
CREATE TABLE IF NOT EXISTS kpi_submission_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES kpi_submissions(id) ON DELETE CASCADE,
    framework_task_id UUID REFERENCES kpi_framework_tasks(id) ON DELETE SET NULL,
    section kpi_section NOT NULL,
    task_category task_category NOT NULL DEFAULT 'FIXED',
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Thông số tính điểm
    standard_score NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
    difficulty_coefficient NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
    progress_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00, -- % Tiến độ (0 - 100)
    quality_percent NUMERIC(5, 2) NOT NULL DEFAULT 100.00,  -- % Chất lượng (0 - 120, >100% là vượt yêu cầu)
    
    -- Điểm thành phần các cấp chấm
    self_score NUMERIC(6, 2) NOT NULL DEFAULT 0,
    to_truong_score NUMERIC(6, 2),
    bgh_score NUMERIC(6, 2),

    -- Dành riêng cho nhiệm vụ dài hạn
    is_project_completed BOOLEAN DEFAULT FALSE, -- Công tắc "Kết thúc KPI"
    
    -- Danh sách minh chứng tải lên Drive: [{ name, fileId, webViewLink, size, uploadedAt }]
    proof_files JSONB DEFAULT '[]'::jsonb,
    
    teacher_note TEXT,
    to_truong_note TEXT,
    bgh_note TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BẢNG LỊCH SỬ THAO TÁC / DUYỆT (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID REFERENCES kpi_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- 'SUBMIT', 'STEP1_APPROVE', 'STEP2_APPROVE', 'OVERRIDE_SCORE', 'REJECT'
    old_data JSONB,
    new_data JSONB,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_framework_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_submission_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Hàm tiện ích kiểm tra vai trò người dùng hiện tại
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
    SELECT role FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_profile_id()
RETURNS UUID AS $$
    SELECT id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_department_id()
RETURNS UUID AS $$
    SELECT department_id FROM profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Chính sách đọc công khai / nội bộ
CREATE POLICY "Public Read School Settings" ON school_settings FOR SELECT USING (true);
CREATE POLICY "Admin All School Settings" ON school_settings FOR ALL USING (get_my_role() = 'ADMIN');

CREATE POLICY "Public Read Departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Admin Manage Departments" ON departments FOR ALL USING (get_my_role() = 'ADMIN');

CREATE POLICY "Read Profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Self/Admin Update Profiles" ON profiles FOR UPDATE USING (
    id = get_my_profile_id() OR get_my_role() = 'ADMIN'
);
CREATE POLICY "Admin Insert Profiles" ON profiles FOR INSERT WITH CHECK (get_my_role() = 'ADMIN');

CREATE POLICY "Read Periods" ON kpi_periods FOR SELECT USING (true);
CREATE POLICY "Admin Manage Periods" ON kpi_periods FOR ALL USING (get_my_role() IN ('ADMIN', 'BGH'));

CREATE POLICY "Read Framework Tasks" ON kpi_framework_tasks FOR SELECT USING (true);
CREATE POLICY "Admin Manage Framework Tasks" ON kpi_framework_tasks FOR ALL USING (get_my_role() IN ('ADMIN', 'BGH'));

-- Chính sách cho Submissions:
-- - Giáo viên: xem và sửa bài của mình khi chưa bị khóa
-- - Tổ trưởng: xem và sửa bài của thành viên trong tổ mình
-- - BGH & Admin: toàn quyền xem và phê duyệt toàn trường
CREATE POLICY "Teacher View Own Submissions" ON kpi_submissions FOR SELECT USING (
    teacher_id = get_my_profile_id() 
    OR (get_my_role() = 'TO_TRUONG' AND department_id = get_my_department_id())
    OR get_my_role() IN ('BGH', 'ADMIN')
);

CREATE POLICY "Teacher Edit Own Submissions" ON kpi_submissions FOR ALL USING (
    teacher_id = get_my_profile_id()
    OR (get_my_role() = 'TO_TRUONG' AND department_id = get_my_department_id())
    OR get_my_role() IN ('BGH', 'ADMIN')
);

CREATE POLICY "Submission Items Access" ON kpi_submission_items FOR ALL USING (
    EXISTS (
        SELECT 1 FROM kpi_submissions s
        WHERE s.id = kpi_submission_items.submission_id
        AND (
            s.teacher_id = get_my_profile_id()
            OR (get_my_role() = 'TO_TRUONG' AND s.department_id = get_my_department_id())
            OR get_my_role() IN ('BGH', 'ADMIN')
        )
    )
);

CREATE POLICY "Read Audit Logs" ON audit_logs FOR SELECT USING (
    get_my_role() IN ('ADMIN', 'BGH', 'TO_TRUONG')
);
CREATE POLICY "Insert Audit Logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- ====================================================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- ====================================================================

-- 1. Cài đặt trường
INSERT INTO school_settings (school_name, academic_year, current_month, bonus_percentage_cap, bonus_threshold_ratio)
VALUES ('Trường THPT Chuyên Nguyễn Trãi', '2024-2025', 10, 10.00, 0.30)
ON CONFLICT DO NOTHING;

-- 2. Tổ bộ môn
INSERT INTO departments (code, name, description) VALUES
('TOAN_TIN', 'Tổ Toán - Tin học', 'Giảng dạy môn Toán và Tin học các khối 10, 11, 12'),
('NGU_VAN', 'Tổ Ngữ Văn', 'Giảng dạy môn Ngữ văn và Văn học địa phương'),
('KHTN', 'Tổ Khoa học Tự nhiên', 'Vật lý, Hóa học, Sinh học'),
('KHXH', 'Tổ Khoa học Xã hội', 'Lịch sử, Địa lý, GDCD - Kinh tế & Pháp luật'),
('NGOAI_NGU', 'Tổ Ngoại Ngữ', 'Tiếng Anh và Tiếng Pháp'),
('VAN_PHONG', 'Tổ Văn Phòng - Gián tiếp', 'Kế toán, Văn thư, Y tế, Thư viện, Thiết bị')
ON CONFLICT (code) DO NOTHING;

-- 3. Khung KPI chuẩn Mục I (30 điểm - Đạo đức, Kỷ luật, Thực hiện quy chế)
INSERT INTO kpi_framework_tasks (academic_year, section, category, code, name, description, standard_score, difficulty_coefficient, order_index) VALUES
('2024-2025', 'SECTION_I', 'FIXED', 'DD_01', 'Chấp hành chủ trương, đường lối, pháp luật và đạo đức nhà giáo', 'Tuyệt đối trung thành, không vi phạm đạo đức nhà giáo, gương mẫu trước học sinh', 10.00, 1.00, 1),
('2024-2025', 'SECTION_I', 'FIXED', 'DD_02', 'Thực hiện quy chế chuyên môn, nền nếp kỷ luật lao động', 'Đúng giờ lên lớp, hồ sơ giáo án đầy đủ đúng thời hạn, không bỏ tiết, cắt xén chương trình', 10.00, 1.00, 2),
('2024-2025', 'SECTION_I', 'FIXED', 'DD_03', 'Tinh thần đoàn kết, xây dựng tập thể, phối hợp công tác', 'Tích cực tham gia hoạt động đoàn thể, hỗ trợ đồng nghiệp, ứng xử chuẩn mực', 10.00, 1.00, 3);

-- 4. Khung KPI chuẩn Mục II (70 điểm - Chuyên môn & Kiêm nhiệm)
INSERT INTO kpi_framework_tasks (academic_year, section, category, code, name, description, standard_score, difficulty_coefficient, order_index) VALUES
('2024-2025', 'SECTION_II', 'FIXED', 'CM_01', 'Chất lượng soạn giáo án và đổi mới phương pháp giảng dạy', 'Thiết kế bài dạy theo định hướng phát triển năng lực, ứng dụng CNTT, đồ dùng trực quan', 15.00, 1.00, 1),
('2024-2025', 'SECTION_II', 'FIXED', 'CM_02', 'Thực hiện giờ dạy trên lớp và kiểm tra đánh giá học sinh', 'Đảm bảo chuẩn kiến thức kỹ năng, chấm chữa bài kịp thời, nhập điểm đúng hạn hệ thống', 15.00, 1.00, 2),
('2024-2025', 'SECTION_II', 'FIXED', 'CM_03', 'Công tác chủ nhiệm lớp / Quản lý học sinh nền nếp', 'Nắm bắt tâm lý học sinh, liên hệ PHHS chặt chẽ, duy trì sĩ số và xếp loại thi đua lớp tốt', 15.00, 1.10, 3),
('2024-2025', 'SECTION_II', 'FIXED', 'CM_04', 'Bồi dưỡng học sinh giỏi / Phụ đạo học sinh yếu kém', 'Lập kế hoạch giảng dạy chuyên đề, tổ chức ôn tập hiệu quả, nâng cao chất lượng mũi nhọn', 15.00, 1.20, 4),
('2024-2025', 'SECTION_II', 'FIXED', 'CM_05', 'Nghiên cứu khoa học, viết sáng kiến kinh nghiệm & sinh hoạt chuyên môn', 'Tham gia thảo luận chuyên đề tổ, thao giảng dự giờ, đóng góp bài giảng điện tử', 10.00, 1.00, 5);

-- 5. Kỳ đánh giá mẫu tháng 10/2024
INSERT INTO kpi_periods (academic_year, month, year, name, status, start_date, end_date)
VALUES ('2024-2025', 10, 2024, 'Đánh giá KPI Tháng 10/2024', 'OPEN', '2024-10-01', '2024-10-31')
ON CONFLICT (academic_year, month, year) DO NOTHING;
