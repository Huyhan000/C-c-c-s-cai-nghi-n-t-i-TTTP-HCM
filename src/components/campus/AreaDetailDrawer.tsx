import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Image as ImageIcon, 
  Edit3, 
  Share2, 
  MapPin, 
  Info, 
  User, 
  Layers,
  ArrowLeft,
  RotateCcw,
  Check,
  Building,
  Calendar
} from 'lucide-react';
import { LocationItem, LocationImage, Category, BoardMember } from '../../types/campus';

interface AreaDetailDrawerProps {
  location: LocationItem | null;
  category?: Category;
  images: LocationImage[];
  manager?: BoardMember | null;
  onClose: () => void;
  onOpenAdminEdit: () => void;
  onOpenLightbox: (initialIndex: number) => void;
  isAdmin: boolean;
}

export const AreaDetailDrawer: React.FC<AreaDetailDrawerProps> = ({
  location,
  category,
  images,
  manager,
  onClose,
  onOpenAdminEdit,
  onOpenLightbox,
  isAdmin,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!location) return null;

  const currentImage = images[currentImageIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside 
      className="fixed inset-x-0 bottom-0 z-40 flex h-[78vh] sm:h-[85vh] md:h-full md:relative md:inset-auto md:w-[380px] lg:w-[420px] shrink-0 flex-col rounded-t-3xl md:rounded-none border-t md:border-t-0 md:border-l border-emerald-900/60 bg-[#072421]/98 text-slate-100 shadow-2xl backdrop-blur-md transition-all duration-300"
    >
      {/* Mobile Drawer Grab Handle */}
      <div className="flex justify-center pt-2 pb-1 md:hidden">
        <div className="h-1.5 w-12 rounded-full bg-emerald-700/60" />
      </div>

      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-emerald-950/70 bg-[#051c1a] px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Back to Map Button on Mobile */}
          <button
            onClick={onClose}
            className="flex md:hidden h-8 items-center gap-1 rounded-lg bg-emerald-900/50 px-2 text-xs font-bold text-emerald-300 hover:bg-emerald-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Bản đồ</span>
          </button>

          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white shadow"
            style={{ backgroundColor: category?.color || '#10b981' }}
          >
            {location.display_number}
          </span>

          <span className="rounded-full bg-emerald-950 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-700/60 truncate max-w-[170px]">
            {category?.name || 'Khu chức năng'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Admin Edit Shortcut Button */}
          {isAdmin && (
            <button
              onClick={onOpenAdminEdit}
              className="flex items-center gap-1 rounded-lg border border-emerald-500/50 bg-emerald-600/40 px-2.5 py-1 text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-600 hover:text-white"
              title="Quản trị: Cập nhật ảnh & thông tin khu vực này"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Cập nhật ảnh</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-900/40 hover:text-white"
            title="Đóng chi tiết (Về bản đồ)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Drawer Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title & Category Overview */}
        <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/40 p-3.5">
          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold mb-1">
            <span>PHÂN KHU SỐ {location.display_number}</span>
            <span className="flex items-center gap-1 text-slate-400">
              <MapPin className="h-3 w-3 text-emerald-400" />
              <span>Tọa độ ({Math.round(location.pos_x)}, {Math.round(location.pos_y)})</span>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
            {location.name}
          </h2>
        </div>

        {/* Sub-Images Gallery Section */}
        <div className="space-y-2 rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
              <span>Ảnh thực tế ({images.length} ảnh)</span>
            </span>

            {images.length > 0 && (
              <span className="text-[11px] text-emerald-300 font-bold bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700/50">
                Ảnh {currentImageIndex + 1} / {images.length}
              </span>
            )}
          </div>

          {images.length > 0 ? (
            <div className="space-y-2">
              {/* Primary Image Viewer */}
              <div 
                onClick={() => onOpenLightbox(currentImageIndex)}
                className="group relative aspect-16/9 w-full cursor-pointer overflow-hidden rounded-xl bg-black/60 border border-emerald-800/60 shadow-lg"
              >
                <img
                  src={currentImage.image_url}
                  alt={location.name}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-102"
                />

                {/* Lightbox Trigger Hint */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10.5px] font-bold text-white backdrop-blur-md transition-transform group-hover:scale-105 border border-white/20">
                  <Maximize2 className="h-3 w-3" />
                  <span>Phóng to</span>
                </div>

                {/* Slider Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110"
                      title="Ảnh trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/90 hover:scale-110"
                      title="Ảnh sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails Strip */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`relative h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-emerald-400 ring-2 ring-emerald-400/40 scale-105'
                          : 'border-emerald-900/60 opacity-60 hover:opacity-100'
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
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-800/80 bg-emerald-950/20 p-5 text-center">
              <ImageIcon className="h-8 w-8 text-emerald-700/60 mb-1.5" />
              <p className="text-xs font-semibold text-slate-300">Chưa có ảnh con cho khu vực này</p>
              {isAdmin && (
                <button
                  onClick={onOpenAdminEdit}
                  className="mt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
                >
                  + Tải ảnh lên ngay
                </button>
              )}
            </div>
          )}
        </div>

        {/* Function & Description Section */}
        <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-3.5 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
            <Building className="h-3.5 w-3.5 text-emerald-400" />
            <span>Chức Năng & Nhiệm Vụ Hoạt Động</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
            {location.description || 'Chưa có thông tin mô tả chi tiết chức năng cho khu vực này.'}
          </p>
        </div>

        {/* Technical Specifications (Bento-style Grid) */}
        {location.custom_fields && location.custom_fields.length > 0 && (
          <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-3.5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Thông Số Kỹ Thuật
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {location.custom_fields.map((field, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-emerald-900/40 bg-emerald-950/60 p-2.5"
                >
                  <span className="block text-[10.5px] font-semibold text-emerald-400/90">
                    {field.label}
                  </span>
                  <strong className="block text-xs font-bold text-white mt-0.5">
                    {field.value || '—'}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsible Officer / Manager Card */}
        {manager && (
          <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-3.5 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Cán Bộ Phụ Trách Khu Vực
            </span>
            <div className="flex items-center gap-3 pt-1">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-emerald-200 font-bold border border-emerald-600/50">
                {manager.photo_url ? (
                  <img
                    src={manager.photo_url}
                    alt={manager.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div>
                <strong className="block text-xs font-bold text-white">{manager.name}</strong>
                <span className="text-[11px] text-emerald-300 font-medium">{manager.title || manager.role}</span>
                {manager.department && (
                  <span className="block text-[10px] text-slate-400">{manager.department}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons: Close / Return to map */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-700/60 bg-emerald-950/60 py-2.5 text-xs font-bold text-emerald-200 transition-colors hover:bg-emerald-800/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Quay lại xem toàn cảnh</span>
          </button>
          
          <button
            onClick={handleShare}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-800 bg-emerald-950/50 text-slate-300 hover:text-white"
            title="Sao chép liên kết"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
