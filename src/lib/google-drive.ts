import { google } from 'googleapis';
import { Readable } from 'stream';

// Cấu hình thông tin kết nối Google Service Account
export interface GoogleDriveConfig {
  clientEmail?: string;
  privateKey?: string;
  rootFolderId?: string;
  serviceAccountJson?: string;
}

export interface UploadProofParams {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  academicYear: string;   // VD: "2024-2025"
  month: number;          // VD: 10
  departmentName: string; // VD: "To_Toan_Tin"
  teacherName: string;    // VD: "Nguyen_Van_A"
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  size: number;
  uploadedAt: string;
  isMock?: boolean;
}

/**
 * Chuẩn hóa tên thư mục Google Drive: loại bỏ ký tự cấm, thay khoảng trắng
 */
export function sanitizeFolderName(input: string): string {
  if (!input) return 'Chung';
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt nếu cần cho tên thư mục sạch
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Khởi tạo client Google Drive API từ biến môi trường
 */
export function getGoogleDriveClient() {
  const jsonKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (privateKey) {
    // Xử lý xuống dòng trong Private Key nếu lưu trong file .env
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  let auth;

  if (jsonKey) {
    try {
      const credentials = JSON.parse(jsonKey);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
    } catch {
      console.warn('Lỗi parse GOOGLE_SERVICE_ACCOUNT_KEY_JSON, thử dùng email/privateKey...');
    }
  }

  if (!auth && clientEmail && privateKey) {
    auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });
  }

  if (!auth) {
    return null;
  }

  return google.drive({ version: 'v3', auth });
}

/**
 * Tìm hoặc tạo thư mục con trên Google Drive
 */
async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed = false`;

  const searchRes = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (searchRes.data.files && searchRes.data.files.length > 0) {
    return searchRes.data.files[0].id!;
  }

  // Nếu chưa có thì tạo mới
  const createRes = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id, name',
    supportsAllDrives: true,
  });

  if (!createRes.data.id) {
    throw new Error(`Không thể tạo thư mục '${folderName}' trên Google Drive`);
  }

  return createRes.data.id;
}

/**
 * Tạo cây thư mục tự động: [Nam_Hoc]/[Thang_XX]/[Ten_To]/[Ho_Ten_GV]
 */
export async function getOrCreateTeacherFolderTree(
  drive: ReturnType<typeof google.drive>,
  rootFolderId: string,
  academicYear: string,
  month: number,
  departmentName: string,
  teacherName: string
): Promise<string> {
  const cleanYear = sanitizeFolderName(academicYear || '2024-2025');
  const monthStr = `Thang_${String(month).padStart(2, '0')}`;
  const cleanDept = sanitizeFolderName(departmentName || 'To_Chuyen_Mon');
  const cleanTeacher = sanitizeFolderName(teacherName || 'Giao_Vien');

  // Cấp 1: Năm học
  const yearFolderId = await findOrCreateFolder(drive, cleanYear, rootFolderId);
  // Cấp 2: Tháng
  const monthFolderId = await findOrCreateFolder(drive, monthStr, yearFolderId);
  // Cấp 3: Tổ chuyên môn
  const deptFolderId = await findOrCreateFolder(drive, cleanDept, monthFolderId);
  // Cấp 4: Thư mục riêng của Giáo viên
  const teacherFolderId = await findOrCreateFolder(drive, cleanTeacher, deptFolderId);

  return teacherFolderId;
}

/**
 * Tải file minh chứng lên Google Drive và trả về đường dẫn xem trực tiếp
 */
export async function uploadProofFileToDrive(params: UploadProofParams): Promise<UploadResult> {
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const drive = getGoogleDriveClient();

  // Chế độ mô phỏng nếu chưa cấu hình Service Account Drive (Dành cho Dev / Demo)
  if (!drive || !rootFolderId) {
    console.warn('⚠️ Google Drive chưa được cấu hình. Sử dụng chế độ lưu minh chứng demo.');
    const mockId = `demo_file_${Date.now()}`;
    return {
      fileId: mockId,
      fileName: params.filename,
      webViewLink: `https://drive.google.com/file/d/${mockId}/view?usp=sharing`,
      size: params.buffer.length,
      uploadedAt: new Date().toISOString(),
      isMock: true,
    };
  }

  try {
    // 1. Tạo hoặc lấy ID thư mục giáo viên theo cấu trúc cây
    const targetFolderId = await getOrCreateTeacherFolderTree(
      drive,
      rootFolderId,
      params.academicYear,
      params.month,
      params.departmentName,
      params.teacherName
    );

    // 2. Chuyển buffer thành readable stream
    const stream = new Readable();
    stream.push(params.buffer);
    stream.push(null);

    // 3. Upload file lên Drive
    const fileRes = await drive.files.create({
      requestBody: {
        name: `${Date.now()}_${params.filename}`,
        parents: [targetFolderId],
      },
      media: {
        mimeType: params.mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink, webContentLink, size',
      supportsAllDrives: true,
    });

    const fileId = fileRes.data.id;
    if (!fileId) {
      throw new Error('Upload file lên Drive thất bại, không nhận được fileId');
    }

    // 4. Chia sẻ quyền xem công khai (Anyone with link can view) để người duyệt xem trực tiếp
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
    } catch (permError) {
      console.warn('Lưu ý: Không thể cấp quyền xem công khai qua API (có thể do chính sách Workspace):', permError);
    }

    const webViewLink = fileRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;

    return {
      fileId,
      fileName: fileRes.data.name || params.filename,
      webViewLink,
      size: Number(fileRes.data.size || params.buffer.length),
      uploadedAt: new Date().toISOString(),
      isMock: false,
    };
  } catch (error: any) {
    console.error('Lỗi khi upload lên Google Drive:', error);
    throw new Error(`Google Drive Upload Error: ${error.message || 'Lỗi không xác định'}`);
  }
}
