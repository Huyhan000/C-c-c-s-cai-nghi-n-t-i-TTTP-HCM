import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Layers, 
  Building, 
  Image as ImageIcon, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Info, 
  Phone, 
  Calendar, 
  User, 
  Check,
  X,
  Sparkles,
  ExternalLink,
  Users,
  HardHat,
  Building2
} from 'lucide-react';
import { 
  Campus, 
  LocationItem, 
  Category, 
  LocationImage, 
  InstitutionInfo, 
  BoardMember 
} from '../../types/campus';
import { parseInstitutionInfo } from '../../utils/institutionParser';

interface CampusSidebarProps {
  campus: Campus;
  locations: LocationItem[];
  categories: Category[];
  activeCategoryIds: string[];
  onToggleCategory: (categoryId: string) => void;
  onSetAllCategories: (enabled: boolean) => void;
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string) => void;
  hoveredLocationId: string | null;
  onHoverLocation: (locationId: string | null) => void;
  getLocationImages: (locationId: string) => LocationImage[];
  institutionInfo?: InstitutionInfo;
  boardMembers: BoardMember[];
  isOpen: boolean;
  onClose: () => void;
  onOpenInfo?: () => void;
}

export const CampusSidebar: React.FC<CampusSidebarProps> = ({
  campus,
  locations,
  categories,
  activeCategoryIds,
  onToggleCategory,
  onSetAllCategories,
  selectedLocationId,
  onSelectLocation,
  hoveredLocationId,
  onHoverLocation,
  getLocationImages,
  institutionInfo,
  boardMembers,
  isOpen,
  onClose,
  onOpenInfo,
}) => {
  const [activeTab, setActiveTab] = useState<'locations' | 'layers' | 'info'>('locations');
  const [search, setSearch] = useState('');

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Filter locations by search and active category layers
  const visibleLocations = locations
    .filter((loc) => activeCategoryIds.includes(loc.category_id))
    .filter((loc) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        loc.name.toLowerCase().includes(q) ||
        loc.display_number.toString() === q ||
        (loc.description && loc.description.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.display_number - b.display_number);

  if (!isOpen) return null;

  const handleSelectLocation = (id: string) => {
    onSelectLocation(id);
    // On mobile, close sidebar so user immediately views the map location
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      onClose();
    }
  };

  const parsed = parseInstitutionInfo(institutionInfo?.description);

  return (
    <>
      {/* Mobile Backdrop Blur */}
      <div 
        onClick={onClose}
        className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in"
      />

      <aside className="fixed inset-y-0 left-0 z-40 flex h-full w-[310px] sm:w-[340px] md:relative md:inset-auto md:w-80 lg:w-88 shrink-0 flex-col border-r border-emerald-950/60 bg-[#072421] text-slate-100 shadow-2xl transition-all">
        {/* Mobile Header / Close Button */}
        <div className="flex md:hidden items-center justify-between border-b border-emerald-950 bg-[#051c1a] px-3.5 py-2.5">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Menu Tra Cứu Phân Khu
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-900/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Tabs Header */}
        <div className="flex border-b border-emerald-950/80 bg-[#061e1b] p-1.5 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('locations')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              activeTab === 'locations'
                ? 'bg-emerald-600/40 text-emerald-200 shadow-sm border border-emerald-500/40'
                : 'text-slate-400 hover:bg-emerald-950 hover:text-slate-200'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Phân khu ({locations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('layers')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              activeTab === 'layers'
                ? 'bg-emerald-600/40 text-emerald-200 shadow-sm border border-emerald-500/40'
                : 'text-slate-400 hover:bg-emerald-950 hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Lớp hiển thị</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
              activeTab === 'info'
                ? 'bg-emerald-600/40 text-emerald-200 shadow-sm border border-emerald-500/40'
                : 'text-slate-400 hover:bg-emerald-950 hover:text-slate-200'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Giới thiệu</span>
          </button>
        </div>

        {/* Tab 1: Locations list */}
        {activeTab === 'locations' && (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Search box inside tab */}
            <div className="p-3 border-b border-emerald-950/60 bg-[#072421]">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-emerald-400/60" />
                <input
                  type="text"
                  placeholder="Lọc theo tên, số hiệu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-emerald-800/80 bg-emerald-950/80 py-2 pl-8 pr-3 text-xs text-white placeholder-emerald-400/40 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 text-xs text-emerald-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* List of locations with clear readable cards */}
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {visibleLocations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MapPin className="h-8 w-8 text-emerald-800 mx-auto mb-2" />
                  <p>Không có địa điểm nào phù hợp với bộ lọc hiện tại.</p>
                </div>
              ) : (
                visibleLocations.map((loc) => {
                  const cat = categoryMap.get(loc.category_id);
                  const isSelected = loc.id === selectedLocationId;
                  const isHovered = loc.id === hoveredLocationId;
                  const images = getLocationImages(loc.id);
                  const cover = images[0]?.image_url;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectLocation(loc.id)}
                      onMouseEnter={() => onHoverLocation(loc.id)}
                      onMouseLeave={() => onHoverLocation(null)}
                      className={`group relative flex cursor-pointer items-center gap-2.5 rounded-xl p-2 transition-all ${
                        isSelected
                          ? 'border border-emerald-400 bg-emerald-900/60 shadow-md ring-1 ring-emerald-400/40'
                          : isHovered
                          ? 'border border-emerald-700/60 bg-emerald-950/80'
                          : 'border border-emerald-950/80 bg-emerald-950/30 hover:border-emerald-800 hover:bg-emerald-950/60'
                      }`}
                    >
                      {/* Thumbnail or Number Avatar */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/40 border border-emerald-900/60">
                        {cover ? (
                          <img
                            src={cover}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center font-bold text-white text-xs"
                            style={{ backgroundColor: cat?.color || '#059669' }}
                          >
                            #{loc.display_number}
                          </div>
                        )}
                        <span
                          className="absolute bottom-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9.5px] font-black text-white shadow"
                          style={{ backgroundColor: cat?.color || '#059669' }}
                        >
                          {loc.display_number}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <strong className="truncate text-xs font-bold text-slate-100 group-hover:text-white">
                            {loc.name}
                          </strong>
                        </div>

                        <div className="mt-0.5 flex items-center gap-2 text-[10.5px]">
                          <span className="truncate text-emerald-300 font-medium">
                            {cat?.name || 'Khu chức năng'}
                          </span>
                          <span className="text-slate-500">•</span>
                          {images.length > 0 ? (
                            <span className="text-emerald-400 font-semibold">
                              {images.length} ảnh
                            </span>
                          ) : (
                            <span className="text-slate-500">Chưa có ảnh</span>
                          )}
                        </div>
                      </div>

                      <ChevronRight
                        className={`h-4 w-4 shrink-0 transition-transform ${
                          isSelected ? 'text-emerald-300 translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Category Layers Filter */}
        {activeTab === 'layers' && (
          <div className="flex min-h-0 flex-1 flex-col p-4 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Lớp Bản Đồ
                </h3>
                <p className="text-[11px] text-slate-400">Bật/tắt hiển thị các phân loại khu vực</p>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => onSetAllCategories(true)}
                  className="rounded-lg bg-emerald-950 px-2 py-1 text-[10.5px] font-semibold text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/60"
                >
                  Hiện hết
                </button>
                <button
                  onClick={() => onSetAllCategories(false)}
                  className="rounded-lg bg-emerald-950 px-2 py-1 text-[10.5px] font-semibold text-slate-400 hover:bg-emerald-900/60 border border-emerald-800/60"
                >
                  Ẩn hết
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => {
                const isActive = activeCategoryIds.includes(cat.id);
                const count = locations.filter((l) => l.category_id === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => onToggleCategory(cat.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                      isActive
                        ? 'border-emerald-700/60 bg-emerald-950/60 text-white'
                        : 'border-emerald-950/60 bg-emerald-950/20 text-slate-400 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <div>
                        <strong className="block text-xs font-semibold text-slate-100">
                          {cat.name}
                        </strong>
                        <span className="text-[10.5px] text-slate-400">{count} khu vực</span>
                      </div>
                    </div>

                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                        isActive ? 'bg-emerald-600/30 text-emerald-300' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Campus info (Refined and Structured) */}
        {activeTab === 'info' && (
          <div className="min-h-0 flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {/* Campus Card & Former Name */}
            <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/50 p-3.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                  Cơ sở trực thuộc PC04
                </span>
                {parsed.formerName && (
                  <span className="rounded-full bg-amber-950/80 border border-amber-600/40 px-2 py-0.5 text-[10px] font-medium text-amber-300 truncate max-w-full">
                    Tên cũ: {parsed.formerName}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white leading-snug">{campus.name}</h3>
            </div>

            {/* Key Statistics Grid (2 columns) */}
            {parsed.stats.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <Users className="h-3 w-3 text-emerald-400" />
                  <span>Chỉ Số Trọng Yếu</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {parsed.stats.map((st, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl border p-2.5 ${
                        st.highlight
                          ? 'border-emerald-600/60 bg-emerald-900/40'
                          : 'border-emerald-900/50 bg-emerald-950/40'
                      }`}
                    >
                      <span className="block text-[10px] font-semibold text-emerald-300/80">
                        {st.label}
                      </span>
                      <strong className="block text-xs font-bold text-white mt-0.5">
                        {st.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overview text formatted */}
            <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-3 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                Mô Tả & Tình Hình
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {parsed.cleanOverview}
              </p>
              {parsed.infrastructureNotes && (
                <div className="mt-2 rounded-xl bg-emerald-950/70 border border-emerald-800/40 p-2 text-[11px] text-emerald-200 flex items-start gap-1.5">
                  <HardHat className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <span>{parsed.infrastructureNotes}</span>
                </div>
              )}
            </div>

            {/* Address & Contacts */}
            <div className="space-y-1.5 rounded-2xl border border-emerald-900/40 bg-emerald-950/30 p-3 text-xs">
              {institutionInfo?.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="text-slate-200">{institutionInfo.address}</span>
                </div>
              )}
              {institutionInfo?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="text-slate-200">{institutionInfo.phone}</span>
                </div>
              )}
              {institutionInfo?.established && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="text-slate-200">Thành lập: {institutionInfo.established}</span>
                </div>
              )}
            </div>

            {/* View Full Modal Button */}
            {onOpenInfo && (
              <button
                onClick={onOpenInfo}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600/50 bg-emerald-700/30 hover:bg-emerald-600 py-2.5 text-xs font-bold text-emerald-200 hover:text-white transition-all shadow-md"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Xem chi tiết Ban chỉ huy & Pháp lý</span>
              </button>
            )}

            {/* Board Members Preview */}
            {boardMembers.length > 0 && (
              <div className="space-y-2 pt-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Ban Chỉ Huy Cơ Sở ({boardMembers.length} đồng chí)
                </h4>
                <div className="space-y-1.5">
                  {boardMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/30 p-2 text-xs"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-emerald-200 font-bold border border-emerald-600/40">
                        {member.photo_url ? (
                          <img
                            src={member.photo_url}
                            alt={member.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <strong className="block truncate text-slate-100 font-bold text-xs">{member.name}</strong>
                        <span className="text-[10.5px] text-emerald-300 font-medium">
                          {member.title || member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
