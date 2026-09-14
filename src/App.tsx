import React, { useState, useEffect } from 'react';
import { useCampusStore } from './data/campusStore';
import { CampusHeader } from './components/campus/CampusHeader';
import { CampusSidebar } from './components/campus/CampusSidebar';
import { CampusLeafletMap } from './components/campus/CampusLeafletMap';
import { AreaDetailDrawer } from './components/campus/AreaDetailDrawer';
import { AreaAdminModal } from './components/campus/AreaAdminModal';
import { AdminLoginModal } from './components/campus/AdminLoginModal';
import { CampusInfoModal } from './components/campus/CampusInfoModal';
import { LightboxViewer } from './components/campus/LightboxViewer';
import { MapPin, Layers, RotateCcw, Map as MapIcon, SlidersHorizontal } from 'lucide-react';

export default function App() {
  const {
    campuses,
    categories,
    locations,
    campusLocations,
    institutionInfo,
    boardMembers,
    siteSettings,
    currentCampus,
    selectedCampusId,
    setSelectedCampusId,
    selectedLocationId,
    setSelectedLocationId,
    selectedLocation,
    hoveredLocationId,
    setHoveredLocationId,
    activeCategoryIds,
    toggleCategory,
    setAllCategories,
    isAdmin,
    loginAdmin,
    logoutAdmin,
    addLocationImage,
    replaceLocationImage,
    deleteLocationImage,
    setCoverImage,
    updateLocation,
    resetToDefault,
    syncWithRemoteServer,
    exportData,
    importData,
    getLocationImages,
  } = useCampusStore();

  // Modals & Drawers state
  // On desktop, default open; on mobile, default closed so map is immediately visible!
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return false;
    }
    return true;
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [syncToast, setSyncToast] = useState<{ message: string; isError?: boolean } | null>(null);

  // Sync with remote server (campus-map-pc-04.vercel.app)
  const handleSyncRemote = async () => {
    setSyncToast({ message: 'Đang kết nối và đồng bộ dữ liệu hình ảnh từ máy chủ...' });
    const result = await syncWithRemoteServer();
    setSyncToast({ message: result.message, isError: !result.success });
    setTimeout(() => {
      setSyncToast(null);
    }, 4500);
  };

  // Auto-sync in background on initial load to ensure latest data from server
  useEffect(() => {
    syncWithRemoteServer().catch((err) => {
      console.warn('Background auto-sync on load skipped:', err);
    });
  }, [syncWithRemoteServer]);

  // Institution info & board members for current campus
  const currentInstitution = institutionInfo.find((i) => i.campus_id === selectedCampusId);
  const currentBoardMembers = boardMembers.filter((m) => m.campus_id === selectedCampusId);

  // Selected area images & details
  const selectedLocationImages = selectedLocation ? getLocationImages(selectedLocation.id) : [];
  const selectedLocationCategory = categories.find((c) => c.id === selectedLocation?.category_id);
  const selectedLocationManager = boardMembers.find((m) => m.id === selectedLocation?.manager_id);

  // Export JSON backup handler
  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campus-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup handler
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        if (text) {
          const ok = importData(text);
          if (ok) {
            alert('Nhập dữ liệu thành công!');
          } else {
            alert('Dữ liệu JSON không hợp lệ.');
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục dữ liệu khuôn viên về mặc định ban đầu không?')) {
      resetToDefault();
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#061e1b] font-sans antialiased text-slate-100">
      {/* Top Header with Police Logo & Campus 1-6 Dropdown */}
      <CampusHeader
        campuses={campuses}
        currentCampus={currentCampus}
        onSelectCampus={(id) => {
          setSelectedCampusId(id);
          setSelectedLocationId(null);
        }}
        locations={campusLocations}
        onSelectLocation={(id) => setSelectedLocationId(id)}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        isAdmin={isAdmin}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={logoutAdmin}
        onResetDefault={handleReset}
        onSyncRemote={handleSyncRemote}
        onExportData={handleExport}
        onImportData={handleImport}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        siteSetting={siteSettings}
      />

      {/* Sync Toast Notification */}
      {syncToast && (
        <div className={`fixed top-16 right-4 z-[9999] flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 border ${
          syncToast.isError 
            ? 'bg-rose-950/90 text-rose-200 border-rose-600/60 shadow-rose-950/50' 
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/60 shadow-emerald-950/50'
        }`}>
          <span>{syncToast.message}</span>
        </div>
      )}

      {/* Main Workspace: Sidebar + Leaflet Master Map + Detail Drawer */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar (Collapsible & Off-canvas on Mobile) */}
        <CampusSidebar
          campus={currentCampus}
          locations={campusLocations}
          categories={categories}
          activeCategoryIds={activeCategoryIds}
          onToggleCategory={toggleCategory}
          onSetAllCategories={setAllCategories}
          selectedLocationId={selectedLocationId}
          onSelectLocation={(id) => setSelectedLocationId(id)}
          hoveredLocationId={hoveredLocationId}
          onHoverLocation={(id) => setHoveredLocationId(id)}
          getLocationImages={getLocationImages}
          institutionInfo={currentInstitution}
          boardMembers={currentBoardMembers}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenInfo={() => setIsInfoModalOpen(true)}
        />

        {/* Master Interactive Map - Isolated Stacking Context */}
        <main className="relative flex min-h-0 flex-1 overflow-hidden z-0 isolate">
          <CampusLeafletMap
            campus={currentCampus}
            locations={campusLocations}
            categories={categories}
            activeCategoryIds={activeCategoryIds}
            selectedLocationId={selectedLocationId}
            onSelectLocation={(id) => setSelectedLocationId(id)}
            hoveredLocationId={hoveredLocationId}
            onHoverLocation={(id) => setHoveredLocationId(id)}
            getLocationImages={getLocationImages}
          />
        </main>

        {/* Right Detail Drawer (Bottom sheet on mobile, right panel on desktop) */}
        {selectedLocation && (
          <AreaDetailDrawer
            location={selectedLocation}
            category={selectedLocationCategory}
            images={selectedLocationImages}
            manager={selectedLocationManager}
            onClose={() => setSelectedLocationId(null)}
            onOpenAdminEdit={() => setIsAdminModalOpen(true)}
            onOpenLightbox={(idx) => setLightboxIndex(idx)}
            isAdmin={isAdmin}
          />
        )}
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="flex md:hidden items-center justify-around border-t border-emerald-950/80 bg-[#072421] py-1.5 px-2 text-white z-30">
        <button
          onClick={() => {
            setIsSidebarOpen(false);
            setSelectedLocationId(null);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold transition-colors ${
            !isSidebarOpen && !selectedLocationId ? 'text-emerald-300 font-bold' : 'text-slate-400'
          }`}
        >
          <MapIcon className="h-4 w-4" />
          <span>Bản đồ</span>
        </button>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold transition-colors ${
            isSidebarOpen ? 'text-emerald-300 font-bold' : 'text-slate-400'
          }`}
        >
          <MapPin className="h-4 w-4" />
          <span>Phân khu ({campusLocations.length})</span>
        </button>

        <button
          onClick={() => {
            setSelectedLocationId(null);
          }}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-300 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Toàn cảnh</span>
        </button>

        <button
          onClick={() => setIsInfoModalOpen(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-300 transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Giới thiệu</span>
        </button>
      </nav>

      {/* Lightbox Fullscreen Image Viewer */}
      {lightboxIndex !== null && selectedLocation && (
        <LightboxViewer
          images={selectedLocationImages}
          currentIndex={lightboxIndex}
          isOpen={true}
          onClose={() => setLightboxIndex(null)}
          onSelectIndex={(idx) => setLightboxIndex(idx)}
          areaName={selectedLocation.name}
        />
      )}

      {/* Admin Area Photo & Info Editor Modal */}
      {isAdminModalOpen && selectedLocation && (
        <AreaAdminModal
          location={selectedLocation}
          categories={categories}
          images={selectedLocationImages}
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          onAddImage={addLocationImage}
          onReplaceImage={replaceLocationImage}
          onDeleteImage={deleteLocationImage}
          onSetCoverImage={setCoverImage}
          onUpdateLocation={updateLocation}
        />
      )}

      {/* Admin Authentication Login Modal */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onLogin={loginAdmin}
        />
      )}

      {/* Campus Institution Info Modal with Police Logo */}
      {isInfoModalOpen && (
        <CampusInfoModal
          campus={currentCampus}
          institutionInfo={currentInstitution}
          boardMembers={currentBoardMembers}
          isOpen={isInfoModalOpen}
          onClose={() => setIsInfoModalOpen(false)}
          siteSetting={siteSettings}
        />
      )}
    </div>
  );
}
