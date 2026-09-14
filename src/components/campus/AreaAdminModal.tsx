import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Star, 
  Plus, 
  Image as ImageIcon, 
  Check, 
  Link as LinkIcon, 
  RefreshCw,
  Save,
  AlertTriangle
} from 'lucide-react';
import { LocationItem, LocationImage, Category } from '../../types/campus';
import { compressImage } from '../../utils/imageCompressor';

interface AreaAdminModalProps {
  location: LocationItem | null;
  categories: Category[];
  images: LocationImage[];
  isOpen: boolean;
  onClose: () => void;
  onAddImage: (locationId: string, imageUrl: string, title?: string) => void;
  onReplaceImage: (imageId: string, newImageUrl: string, newTitle?: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetCoverImage: (locationId: string, imageId: string) => void;
  onUpdateLocation: (locationId: string, updates: Partial<LocationItem>) => void;
}

export const AreaAdminModal: React.FC<AreaAdminModalProps> = ({
  location,
  categories,
  images,
  isOpen,
  onClose,
  onAddImage,
  onReplaceImage,
  onDeleteImage,
  onSetCoverImage,
  onUpdateLocation,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement | null>(null);
  const [replacingImageId, setReplacingImageId] = useState<string | null>(null);

  const [urlInput, setUrlInput] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // In-modal confirm delete state to prevent window.confirm blockers in iframe
  const [confirmDeleteImageId, setConfirmDeleteImageId] = useState<string | null>(null);

  // Replace modal URL dialog
  const [replaceUrlDialogImageId, setReplaceUrlDialogImageId] = useState<string | null>(null);
  const [replaceUrlInput, setReplaceUrlInput] = useState('');

  // Editable fields
  const [name, setName] = useState(location?.name || '');
  const [description, setDescription] = useState(location?.description || '');
  const [categoryId, setCategoryId] = useState(location?.category_id || categories[0]?.id || '');
  const [customFields, setCustomFields] = useState(location?.custom_fields || []);

  // Update internal states when location changes
  React.useEffect(() => {
    if (location) {
      setName(location.name);
      setDescription(location.description || '');
      setCategoryId(location.category_id);
      setCustomFields(location.custom_fields || []);
      setConfirmDeleteImageId(null);
      setReplaceUrlDialogImageId(null);
    }
  }, [location]);

  if (!isOpen || !location) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Handle local image file upload (with automatic compression)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const fileList = Array.from(files) as File[];
      for (const file of fileList) {
        try {
          const compressedDataUrl = await compressImage(file, 1600, 1200, 0.82);
          onAddImage(location.id, compressedDataUrl, file.name.replace(/\.[^/.]+$/, ''));
        } catch {
          // Fallback to normal FileReader if canvas fails
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const result = loadEvt.target?.result as string;
            if (result) {
              onAddImage(location.id, result, file.name.replace(/\.[^/.]+$/, ''));
            }
          };
          reader.readAsDataURL(file);
        }
      }
      showToast(`Đã tải lên và tối ưu hóa ảnh thành công!`);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle replacing an existing image from a local file
  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !replacingImageId) return;

    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file, 1600, 1200, 0.82);
      onReplaceImage(replacingImageId, compressedDataUrl, file.name.replace(/\.[^/.]+$/, ''));
      showToast('Đã thay thế ảnh thành công!');
    } catch {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result && replacingImageId) {
          onReplaceImage(replacingImageId, result, file.name.replace(/\.[^/.]+$/, ''));
          showToast('Đã thay thế ảnh thành công!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
      setReplacingImageId(null);
      if (replaceFileInputRef.current) {
        replaceFileInputRef.current.value = '';
      }
    }
  };

  // Handle replacing an image via URL
  const handleReplaceUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceUrlInput.trim() || !replaceUrlDialogImageId) return;
    onReplaceImage(replaceUrlDialogImageId, replaceUrlInput.trim());
    setReplaceUrlDialogImageId(null);
    setReplaceUrlInput('');
    showToast('Đã thay thế ảnh từ URL thành công!');
  };

  // Trigger replacement file picker
  const triggerReplaceFilePicker = (imageId: string) => {
    setReplacingImageId(imageId);
    if (replaceFileInputRef.current) {
      replaceFileInputRef.current.value = '';
      replaceFileInputRef.current.click();
    }
  };

  // Handle deleting an image directly
  const executeDeleteImage = (imageId: string) => {
    onDeleteImage(imageId);
    setConfirmDeleteImageId(null);
    showToast('Đã xóa ảnh thành công!');
  };

  // Handle URL image addition
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onAddImage(location.id, urlInput.trim(), 'Ảnh đính kèm');
    setUrlInput('');
    setIsAddingUrl(false);
    showToast('Đã thêm ảnh từ liên kết!');
  };

  // Save changes to location details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLocation(location.id, {
      name,
      description,
      category_id: categoryId,
      custom_fields: customFields,
    });
    showToast('Đã lưu thông tin khu vực!');
  };

  // Custom field helpers
  const handleAddField = () => {
    setCustomFields([...customFields, { label: 'Thuộc tính mới', value: '' }]);
  };

  const handleUpdateField = (index: number, key: 'label' | 'value', val: string) => {
    const next = [...customFields];
    next[index][key] = val;
    setCustomFields(next);
  };

  const handleRemoveField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-md animate-in fade-in duration-200 isolate">
      {/* Hidden file input for replacing an existing image */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplaceFile}
        className="hidden"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-emerald-800 bg-[#092b27] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-950/70 bg-[#072421] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 font-bold text-xs text-white">
              {location.display_number != null ? location.display_number : '•'}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Quản Trị Khu Vực & Cập Nhật Ảnh</h3>
              <p className="text-[11px] text-emerald-300/80">Khu vực: {location.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-900/30 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Notification Toast */}
        {successToast && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center gap-2 justify-center transition-all">
            <Check className="h-4 w-4" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Compression / Processing indicator */}
        {isCompressing && (
          <div className="bg-amber-500/20 text-amber-300 border-b border-amber-500/30 px-4 py-1.5 text-xs font-semibold flex items-center gap-2 justify-center">
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            <span>Đang xử lý và tối ưu hóa kích thước ảnh...</span>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Manage Sub-Images (Quyền Admin Cập Nhật Ảnh) */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  <span>Quản Lý Ảnh Con ({images.length} ảnh)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tải lên ảnh mới, thay thế hoặc xóa ảnh trực tiếp tại từng thẻ ảnh
                </p>
              </div>

              {/* Add image actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 active:scale-95 transition-all"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Tải ảnh từ máy</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => setIsAddingUrl(!isAddingUrl)}
                  className="flex items-center gap-1 rounded-lg border border-emerald-700/60 bg-emerald-950/60 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40 active:scale-95 transition-all"
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  <span>Thêm URL</span>
                </button>
              </div>
            </div>

            {/* URL Input Form */}
            {isAddingUrl && (
              <form onSubmit={handleAddUrl} className="flex gap-2 rounded-xl border border-emerald-800 bg-emerald-950/70 p-2.5">
                <input
                  type="url"
                  placeholder="Dán đường link ảnh (https://...)"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 rounded-lg border border-emerald-700/60 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Thêm
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingUrl(false)}
                  className="rounded-lg px-2 text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
              </form>
            )}

            {/* Replace via URL modal form */}
            {replaceUrlDialogImageId && (
              <form onSubmit={handleReplaceUrlSubmit} className="flex flex-col gap-2 rounded-xl border border-amber-600/60 bg-amber-950/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Thay thế ảnh bằng liên kết URL mới</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceUrlDialogImageId(null);
                      setReplaceUrlInput('');
                    }}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Nhập đường link ảnh mới (https://...)"
                    value={replaceUrlInput}
                    onChange={(e) => setReplaceUrlInput(e.target.value)}
                    className="flex-1 rounded-lg border border-amber-500/50 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
                  >
                    Cập nhật
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplaceUrlDialogImageId(null);
                      setReplaceUrlInput('');
                    }}
                    className="rounded-lg px-2 text-xs text-slate-400 hover:text-white"
                  >
                    Đóng
                  </button>
                </div>
              </form>
            )}

            {/* Photos Grid */}
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-800/80 bg-emerald-950/20 p-8 text-center">
                <ImageIcon className="h-10 w-10 text-emerald-700 mb-2" />
                <p className="text-xs font-medium text-slate-300">Chưa có ảnh con nào cho khu vực này</p>
                <p className="text-[11px] text-slate-500 mt-1">Nhấp nút "Tải ảnh từ máy" ở trên để thêm ngay.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {images.map((img, idx) => {
                  const isCover = idx === 0;
                  const isConfirmingDelete = confirmDeleteImageId === img.id;

                  return (
                    <div
                      key={img.id}
                      className={`group relative flex flex-col rounded-xl overflow-hidden border-2 bg-black/60 shadow-lg transition-all ${
                        isCover ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-emerald-900/60 hover:border-emerald-600'
                      }`}
                    >
                      {/* Image Preview */}
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-950">
                        <img
                          src={img.image_url}
                          alt={img.title || `Ảnh con ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Cover Badge */}
                        {isCover && (
                          <span className="absolute bottom-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
                            ẢNH BÌA
                          </span>
                        )}

                        {/* Number tag */}
                        <span className="absolute top-2 left-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white border border-white/10">
                          #{idx + 1}
                        </span>

                        {/* Permanent Quick-Action Delete button on top right of the thumbnail */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteImageId(img.id);
                          }}
                          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600/90 text-white shadow-md hover:bg-rose-600 active:scale-95 transition-all border border-rose-400/40"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* In-Card Delete Confirmation Overlay */}
                      {isConfirmingDelete && (
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-rose-950/95 p-3 text-center animate-in fade-in duration-150">
                          <AlertTriangle className="h-6 w-6 text-rose-400 mb-1" />
                          <p className="text-xs font-bold text-white">Xác nhận xóa ảnh này?</p>
                          <p className="text-[10px] text-rose-200 mt-0.5 mb-2.5">Thao tác này không thể hoàn tác</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => executeDeleteImage(img.id)}
                              className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-rose-500 active:scale-95"
                            >
                              Xóa ngay
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteImageId(null)}
                              className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Bar Beneath The Image */}
                      <div className="flex items-center justify-between border-t border-emerald-900/60 bg-[#06201c] p-2 gap-1.5">
                        {/* Replace Button */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => triggerReplaceFilePicker(img.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-800/80 px-2 py-1 text-[11px] font-bold text-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all border border-emerald-600/50"
                            title="Thay thế bằng ảnh khác từ máy tính"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Đổi ảnh</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReplaceUrlDialogImageId(img.id);
                              setReplaceUrlInput('');
                            }}
                            className="rounded-lg p-1 text-emerald-400 hover:bg-emerald-900/50 hover:text-white"
                            title="Đổi ảnh từ link URL"
                          >
                            <LinkIcon className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Set Cover / Star Button */}
                        {!isCover ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSetCoverImage(location.id, img.id);
                              showToast('Đã đặt làm ảnh bìa!');
                            }}
                            className="flex items-center gap-1 rounded-lg bg-slate-800/90 px-2 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-600 hover:text-white transition-all border border-amber-500/30"
                            title="Đặt ảnh này làm ảnh bìa đại diện của khu vực"
                          >
                            <Star className="h-3 w-3" />
                            <span>Đặt bìa</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 px-1">
                            <Check className="h-3 w-3" />
                            <span>Đang làm bìa</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Edit Area Info & Details */}
          <form onSubmit={handleSaveDetails} className="space-y-4 border-t border-emerald-900/60 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Thông Tin Chi Tiết Khu Vực
              </h4>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 active:scale-95 transition-all"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Tên khu vực:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-emerald-800 bg-slate-900/80 px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Danh mục:
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-emerald-800 bg-slate-900/80 px-3 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">
                Mô tả chức năng:
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả công năng, sức chứa, nhiệm vụ của phân khu này..."
                className="w-full rounded-lg border border-emerald-800 bg-slate-900/80 p-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
              />
            </div>

            {/* Custom Specifications / Attributes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-300">
                  Thông số kỹ thuật / Đặc điểm:
                </label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                >
                  <Plus className="h-3 w-3" />
                  <span>Thêm mục</span>
                </button>
              </div>

              {customFields.length === 0 ? (
                <p className="text-[11px] italic text-slate-500">Chưa có thông số tùy chỉnh nào.</p>
              ) : (
                <div className="space-y-2">
                  {customFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Tiêu đề (VD: Diện tích)"
                        value={field.label}
                        onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                        className="w-1/3 rounded-lg border border-emerald-800 bg-slate-900/80 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Giá trị (VD: 500 m2)"
                        value={field.value}
                        onChange={(e) => handleUpdateField(idx, 'value', e.target.value)}
                        className="flex-1 rounded-lg border border-emerald-800 bg-slate-900/80 px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-950 hover:text-rose-400"
                        title="Xóa mục này"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
