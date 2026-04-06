import { useState, useRef, useEffect } from 'react';

const BLUE = '#1a558b';
const BLUE_LIGHT = 'rgba(26,85,139,0.08)';

interface FileUploadProps {
  label: string;
  icon: string;
  accept: string;
  maxSize?: number; // in MB
  required?: boolean;
  value?: File | null;
  onChange: (file: File | null) => void;
  hint?: string;
}

export function FileUpload({ 
  label, 
  icon, 
  accept, 
  maxSize = 5, 
  required = false, 
  value, 
  onChange, 
  hint 
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview when file changes
  useEffect(() => {
    if (value && value.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreview(e.target.result as string);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file for preview');
        setPreview(null);
      };
      reader.readAsDataURL(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handleFileSelect = (file: File | null) => {
    if (file) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreview(e.target.result as string);
          }
        };
        reader.onerror = () => {
          console.error('Error reading file');
          setPreview(null);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
    
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragOver to false if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'picture_as_pdf';
    return 'description';
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-xs font-bold" style={{ color: BLUE }}>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">{icon}</span>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
        </span>
      </label>

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
          dragOver ? 'border-blue-400 bg-blue-50' : 
          value ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
        style={{
          borderColor: dragOver ? '#60a5fa' : value ? BLUE : '#d1d5db',
          backgroundColor: dragOver ? '#eff6ff' : value ? BLUE_LIGHT : '#f9fafb'
        }}
      >
        {/* File Preview or Upload Prompt */}
        {value ? (
          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* Thumbnail or File Icon */}
              <div className="flex-shrink-0">
                {preview ? (
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-500 text-xl">
                      {getFileIcon(value)}
                    </span>
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {value.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(value.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={removeFile}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <span 
              className="material-symbols-outlined text-3xl mb-2 block"
              style={{ color: dragOver ? '#60a5fa' : '#9ca3af' }}
            >
              {dragOver ? 'file_download' : 'upload_file'}
            </span>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              {dragOver ? 'Drop file here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              {hint || `Max ${maxSize}MB`}
            </p>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          required={required}
        />
      </div>

      {/* Hint Text */}
      {hint && !value && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}