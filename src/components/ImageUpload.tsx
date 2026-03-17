import React, { ChangeEvent, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploadProps {
  label: string;
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
  accept?: string;
  disabled?: boolean;
  uploadHint?: string;
  uploadLimit?: string;
  removeText?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  image,
  onImageChange,
  accept = "image/png, image/jpeg, image/webp",
  disabled = false,
  uploadHint = "Click to upload",
  uploadLimit = "PNG, JPG up to 10MB",
  removeText = "Remove image"
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/xxx;base64, prefix)
      const base64 = result.split(',')[1];
      const mimeType = file.type;

      onImageChange({
        file,
        previewUrl: result,
        base64,
        mimeType
      });
    };
    reader.readAsDataURL(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const inputId = useRef(`file-input-${Math.random().toString(36).substr(2, 9)}`).current;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full group">
      <label 
        htmlFor={inputId}
        className="text-xs font-bold uppercase tracking-widest text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
      >
        {label}
      </label>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={image ? `${label} - ${removeText}` : uploadHint}
        className={`
          relative flex flex-col items-center justify-center w-full h-64 sm:h-72 lg:h-80 
          border-2 border-dashed rounded-[2rem] transition-[background-color,border-color,box-shadow,transform] duration-500 cursor-pointer overflow-hidden shadow-sm
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100/10' : 'hover:bg-indigo-500/[0.03] dark:hover:bg-indigo-500/[0.02] border-[var(--glass-border)] hover:border-indigo-500/50 focus-visible:ring-2 focus-visible:ring-indigo-500/50 outline-none'}
          ${image ? 'bg-white/5 dark:bg-black/20 border-solid border-indigo-500/30' : 'bg-white/50 dark:bg-white/[0.02] border-[var(--glass-border)]'}
        `}
      >
        <input
          id={inputId}
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
          aria-hidden="true"
        />

        {image ? (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={image.previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-xl"
            />
            <button
              onClick={clearImage}
              className="absolute top-4 right-4 p-2.5 bg-black/60 dark:bg-black/60 backdrop-blur-md rounded-full shadow-lg hover:bg-red-500 text-white transition-all hover:scale-110 active:scale-90"
              title={removeText}
              aria-label={removeText}
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-500 gap-4 px-4 text-center">
            <div className="p-6 bg-indigo-500/10 rounded-full group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 shadow-sm border border-indigo-500/10">
              <Upload size={36} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-1.5 px-6">
              <p className="text-sm font-bold text-[var(--text-main)] transition-colors">{uploadHint}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em]">{uploadLimit}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};