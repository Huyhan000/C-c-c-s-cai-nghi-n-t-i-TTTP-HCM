import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Info, 
  SlidersHorizontal,
  Download,
  Upload,
  RotateCcw,
  RefreshCw,
  Check,
  ChevronDown,
  ShieldAlert,
  Layers,
  MapPin
} from 'lucide-react';
import { Campus, LocationItem, SiteSetting } from '../../types/campus';

interface CampusHeaderProps {
  campuses: Campus[];
  currentCampus: Campus;
  onSelectCampus: (campusId: string) => void;
  locations: LocationItem[];
  onSelectLocation: (locationId: string) => void;
  onOpenInfo: () => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onResetDefault: () => void;
  onSyncRemote?: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  siteSetting?: SiteSetting;
}

const DEFAULT_POLICE_LOGO = 'https://ghcatqoczarmetojcpok.supabase.co/storage/v1/object/public/institution/648be358-1289-449d-a821-b0bd4ada5190.png';

export const CampusHeader: React.FC<CampusHeaderProps> = ({
  campuses,
  currentCampus,
  onSelectCampus,
  locations,
  onSelectLocation,
  onOpenInfo,
  isAdmin,
  onOpenAdminLogin,
  onLogoutAdmin,
  onResetDefault,
  onSyncRemote,
  onExportData,
  onImportData,
  onToggleSidebar,
  isSidebarOpen,
  siteSetting,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const logoUrl = siteSetting?.logo_url || DEFAULT_POLICE_LOGO;

  const filteredLocations = searchQuery.trim()
    ? locations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          loc.display_number.toString() === searchQuery.trim() ||
          (loc.description && loc.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <header className="relative z-30 flex min-h-[58px] sm:min-h-[64px] w-full items-center justify-between border-b border-emerald-950/60 bg-[#072824] px-2.5 sm:px-4 text-white shadow-lg">
      {/* Left: Police Logo & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Sidebar Toggle Button (Desktop & Mobile) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              isSidebarOpen 
                ? 'border-emerald-500/60 bg-emerald-800/70 text-emerald-200' 
                : 'border-emerald-700/50 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-800/40'
            }`}
            title="Bật/tắt danh sách phân khu & lớp lọc"
            aria-label="Toggle Sidebar"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
        )}

        {/* Official Police Emblem (Huy hiệu Công An Nhân Dân) */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900/40 border border-emerald-500/40 p-0.5 shadow-md">
            {!logoError ? (
              <img
                src={logoUrl}
                alt="Logo Công an TP. Hồ Chí Minh - PC04"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-amber-600 text-white font-black text-xs">
                CA
              </div>
            )}
          </div>

          <div className="hidden lg:block leading-tight">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-wide text-white uppercase">
              CÔNG AN TP. HỒ CHÍ MINH
            </h1>
            <p className="text-[11px] font-semibold text-emerald-300">
              PHÒNG CẢNH SÁT ĐIỀU TRA TỘI PHẠM VỀ MA TÚY (PC04)
            </p>
          </div>

          <div className="block lg:hidden leading-tight">
            <h1 className="text-xs font-bold text-white tracking-tight">CÔNG AN TP.HCM</h1>
            <p className="text-[10px] font-semibold text-emerald-300">PHÒNG PC04</p>
          </div>
        </div>

        {/* Campus Selector Dropdown (Sắp xếp tuần tự từ 1 đến 6) */}
        <div className="relative ml-1 sm:ml-2">
          <div className="relative inline-flex items-center">
            <select
              value={currentCampus?.id || ''}
              onChange={(e) => onSelectCampus(e.target.value)}
              className="h-9 sm:h-10 appearance-none rounded-xl border border-emerald-500/50 bg-emerald-950/90 py-1.5 pl-3 pr-8 text-xs font-bold text-emerald-100 shadow-inner hover:border-emerald-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 max-w-[170px] sm:max-w-[260px] truncate"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100 py-1">
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Middle: Search Box (Hidden on small mobile, visible on tablet & desktop) */}
      <div className="relative mx-3 hidden max-w-xs flex-1 md:block lg:max-w-md">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-emerald-400/70" />
          <input
            type="text"
            placeholder="Tìm kiếm phân khu, số hiệu..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full rounded-full border border-emerald-700/60 bg-emerald-950/70 py-1.5 pl-8 pr-3 text-xs text-white placeholder-emerald-400/50 transition-all focus:border-emerald-400 focus:bg-emerald-950 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-2.5 text-xs text-emerald-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isSearchOpen && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-1.5 max-h-64 overflow-y-auto rounded-xl border border-emerald-700/80 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md">
            {filteredLocations.length === 0 ? (
              <div className="px-3 py-2.5 text-center text-xs text-slate-400">
                Không tìm thấy khu vực phù hợp
              </div>
            ) : (
              filteredLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    onSelectLocation(loc.id);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-emerald-800/40"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/40 text-[11px] font-bold text-emerald-300">
                    {loc.display_number}
                  </span>
                  <span className="truncate font-medium text-slate-100">{loc.name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Info & Admin Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Campus Info Button */}
        <button
          onClick={onOpenInfo}
          className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-emerald-700/50 bg-emerald-950/60 px-2.5 sm:px-3 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-800/50 hover:text-white"
          title="Thông tin cơ sở & Ban chỉ huy"
        >
          <Info className="h-4 w-4 text-emerald-400" />
          <span className="hidden sm:inline">Thông tin cơ sở</span>
        </button>

        {/* Admin status & actions */}
        {isAdmin ? (
          <div className="relative">
            <button
              onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
              className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-emerald-400 bg-emerald-500/20 px-2.5 sm:px-3 text-xs font-bold text-emerald-300 shadow-sm transition-colors hover:bg-emerald-500/30"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="hidden xs:inline">Quản trị viên</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {isAdminMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-1.5 w-56 rounded-2xl border border-emerald-800 bg-slate-900 p-2 shadow-2xl z-50"
                onClick={() => setIsAdminMenuOpen(false)}
              >
                <div className="border-b border-slate-800 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Quyền Quản Trị
                </div>
                {onSyncRemote && (
                  <button
                    onClick={onSyncRemote}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-emerald-300 font-semibold hover:bg-emerald-900/50"
                    title="Cập nhật hình ảnh và dữ liệu mới nhất từ website campus-map-pc-04"
                  >
                    <RefreshCw className="h-4 w-4 text-emerald-400" />
                    <span>Đồng bộ từ máy chủ web</span>
                  </button>
                )}
                <button
                  onClick={onExportData}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-emerald-900/40"
                >
                  <Download className="h-4 w-4 text-emerald-400" />
                  <span>Xuất dữ liệu dự phòng</span>
                </button>
                <button
                  onClick={onImportData}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-200 hover:bg-emerald-900/40"
                >
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span>Nhập dữ liệu JSON</span>
                </button>
                <button
                  onClick={onResetDefault}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-amber-300 hover:bg-amber-900/30"
                >
                  <RotateCcw className="h-4 w-4 text-amber-400" />
                  <span>Khôi phục dữ liệu gốc</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={onLogoutAdmin}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-rose-300 hover:bg-rose-900/30"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Đăng xuất Quản trị</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAdminLogin}
            className="flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-emerald-600/50 bg-emerald-950/70 px-2.5 sm:px-3 text-xs font-medium text-emerald-300 transition-colors hover:border-emerald-400 hover:bg-emerald-800/40 hover:text-white"
            title="Đăng nhập tài khoản Quản trị để cập nhật ảnh khu vực"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Quản trị</span>
          </button>
        )}
      </div>
    </header>
  );
};
