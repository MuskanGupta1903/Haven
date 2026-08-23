import React, { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Upload, X, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressAndConvertToBase64 = async (file: File): Promise<string> => {
    try {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp'
      };

      const compressedFile = await imageCompression(file, options);

      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert to base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    } catch (err) {
      console.error('Compression error:', err);
      throw new Error('Failed to process image');
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError('');

    // Check if adding these files would exceed the limit
    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s). Maximum is ${maxImages}.`);
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const fileArray = Array.from(files);
    const invalidFiles = fileArray.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setError('Please upload only JPG, PNG, or WebP images.');
      return;
    }

    // Check file sizes (before compression)
    const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
      setError('Individual files must be smaller than 10MB.');
      return;
    }

    setIsProcessing(true);

    try {
      const newImages = await Promise.all(
        fileArray.map(file => compressAndConvertToBase64(file))
      );

      onChange([...images, ...newImages]);
    } catch (err) {
      console.error('Processing error:', err);
      setError('Failed to process one or more images. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-200">
        Photos <span className="text-ocean-400">(Optional)</span>
        <span className="text-slate-400 font-normal ml-2">
          Max {maxImages} images
        </span>
      </label>

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickUpload}
          className={`
            border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer
            transition-all duration-200
            ${isDragging
              ? 'border-ocean-500 bg-ocean-900/30 scale-[1.01]'
              : 'border-ocean-700/60 hover:border-ocean-400 hover:bg-ocean-900/20'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleInputChange}
            className="hidden"
            disabled={isProcessing}
          />

          {isProcessing ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin h-8 w-8 border-2 border-ocean-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-sm text-slate-400">Processing images...</p>
            </div>
          ) : (
            <>
              <Upload className="mx-auto h-8 w-8 text-ocean-400 mb-2" />
              <p className="text-sm text-slate-300 mb-1">
                <span className="font-semibold text-ocean-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">
                JPG, PNG or WebP (max 10MB per file)
              </p>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-coral-900/30 border border-coral-600/40 rounded-xl">
          <AlertCircle className="w-4 h-4 text-coral-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-coral-300">{error}</p>
        </div>
      )}

      {/* Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={image}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover rounded-2xl border border-white/10"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-coral-600 hover:bg-coral-500 text-white rounded-full p-1
                         opacity-0 group-hover:opacity-100 transition-opacity shadow-lg
                         focus:outline-none focus:ring-2 focus:ring-coral-500"
                aria-label={`Remove image ${index + 1}`}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-lg">
                {index + 1}/{maxImages}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Text */}
      {images.length === 0 && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          Images help rescue teams assess the situation faster
        </p>
      )}
    </div>
  );
};
