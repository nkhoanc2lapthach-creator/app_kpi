'use client';

import React, { useState, useRef } from 'react';
import { ProofFile } from '@/lib/types';
import { 
  UploadCloud, 
  ExternalLink, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ProofUploadProps {
  proofFiles: ProofFile[];
  onFilesChange: (files: ProofFile[]) => void;
  academicYear: string;
  month: number;
  departmentName: string;
  teacherName: string;
  disabled?: boolean;
}

export function ProofUploadModal({
  proofFiles,
  onFilesChange,
  academicYear,
  month,
  departmentName,
  teacherName,
  disabled = false,
}: ProofUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('academicYear', academicYear);
    formData.append('month', String(month));
    formData.append('departmentName', departmentName);
    formData.append('teacherName', teacherName);

    try {
      const res = await fetch('/api/upload-drive', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload lên Google Drive thất bại');
      }

      const uploaded: ProofFile = {
        fileId: data.file.fileId,
        fileName: data.file.fileName,
        webViewLink: data.file.webViewLink,
        size: data.file.size,
        uploadedAt: data.file.uploadedAt,
        isMock: data.file.isMock,
      };

      onFilesChange([...proofFiles, uploaded]);
      setUploadSuccess(`Đã lưu "${file.name}" vào Drive!`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi khi tải file lên Drive');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    if (disabled) return;
    onFilesChange(proofFiles.filter((f) => f.fileId !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className="flex flex-col gap-2 w-full pt-1">
      {/* Nút Upload */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,application/pdf"
            className="hidden"
            id={`file-upload-${teacherName}`}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                Đang đẩy lên Drive...
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                + Tải minh chứng (Ảnh/PDF)
              </>
            )}
          </button>

          <span className="text-[11px] text-slate-500">
            Tự động lưu vào: <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">{academicYear}/Tháng_{month}/{teacherName}</code>
          </span>
        </div>
      )}

      {/* Thông báo kết quả upload */}
      {uploadSuccess && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {uploadSuccess}
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          {uploadError}
        </div>
      )}

      {/* Danh sách các file minh chứng đã đính kèm */}
      {proofFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {proofFiles.map((f) => {
            const isPdf = f.fileName.toLowerCase().endsWith('.pdf');
            return (
              <div
                key={f.fileId}
                className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs shadow-sm hover:border-indigo-300 transition-colors"
              >
                {isPdf ? (
                  <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
                <div className="flex flex-col max-w-[180px] sm:max-w-[240px]">
                  <span className="font-medium text-slate-800 truncate" title={f.fileName}>
                    {f.fileName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formatFileSize(f.size)}
                  </span>
                </div>

                {/* Link mở Drive */}
                <a
                  href={f.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium ml-1 bg-indigo-50 hover:bg-indigo-100 px-1.5 py-0.5 rounded"
                  title="Mở xem trực tiếp trên Google Drive"
                >
                  Xem <ExternalLink className="w-3 h-3" />
                </a>

                {/* Nút xóa */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(f.fileId)}
                    className="text-slate-400 hover:text-rose-600 p-0.5 rounded"
                    title="Xóa minh chứng"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
