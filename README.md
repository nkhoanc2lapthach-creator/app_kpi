# 🎓 HỆ THỐNG WEB APP QUẢN LÝ VÀ ĐÁNH GIÁ KPI GIÁO VIÊN
> **Giải pháp Self-Hosted / Open-Source tối ưu cho các trường học từ Mầm non đến THPT, CĐ/ĐH. Hỗ trợ quy trình phê duyệt 2 bước, tự động hóa lưu trữ minh chứng lên Google Drive và triển khai 1-Click lên Vercel.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Fapp_kpi)

---

## 📌 1. TỔNG QUAN TÍNH NĂNG NỔI BẬT

### 🚀 Giao diện Mobile-First & Thao tác kéo-thả
- **Dành cho Giáo viên (Mobile/Tablet/PC):** Giao diện dạng thẻ (Cards) trực quan, có thanh kéo trượt % Tiến độ và % Chất lượng hoàn thành.
- **Tải minh chứng 1 chạm:** Chụp ảnh hoặc chọn file PDF từ điện thoại/máy tính, hệ thống tự động đẩy lên Google Drive trung tâm theo đúng cấu trúc cây thư mục cá nhân.
- **Nhiệm vụ đa dạng:** 
  1. *Cố định / Thường xuyên:* Tự động lặp lại hàng tháng.
  2. *Đột xuất / Phát sinh:* Nút bấm `+ Thêm nhiệm vụ phát sinh` giúp GV linh hoạt kê khai việc đột xuất được giao.
  3. *Dài hạn / Dự án:* Công tắc *"Kết thúc KPI"* khi nghiệm thu xong để chốt điểm và không lặp lại ở các tháng sau.

### ⚖️ Công thức tính điểm KPI & Thưởng tự động (Thang 100 điểm)
- **Mục I (30 điểm):** Đạo đức, tư tưởng, kỷ luật lao động và nền nếp chuyên môn.
- **Mục II (70 điểm quy đổi):** Chuyên môn, giảng dạy và các nhiệm vụ kiêm nhiệm (Chủ nhiệm, Bí thư Đoàn, Bồi dưỡng HSG...).
  $$\text{Điểm Tiêu chí} = \text{Điểm chuẩn} \times \text{Hệ số khó} \times \% \text{Tiến độ} \times \% \text{Chất lượng}$$
  $$\text{Điểm Mục II quy đổi} = \frac{\sum \text{Điểm thực tế}}{\sum \text{Điểm tối đa}} \times 70$$
- **Điểm Thưởng (Bonus):** Tự động kích hoạt khi tỷ lệ nhiệm vụ đạt *"Vượt yêu cầu"* ($\text{Chất lượng} > 100\%$) $\ge 30\%$ tổng số nhiệm vụ (thưởng tối đa $10\%$ điểm Mục II = 7 điểm).

### 👥 Quy trình phê duyệt 2 bước chuẩn mực
1. **Bước 1 (Tổ trưởng chuyên môn):** Duyệt và chấm điểm các thành viên trong Tổ của mình, xem trực tiếp minh chứng trên Drive, điều chỉnh điểm số/ghi chú lý do, chuyển BGH.
2. **Bước 2 (Ban Giám Hiệu):** Xem bảng làm việc toàn trường, so sánh trực quan (Side-by-side: Điểm GV vs Điểm Tổ trưởng vs Điểm BGH), sửa trực tiếp ô điểm và phê duyệt chốt sổ tháng.
3. **Admin:** Quản trị cấu hình trường, thêm giáo viên hoặc **Import danh sách nhân sự từ file Excel mẫu**, cấu hình Folder Drive gốc, khóa sổ KPI.

---

## 📂 2. CẤU TRÚC THƯ MỤC GOOGLE DRIVE TỰ ĐỘNG
Khi giáo viên tải minh chứng, Google Drive API sẽ tự động tìm hoặc khởi tạo cây thư mục chuẩn:

```text
📁 [GOOGLE_DRIVE_ROOT_FOLDER] (Thư mục trung tâm của trường)
  └── 📁 2024-2025 (Năm học)
      └── 📁 Thang_10 (Kỳ đánh giá tháng)
          └── 📁 To_Toan_Tin (Tổ chuyên môn)
              └── 📁 Nguyen_Van_An (Thư mục riêng của Giáo viên)
                  ├── 📄 1729210000_GiaoAn_STEM.pdf
                  └── 🖼️ 1729210500_BienBan_HopPHHS.jpg
```
*Người duyệt bấm "Xem minh chứng" sẽ mở trực tiếp trên Google Drive mà không cần tải file về máy.*

---

## 🛠️ 3. STACK CÔNG NGHỆ BẮT BUỘC
- **Framework:** Next.js 14 (App Router), TypeScript.
- **Styling & UI:** TailwindCSS, Shadcn UI / Radix primitives, Lucide Icons.
- **Database & RLS:** Supabase (PostgreSQL) với đầy đủ chính sách bảo mật Row Level Security.
- **Lưu trữ Cloud:** Google Drive API v3 (Google Service Account).
- **Xử lý Excel:** SheetJS (`xlsx`) - Import danh sách nhân sự & Export báo cáo tổng hợp.

---

