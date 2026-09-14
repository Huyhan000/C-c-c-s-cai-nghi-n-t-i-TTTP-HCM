import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ArrowLeft } from 'lucide-react';
import { LocationImage } from '../../types/campus';

interface LightboxViewerProps {
  images: LocationImage[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
  areaName: string;
}

export const LightboxViewer: React.FC<LightboxViewerProps> = ({
  images,
  currentIndex,
  isOpen,
  onClose,
  onSelectIndex,
  areaName,
}) => {
  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  const handlePrev = () => {
    onSelectIndex(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
  };

  const handleNext = () => {
    onSelectIndex(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length]);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/98 p-3 sm:p-5 backdrop-blur-lg animate-in fade-in isolate select-none"
      onClick={onClose}
    >
      {/* Top bar */}
      <div 
        className="flex w-full max-w-6xl items-center justify-between py-2 text-white shrink-0 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>

          <span className="rounded-full bg-emerald-600/50 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-500/50">
            {areaName}
          </span>
          <span className="text-xs text-slate-300 font-semibold">
            Ảnh {currentIndex + 1} / {images.length}
          </span>
        </div>

        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-rose-600 shadow-lg"
          title="Đóng ảnh (ESC)"
          aria-label="Close lightbox"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div 
        className="relative flex flex-1 items-center justify-center max-w-6xl w-full p-2 min-h-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.image_url}
          alt={currentImage.title || areaName}
          referrerPolicy="no-referrer"
          className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl transition-transform"
        />

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 border border-white/20 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black hover:scale-110 active:scale-95"
              title="Ảnh trước (Mũi tên trái)"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 border border-white/20 text-white shadow-2xl backdrop-blur-md transition-all hover:bg-black hover:scale-110 active:scale-95"
              title="Ảnh sau (Mũi tên phải)"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        )}
      </div>

      {/* Bottom thumbnails strip */}
      {images.length > 1 && (
        <div 
          className="flex max-w-3xl gap-2 overflow-x-auto py-2 px-4 shrink-0 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => onSelectIndex(idx)}
              className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                idx === currentIndex
                  ? 'border-emerald-400 scale-105 ring-2 ring-emerald-400/60 shadow-lg'
                  : 'border-transparent opacity-45 hover:opacity-100'
              }`}
            >
              <img
                src={img.image_url}
                alt=""
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
