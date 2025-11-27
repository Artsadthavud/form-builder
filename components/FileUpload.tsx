import React, { useState, useRef, useCallback, memo } from 'react';
import { Language } from '../types';

interface FileUploadProps {
  id: string;
  value: File[] | null;
  onChange: (files: File[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  currentLanguage: Language;
  // File configuration
  allowMultiple?: boolean;
  maxFileSize?: number; // in MB
  maxFiles?: number;
  acceptedFileTypes?: string[]; // e.g., ['.pdf', '.doc', '.jpg', 'image/*']
  // UI Options
  showPreview?: boolean;
  compact?: boolean;
}

interface FilePreview {
  file: File;
  preview: string | null;
  progress: number; // 0-100
  error?: string;
}

// File type presets
export const FILE_TYPE_PRESETS = {
  images: {
    label: { th: 'รูปภาพ', en: 'Images' },
    types: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    accept: 'image/*'
  },
  documents: {
    label: { th: 'เอกสาร', en: 'Documents' },
    types: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
  },
  pdf: {
    label: { th: 'PDF', en: 'PDF' },
    types: ['.pdf'],
    accept: '.pdf'
  },
  spreadsheets: {
    label: { th: 'สเปรดชีต', en: 'Spreadsheets' },
    types: ['.xls', '.xlsx', '.csv'],
    accept: '.xls,.xlsx,.csv'
  },
  videos: {
    label: { th: 'วิดีโอ', en: 'Videos' },
    types: ['.mp4', '.webm', '.mov', '.avi'],
    accept: 'video/*'
  },
  audio: {
    label: { th: 'เสียง', en: 'Audio' },
    types: ['.mp3', '.wav', '.ogg', '.m4a'],
    accept: 'audio/*'
  },
  all: {
    label: { th: 'ทุกประเภท', en: 'All Types' },
    types: ['*'],
    accept: '*'
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📕';
  if (type.includes('word') || type.includes('document')) return '📘';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📗';
  if (type.includes('powerpoint') || type.includes('presentation')) return '📙';
  if (type.includes('zip') || type.includes('archive')) return '📦';
  return '📄';
};

const FileUpload: React.FC<FileUploadProps> = memo(({
  id,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  currentLanguage,
  allowMultiple = false,
  maxFileSize = 10, // 10MB default
  maxFiles = 5,
  acceptedFileTypes,
  showPreview = true,
  compact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const texts = {
    dropzone: {
      th: 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก',
      en: 'Drag & drop files here, or click to select'
    },
    dropzoneActive: {
      th: 'วางไฟล์ที่นี่...',
      en: 'Drop files here...'
    },
    maxSize: {
      th: `ขนาดไฟล์สูงสุด: ${maxFileSize} MB`,
      en: `Max file size: ${maxFileSize} MB`
    },
    acceptedTypes: {
      th: 'ประเภทไฟล์ที่รองรับ:',
      en: 'Accepted file types:'
    },
    remove: {
      th: 'ลบ',
      en: 'Remove'
    },
    fileTooLarge: {
      th: `ไฟล์ใหญ่เกิน ${maxFileSize} MB`,
      en: `File exceeds ${maxFileSize} MB limit`
    },
    invalidType: {
      th: 'ประเภทไฟล์ไม่ถูกต้อง',
      en: 'Invalid file type'
    },
    maxFilesReached: {
      th: `เลือกได้สูงสุด ${maxFiles} ไฟล์`,
      en: `Maximum ${maxFiles} files allowed`
    },
    uploading: {
      th: 'กำลังอัปโหลด...',
      en: 'Uploading...'
    }
  };

  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    const maxBytes = maxFileSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return { valid: false, error: texts.fileTooLarge[currentLanguage] };
    }

    // Check file type
    if (acceptedFileTypes && acceptedFileTypes.length > 0 && !acceptedFileTypes.includes('*')) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isValidType = acceptedFileTypes.some(type => {
        if (type.startsWith('.')) {
          return extension === type.toLowerCase();
        }
        if (type.endsWith('/*')) {
          return mimeType.startsWith(type.replace('/*', '/'));
        }
        return mimeType === type;
      });

      if (!isValidType) {
        return { valid: false, error: texts.invalidType[currentLanguage] };
      }
    }

    return { valid: true };
  }, [maxFileSize, acceptedFileTypes, currentLanguage]);

  const createPreview = useCallback((file: File): Promise<FilePreview> => {
    return new Promise((resolve) => {
      const preview: FilePreview = {
        file,
        preview: null,
        progress: 0
      };

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          preview.preview = e.target?.result as string;
          resolve(preview);
        };
        reader.onerror = () => resolve(preview);
        reader.readAsDataURL(file);
      } else {
        resolve(preview);
      }
    });
  }, []);

  const simulateUploadProgress = useCallback((fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(prev => ({ ...prev, [fileId]: Math.min(progress, 100) }));
    }, 200);
    return interval;
  }, []);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentCount = value?.length || 0;
    
    // Check max files limit
    if (currentCount + fileArray.length > maxFiles) {
      alert(texts.maxFilesReached[currentLanguage]);
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: FilePreview[] = [];

    for (const file of fileArray) {
      const validation = validateFile(file);
      const preview = await createPreview(file);
      
      if (!validation.valid) {
        preview.error = validation.error;
      } else {
        validFiles.push(file);
        // Simulate upload progress
        const fileId = `${file.name}-${Date.now()}`;
        simulateUploadProgress(fileId);
      }
      
      newPreviews.push(preview);
    }

    setFilePreviews(prev => [...prev, ...newPreviews]);
    
    if (validFiles.length > 0) {
      const existingFiles = value || [];
      const allFiles = allowMultiple ? [...existingFiles, ...validFiles] : validFiles;
      onChange(allFiles);
    }
  }, [value, maxFiles, allowMultiple, validateFile, createPreview, simulateUploadProgress, onChange, currentLanguage]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    const currentFiles = value || [];
    const newFiles = currentFiles.filter((_, i) => i !== index);
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
    onChange(newFiles);
  }, [value, onChange]);

  const getAcceptString = useCallback(() => {
    if (!acceptedFileTypes || acceptedFileTypes.length === 0) return undefined;
    return acceptedFileTypes.join(',');
  }, [acceptedFileTypes]);

  const renderFilePreview = (preview: FilePreview, index: number) => {
    const progress = uploadProgress[`${preview.file.name}-${index}`] || 100;
    
    return (
      <div 
        key={`${preview.file.name}-${index}`}
        className={`relative flex items-center gap-3 p-3 bg-white rounded-lg border-2 ${
          preview.error ? 'border-red-300 bg-red-50' : 'border-slate-200'
        } transition-all hover:border-indigo-300`}
      >
        {/* Preview thumbnail or icon */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden">
          {preview.preview ? (
            <img 
              src={preview.preview} 
              alt={preview.file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">{getFileIcon(preview.file.type)}</span>
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-700 truncate">
            {preview.file.name}
          </p>
          <p className="text-xs text-slate-500">
            {formatFileSize(preview.file.size)}
          </p>
          {preview.error && (
            <p className="text-xs text-red-600 font-medium mt-1">
              ⚠️ {preview.error}
            </p>
          )}
          
          {/* Progress bar */}
          {progress < 100 && !preview.error && (
            <div className="mt-2">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {Math.round(progress)}% {texts.uploading[currentLanguage]}
              </p>
            </div>
          )}
        </div>

        {/* Remove button */}
        {!disabled && (
          <button
            type="button"
            onClick={() => handleRemoveFile(index)}
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title={texts.remove[currentLanguage]}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        id={id}
        onChange={handleFileSelect}
        multiple={allowMultiple}
        accept={getAcceptString()}
        disabled={disabled}
        className="sr-only"
        aria-label={label}
      />

      {/* Dropzone */}
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-disabled={disabled}
        className={`
          relative border-2 border-dashed rounded-xl transition-all cursor-pointer
          ${compact ? 'p-4' : 'p-6'}
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : disabled 
              ? 'border-slate-200 bg-slate-50 cursor-not-allowed' 
              : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }
        `}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {/* Upload icon */}
          <div className={`
            flex items-center justify-center rounded-full mb-3
            ${compact ? 'w-10 h-10' : 'w-14 h-14'}
            ${isDragging ? 'bg-indigo-100' : 'bg-slate-100'}
          `}>
            <svg 
              className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} ${isDragging ? 'text-indigo-600' : 'text-slate-500'}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {/* Text */}
          <p className={`font-medium ${compact ? 'text-sm' : 'text-base'} ${isDragging ? 'text-indigo-700' : 'text-slate-700'}`}>
            {isDragging ? texts.dropzoneActive[currentLanguage] : texts.dropzone[currentLanguage]}
          </p>
          
          {/* File info */}
          <div className={`mt-2 space-y-1 ${compact ? 'text-[10px]' : 'text-xs'} text-slate-500`}>
            <p>{texts.maxSize[currentLanguage]}</p>
            {acceptedFileTypes && acceptedFileTypes.length > 0 && !acceptedFileTypes.includes('*') && (
              <p>
                {texts.acceptedTypes[currentLanguage]} {acceptedFileTypes.join(', ')}
              </p>
            )}
            {allowMultiple && (
              <p>
                ({currentLanguage === 'th' ? `สูงสุด ${maxFiles} ไฟล์` : `Max ${maxFiles} files`})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* File previews */}
      {showPreview && filePreviews.length > 0 && (
        <div className="space-y-2">
          {filePreviews.map((preview, index) => renderFilePreview(preview, index))}
        </div>
      )}
    </div>
  );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;