## 🚀 4. HƯỚNG DẪN CÀI ĐẶT & DEPLOY LÊN VERCEL (1-CLICK)

### Bước 1: Khởi tạo Cơ sở dữ liệu Supabase
1. Truy cập [Supabase.com](https://supabase.com) và tạo một Project mới (miễn phí).
2. Vào mục **SQL Editor** trong thanh menu bên trái.
3. Mở file [schema.sql](file:///d:/app_kpi/schema.sql) trong mã nguồn dự án này, copy toàn bộ nội dung và dán vào SQL Editor của Supabase rồi bấm **Run**.
4. Vào **Project Settings -> API** để lấy:
   - `Project URL` (tương ứng `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (tương ứng `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role secret` key (tương ứng `SUPABASE_SERVICE_ROLE_KEY`)

### Bước 2: Tạo Google Cloud Service Account & Lấy Folder ID
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Tạo một Project mới (ví dụ: `kpi-school-drive`).
3. Vào **APIs & Services -> Library**, tìm kiếm **Google Drive API** và bấm **Enable**.
4. Vào **APIs & Services -> Credentials -> Create Credentials -> Service Account**:
   - Đặt tên (ví dụ: `drive-kpi-uploader`).
   - Sau khi tạo xong, bấm vào Service Account vừa tạo -> chọn tab **Keys -> Add Key -> Create new key -> Chọn JSON -> Bấm Create** để tải file JSON về máy.
5. Mở Google Drive cá nhân hoặc Workspace của Nhà trường:
   - Tạo 1 thư mục gốc (ví dụ: `KPI_MINH_CHUNG_NHA_TRUONG`).
   - Chuột phải vào thư mục -> **Chia sẻ (Share)** -> Dán địa chỉ email của Service Account (dạng `...@...iam.gserviceaccount.com`) vào và cấp quyền **Người chỉnh sửa (Editor)**.
   - Copy **Folder ID** từ thanh địa chỉ trình duyệt:
     `https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up0I` $\rightarrow$ ID là `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up0I`.

### Bước 3: Deploy lên Vercel
1. Đẩy mã nguồn lên tài khoản GitHub của trường bạn:
   ```bash
   git add .
   git commit -m "Initial Teacher KPI Web App"
   git branch -M main
   git remote add origin https://github.com/your-username/app_kpi.git
   git push -u origin main
   ```
2. Truy cập [Vercel.com](https://vercel.com) -> Bấm **Add New Project** -> Chọn Repository vừa đẩy.
3. Trong phần **Environment Variables**, điền các biến môi trường sau:

| Tên biến môi trường | Mô tả | Giá trị mẫu |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL dự án Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Anon key của Supabase | `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Service Role key | `eyJh...` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email Service Account Google | `kpi-drive@project.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` | Khóa bảo mật Private Key (từ file JSON) | `"-----BEGIN PRIVATE KEY-----\nMIIEvgI..."` |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | ID Thư mục Drive gốc đã chia sẻ | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OIvE2up0I` |

4. Bấm **Deploy**. Vercel sẽ tự động build và cấp tên miền miễn phí (dạng `https://app-kpi-xxx.vercel.app`).

---

## 💻 5. CHẠY TRÊN MÁY TÍNH CÁ NHÂN (LOCAL DEVELOPMENT)

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
2. **Cấu hình file môi trường:**
   Tạo file `.env.local` dựa trên file mẫu `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   *(Lưu ý: Nếu chưa cấu hình Google Drive hoặc Supabase, hệ thống sẽ tự động bật chế độ Demo/Mock in-memory có sẵn dữ liệu giáo viên mẫu để bạn trải nghiệm ngay lập tức).*
3. **Khởi chạy ứng dụng:**
   ```bash
   npm run dev
   ```
   Mở trình duyệt tại địa chỉ: [http://localhost:3000](http://localhost:3000)

---

## 📊 6. QUẢN LÝ NHÂN SỰ & IMPORT EXCEL

Hệ thống cung cấp sẵn file mẫu chuẩn:
- Tải trực tiếp tại: [public/template_teachers.xlsx](file:///d:/app_kpi/public/template_teachers.xlsx) hoặc qua nút **"Tải Mẫu Excel"** trong trang Quản trị (`/admin`).
- Các cột chuẩn trong file:
  1. `STT`
  2. `Họ và Tên`
  3. `Email` (dùng làm tài khoản đăng nhập)
  4. `Số Điện Thoại`
  5. `Mã Tổ` (`TOAN_TIN`, `NGU_VAN`, `KHTN`, `KHXH`, `NGOAI_NGU`, `VAN_PHONG`, `BGH`)
  6. `Tên Tổ`
  7. `Vai Trò` (`GIAO_VIEN`, `TO_TRUONG`, `BGH`, `ADMIN`)
  8. `Nhiệm Vụ Kiêm Nhiệm` (phân tách bằng dấu phẩy: `Chủ nhiệm 12A1, Bồi dưỡng HSG`)
  9. `Ghi Chú`

---

## 🛡️ 7. BẢN QUYỀN VÀ ĐÓNG GÓP
- Mã nguồn phát hành dưới giấy phép mã nguồn mở **MIT License**.
- Các trường học có thể tự do sao chép, tùy chỉnh giao diện và cấu hình tiêu chí cho phù hợp với đặc thù của địa phương.
