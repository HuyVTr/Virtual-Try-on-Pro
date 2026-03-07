import React, { ChangeEvent, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageUploadProps {
  label: string;
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
  accept?: string;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  image,
  onImageChange,
  accept = "image/png, image/jpeg, image/webp",
  disabled = false
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

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative flex flex-col items-center justify-center w-full h-80 
          border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden
          ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-50 border-slate-300 hover:border-indigo-400'}
          ${image ? 'bg-slate-50 border-solid border-slate-200' : 'bg-white'}
        `}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled}
        />

        {image ? (
          <div className="relative w-full h-full flex items-center justify-center p-2">
            <img
              src={image.previewUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
            />
            <button
              onClick={clearImage}
              className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-red-50 text-slate-600 hover:text-red-500 transition-colors"
              title="Remove image"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-3 px-4 text-center">
            <div className="p-4 bg-slate-100 rounded-full">
              <Upload size={32} className="text-indigo-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-700">Click to upload</p>
              <p className="text-xs text-slate-500">PNG, JPG up to 10MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};