import React, { useState, useEffect } from 'react';
import { Facility, LatLng } from '../../types';
import {
  MapPin,
  Crosshair,
  Sliders,
  Check,
  RotateCcw,
  Copy,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';

interface LocationCalibrationModalProps {
  isOpen: boolean;
  facility: Facility | null;
  onClose: () => void;
  onApplyCoordinates: (coords: LatLng, boundary: LatLng[]) => void;
  onResetToDefault: () => void;
  isPickModeActive: boolean;
  onTogglePickMode: (active: boolean) => void;
}

// Utility to generate rectangular boundary given center and dimensions in meters
export function generateRectangularBoundary(
  center: LatLng,
  widthMeters: number,
  heightMeters: number
): LatLng[] {
  // 1 degree lat ≈ 110,574 m
  const deltaLat = (heightMeters / 2) / 110574;
  // 1 degree lng ≈ 111,320 * cos(lat) m
  const latRad = (center.lat * Math.PI) / 180;
  const deltaLng = (widthMeters / 2) / (111320 * Math.cos(latRad));

  return [
    { lat: Number((center.lat + deltaLat).toFixed(6)), lng: Number((center.lng - deltaLng).toFixed(6)) }, // NW
    { lat: Number((center.lat + deltaLat).toFixed(6)), lng: Number((center.lng + deltaLng).toFixed(6)) }, // NE
    { lat: Number((center.lat - deltaLat).toFixed(6)), lng: Number((center.lng + deltaLng).toFixed(6)) }, // SE
    { lat: Number((center.lat - deltaLat).toFixed(6)), lng: Number((center.lng - deltaLng).toFixed(6)) }, // SW
  ];
}

// Calculate approximate dimensions in meters from 4 boundary points
export function calculateBoundaryDimensions(boundary: LatLng[]): { width: number; height: number } {
  if (!boundary || boundary.length < 4) {
    return { width: 650, height: 860 };
  }
  const lats = boundary.map((p) => p.lat);
  const lngs = boundary.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const avgLat = (minLat + maxLat) / 2;
  const latRad = (avgLat * Math.PI) / 180;

  const height = Math.round((maxLat - minLat) * 110574);
  const width = Math.round((maxLng - minLng) * (111320 * Math.cos(latRad)));

  return {
    width: Math.max(200, Math.min(2500, width)),
    height: Math.max(200, Math.min(2500, height)),
  };
}

export const LocationCalibrationModal: React.FC<LocationCalibrationModalProps> = ({
  isOpen,
  facility,
  onClose,
  onApplyCoordinates,
  onResetToDefault,
  isPickModeActive,
  onTogglePickMode,
}) => {
  if (!isOpen || !facility) return null;

  const [inputCoords, setInputCoords] = useState<string>(
    `${facility.coordinates.lat.toFixed(6)}, ${facility.coordinates.lng.toFixed(6)}`
  );
  const [currentLat, setCurrentLat] = useState<number>(facility.coordinates.lat);
  const [currentLng, setCurrentLng] = useState<number>(facility.coordinates.lng);

  const initialDims = calculateBoundaryDimensions(facility.compoundBoundary);
  const [widthMeters, setWidthMeters] = useState<number>(initialDims.width);
  const [heightMeters, setHeightMeters] = useState<number>(initialDims.height);

  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'google' | 'boundary'>('google');
  const [parseError, setParseError] = useState<string | null>(null);

  // Sync with incoming facility
  useEffect(() => {
    setCurrentLat(facility.coordinates.lat);
    setCurrentLng(facility.coordinates.lng);
    setInputCoords(`${facility.coordinates.lat.toFixed(6)}, ${facility.coordinates.lng.toFixed(6)}`);
    const dims = calculateBoundaryDimensions(facility.compoundBoundary);
    setWidthMeters(dims.width);
    setHeightMeters(dims.height);
  }, [facility]);

  // Parse coordinates from string (supports "10.6815, 107.5156", "10.6815 107.5156", or Google Maps URLs)
  const handleParseAndApply = (val: string) => {
    setParseError(null);
    const cleaned = val.trim();

    // Match Google Maps URL patterns e.g. @10.681523,107.515642 or place/.../@10.681523,107.515642
    const urlMatch = cleaned.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (urlMatch) {
      const lat = parseFloat(urlMatch[1]);
      const lng = parseFloat(urlMatch[2]);
      applyNewCenter(lat, lng);
      return;
    }

    // Match standard lat, lng format
    const coordMatch = cleaned.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110) {
        applyNewCenter(lat, lng);
        return;
      }
    }

    setParseError('Định dạng tọa độ không hợp lệ. Vui lòng nhập dạng: 10.681523, 107.515642 hoặc dán liên kết Google Maps.');
  };

  const applyNewCenter = (newLat: number, newLng: number) => {
    const latFixed = Number(newLat.toFixed(6));
    const lngFixed = Number(newLng.toFixed(6));
    setCurrentLat(latFixed);
    setCurrentLng(lngFixed);
    setInputCoords(`${latFixed}, ${lngFixed}`);
    setParseError(null);

    const newBoundary = generateRectangularBoundary(
      { lat: latFixed, lng: lngFixed },
      widthMeters,
      heightMeters
    );
    onApplyCoordinates({ lat: latFixed, lng: lngFixed }, newBoundary);
  };

  // Nudge coordinates in meters (North, South, East, West)
  const handleNudge = (direction: 'N' | 'S' | 'E' | 'W', stepMeters: number = 20) => {
    const deltaLat = stepMeters / 110574;
    const latRad = (currentLat * Math.PI) / 180;
    const deltaLng = stepMeters / (111320 * Math.cos(latRad));

    let nextLat = currentLat;
    let nextLng = currentLng;

    if (direction === 'N') nextLat += deltaLat;
    if (direction === 'S') nextLat -= deltaLat;
    if (direction === 'E') nextLng += deltaLng;
    if (direction === 'W') nextLng -= deltaLng;

    applyNewCenter(nextLat, nextLng);
  };

  // Update boundary width / height
  const handleDimensionChange = (newWidth: number, newHeight: number) => {
    setWidthMeters(newWidth);
    setHeightMeters(newHeight);
    const newBoundary = generateRectangularBoundary(
      { lat: currentLat, lng: currentLng },
      newWidth,
      newHeight
    );
    onApplyCoordinates({ lat: currentLat, lng: currentLng }, newBoundary);
  };

  const handleCopyCoords = async () => {
    try {
      await navigator.clipboard.writeText(`${currentLat}, ${currentLng}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // ignore
    }
  };

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    facility.name + ' ' + facility.district
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calibration-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[var(--color-border)] flex flex-col max-h-[92vh] overflow-hidden text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <h3 id="calibration-modal-title" className="text-base font-bold text-slate-900 leading-tight">
                Hiệu chỉnh Tọa độ & Khoanh vùng
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {facility.name} (Điểm số {facility.number})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng bảng hiệu chỉnh"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'google'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            1. Lấy thông số từ Google Maps
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('boundary')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'boundary'
                ? 'border-amber-600 text-amber-900 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            2. Khoanh vùng khu đất (42 ha)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {activeTab === 'google' ? (
            <div className="space-y-4">
              {/* Step-by-step Google Maps Guide */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Phương pháp lấy tọa độ chính xác từng mét từ Google Maps:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-800 text-xs leading-relaxed">
                  <li>
                    Mở{' '}
                    <a
                      href={googleMapsSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-cyan-700 underline inline-flex items-center gap-0.5 hover:text-cyan-900"
                    >
                      Google Maps đến địa điểm này <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    <strong>Nhấp chuột phải</strong> (trên máy tính) hoặc <strong>nhấn giữ ngón tay</strong> (trên điện thoại) vào vị trí chính xác của cổng hoặc tòa nhà.
                  </li>
                  <li>
                    Nhấp vào dòng đầu tiên (dãy số dạng <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">10.681523, 107.515642</code>) để tự động sao chép.
                  </li>
                  <li>Dán dãy số đó vào ô bên dưới và bấm <strong>"Áp dụng tọa độ"</strong>.</li>
                </ol>
              </div>

              {/* Paste or Input Box */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 text-xs">
                  Dán tọa độ hoặc liên kết Google Maps vào đây:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCoords}
                    onChange={(e) => setInputCoords(e.target.value)}
                    placeholder="Ví dụ: 10.681523, 107.515642"
                    className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleParseAndApply(inputCoords)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors shrink-0"
                  >
                    Áp dụng tọa độ
                  </button>
                </div>
                {parseError && (
                  <p className="text-xs text-rose-600 font-medium">{parseError}</p>
                )}
              </div>

              {/* Real-time coordinates box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    Tọa độ tâm hiện tại
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCoords}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Đã copy!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              {/* Point on Satellite toggle */}
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-cyan-950 flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-cyan-700" />
                    Chế độ chấm điểm trực tiếp trên ảnh vệ tinh
                  </div>
                  <div className="text-[11px] text-cyan-800 mt-0.5">
                    Bật chế độ này và nhấp chuột vào bất kỳ vị trí nào trên bản đồ để di chuyển ghim
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onTogglePickMode(!isPickModeActive)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs ${
                    isPickModeActive
                      ? 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-300'
                      : 'bg-cyan-600 text-white hover:bg-cyan-700'
                  }`}
                >
                  {isPickModeActive ? 'Đang bật (Tắt)' : 'Bật chọn điểm'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Boundary Explanation */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Maximize2 className="w-4 h-4 text-amber-600" />
                  Khoanh vùng khu đất cơ sở (Polygon Boundary):
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Khuôn viên Cơ sở 6 có diện tích 42 ha (~420.000 m²). Đa giác bao quanh được thể hiện bằng đường viền đỏ/cam phát sáng trên ảnh vệ tinh. Bạn có thể tăng giảm chiều ngang, chiều dọc và dời 4 hướng để ôm khít khuôn viên thực tế.
                </p>
              </div>

              {/* Boundary Dimensions Sliders */}
              <div className="space-y-3 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Chiều rộng khuôn viên (Tây - Đông):</span>
                    <span className="font-mono text-amber-800">{widthMeters} mét</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={1400}
                    step={20}
                    value={widthMeters}
                    onChange={(e) => handleDimensionChange(Number(e.target.value), heightMeters)}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-700">Chiều dài khuôn viên (Bắc - Nam):</span>
                    <span className="font-mono text-amber-800">{heightMeters} mét</span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={1600}
                    step={20}
                    value={heightMeters}
                    onChange={(e) => handleDimensionChange(widthMeters, Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                <div className="text-[11px] text-slate-500 italic pt-1 text-center">
                  Diện tích khoanh vùng tương đương:{' '}
                  <strong className="text-slate-800">
                    {((widthMeters * heightMeters) / 10000).toFixed(1)} ha
                  </strong>{' '}
                  (~{Math.round(widthMeters * heightMeters).toLocaleString()} m²)
                </div>
              </div>

              {/* Fine Nudge Directional Pad */}
              <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 text-center mb-2">
                  Dời khung khoanh vùng 4 hướng (mỗi bước 20m)
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNudge('N', 20)}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <ChevronUp className="w-4 h-4" /> Dời Bắc
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleNudge('W', 20)}
                      className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <ChevronLeft className="w-4 h-4" /> Dời Tây
                    </button>
                    <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-mono text-[10px] font-black text-amber-800">
                      20m
                    </div>
                    <button
                      type="button"
                      onClick={() => handleNudge('E', 20)}
                      className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      Dời Đông <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNudge('S', 20)}
                    className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <ChevronDown className="w-4 h-4" /> Dời Nam
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetToDefault();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Khôi phục vị trí gốc
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Hoàn tất & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
