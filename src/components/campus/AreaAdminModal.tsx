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
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Save
} from 'lucide-react';
import { LocationItem, LocationImage, Category } from '../../types/campus';

interface AreaAdminModalProps {
  location: LocationItem | null;
  categories: Category[];
  images: LocationImage[];
  isOpen: boolean;
  onClose: () => void;
  onAddImage: (locationId: string, imageUrl: string, title?: string) => void;
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
  onDeleteImage,
  onSetCoverImage,
  onUpdateLocation,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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
    }
  }, [location]);

  if (!isOpen || !location) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result) {
          onAddImage(location.id, result, file.name.replace(/\.[^/.]+$/, ''));
          showToast(`Đã tải lên ảnh thành công!`);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-emerald-800 bg-[#092b27] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-950/70 bg-[#072421] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 font-bold text-xs text-white">
              {location.display_number}
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

        {/* Scrollable Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Manage Sub-Images (Quyền Admin Cập Nhật Ảnh) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  <span>Quản Lý Ảnh Con ({images.length} ảnh)</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tải lên ảnh từ máy tính hoặc nhập liên kết ảnh chụp thực tế của khu vực
                </p>
              </div>

              {/* Add image actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500"
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
                  className="flex items-center gap-1 rounded-lg border border-emerald-700/60 bg-emerald-950/60 px-2.5 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40"
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

            {/* Photos Grid */}
            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-800/80 bg-emerald-950/20 p-8 text-center">
                <ImageIcon className="h-10 w-10 text-emerald-700 mb-2" />
                <p className="text-xs font-medium text-slate-300">Chưa có ảnh con nào cho khu vực này</p>
                <p className="text-[11px] text-slate-500 mt-1">Nhấp nút "Tải ảnh từ máy" ở trên để thêm ngay.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, idx) => {
                  const isCover = idx === 0;
                  return (
                    <div
                      key={img.id}
                      className={`group relative aspect-4/3 rounded-xl overflow-hidden border-2 bg-black/50 shadow transition-all ${
                        isCover ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-emerald-900/60 hover:border-emerald-600'
                      }`}
                    >
                      <img
                        src={img.image_url}
                        alt={`Ảnh con ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[9.5px] font-black text-white shadow">
                          ẢNH BÌA
                        </span>
                      )}

                      {/* Number tag */}
                      <span className="absolute top-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                        #{idx + 1}
                      </span>

                      {/* Hover Overlay Controls */}
                      <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 p-2">
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => {
                              onSetCoverImage(location.id, img.id);
                              showToast('Đã đặt làm ảnh bìa!');
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow hover:bg-emerald-500"
                            title="Đặt làm ảnh đại diện/ảnh bìa"
                          >
                            <Star className="h-3.5 w-3.5 fill-white" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa ảnh này không?')) {
                              onDeleteImage(img.id);
                              showToast('Đã xóa ảnh!');
                            }
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow hover:bg-rose-500"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
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
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên khu vực:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-emerald-800 bg-emerald-950/80 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Danh mục:</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-emerald-800 bg-emerald-950/80 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả chức năng:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-emerald-800 bg-emerald-950/80 px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none"
                placeholder="Nhập chức năng hoạt động, nhiệm vụ của phân khu này..."
              />
            </div>

            {/* Custom fields editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Thông số kỹ thuật / Đặc điểm:</label>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold hover:text-emerald-300"
                >
                  <Plus className="h-3 w-3" />
                  <span>Thêm mục</span>
                </button>
              </div>

              <div className="space-y-2">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Tên thuộc tính (VD: Diện tích, Sức chứa)"
                      value={field.label}
                      onChange={(e) => handleUpdateField(idx, 'label', e.target.value)}
                      className="w-2/5 rounded-lg border border-emerald-800 bg-emerald-950/80 px-2.5 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Giá trị (VD: 500 m², 120 người)"
                      value={field.value}
                      onChange={(e) => handleUpdateField(idx, 'value', e.target.value)}
                      className="flex-1 rounded-lg border border-emerald-800 bg-emerald-950/80 px-2.5 py-1.5 text-xs text-white focus:border-emerald-400 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveField(idx)}
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
