import React, { useEffect } from 'react';
import { 
  X, 
  Phone, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  HeartHandshake, 
  FileText,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { Facility } from '../types';

interface FacilityDetailModalProps {
  facility: Facility | null;
  onClose: () => void;
}

export const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({
  facility,
  onClose,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (facility) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [facility, onClose]);

  if (!facility) return null;

  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(
    `${facility.name}, ${facility.address}`
  )}&ll=${facility.coordinates.lat},${facility.coordinates.lng}`;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${facility.name}, ${facility.address}`
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-facility-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[var(--color-border)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col focus-accessible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[var(--color-bg-light)] border-b border-[var(--color-border)] p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
              {facility.number}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="modal-facility-title" className="text-lg sm:text-xl font-bold text-[var(--color-text-main)]">
                  {facility.name}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--color-cta-light)] text-[var(--color-cta)] border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {facility.statusLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1 font-medium">
                Khu vực: {facility.district} • Phục hồi chức năng & Hỗ trợ tái hòa nhập
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ chi tiết"
            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white rounded-xl transition-colors focus-accessible shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm">
          {/* Reassurance Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <ShieldCheck className="w-5 h-5 text-[var(--color-cta)] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <strong>Cam kết bảo mật & Nhân văn:</strong> Cơ sở cam kết giữ kín danh tính và thông tin cá nhân của người bệnh theo quy định pháp luật. Mọi hỗ trợ y tế và tâm lý đều đặt sự an toàn và phục hồi của người dân lên hàng đầu.
            </div>
          </div>

          {/* Contact and Management Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border)]">
            <div>
              <span className="text-xs text-[var(--color-text-muted)] block mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Lãnh đạo phụ trách
              </span>
              <span className="text-base font-bold text-[var(--color-text-main)]">
                {facility.leaderTitle || facility.manager}
              </span>
            </div>

            <div>
              <span className="text-xs text-[var(--color-text-muted)] block mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Đường dây liên hệ trực tiếp
              </span>
              <a
                href={`tel:${facility.phone}`}
                className="text-base font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
              >
                <span>{facility.formattedPhone}</span>
              </a>
            </div>
          </div>

          {/* Official Administrative Details (Trại 6 & official units) */}
          {(facility.managingAgency || facility.taxCode || facility.currentStudentCount) && (
            <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-3">
              <h4 className="text-xs font-bold text-cyan-950 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-cyan-700" />
                Thông tin hành chính & Cơ quan chủ quản
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {facility.managingAgency && (
                  <div>
                    <span className="text-slate-500 block">Cơ quan quản lý:</span>
                    <span className="font-bold text-slate-900">{facility.managingAgency}</span>
                  </div>
                )}

                {facility.taxCode && (
                  <div>
                    <span className="text-slate-500 block">Mã số thuế:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {facility.taxCode} {facility.taxActiveDate ? `(Hoạt động từ ${facility.taxActiveDate})` : ''}
                    </span>
                  </div>
                )}

                {facility.distanceFromCATP && (
                  <div>
                    <span className="text-slate-500 block">Khoảng cách từ CATP:</span>
                    <span className="font-bold text-amber-700">{facility.distanceFromCATP}</span>
                  </div>
                )}

                {facility.currentStudentCount && (
                  <div>
                    <span className="text-slate-500 block">Số học viên gần đây:</span>
                    <span className="font-bold text-emerald-700">{facility.currentStudentCount}</span>
                  </div>
                )}
              </div>

              {/* Capacity Growth Timeline */}
              {facility.studentCountHistory && facility.studentCountHistory.length > 0 && (
                <div className="pt-2 border-t border-cyan-200">
                  <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                    Biến động quy mô học viên (Thiết kế ban đầu: {facility.designedCapacity || '1.000 học viên'}):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {facility.studentCountHistory.map((item, idx) => (
                      <div key={idx} className="bg-white/80 p-2 rounded-xl border border-cyan-200/80 text-center">
                        <div className="text-[10px] text-slate-500">{item.period}</div>
                        <div className="text-xs font-bold text-cyan-900 mt-0.5">{item.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {facility.historicalNote && (
                <div className="text-xs text-slate-600 bg-white/70 p-2.5 rounded-xl border border-cyan-200/60 leading-relaxed">
                  <strong>Ghi chú chuyển giao:</strong> {facility.historicalNote}
                </div>
              )}
            </div>
          )}

          {/* Location & Address Details */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
              Địa chỉ & Phân khu
            </h4>
            <div className="p-3.5 rounded-xl border border-[var(--color-border-subtle)] bg-slate-50 space-y-2">
              <p className="font-medium text-[var(--color-text-main)]">
                {facility.address}
              </p>
              {facility.subUnits && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5 text-xs text-[var(--color-text-muted)]">
                  {facility.subUnits.map((sub, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="font-bold text-[var(--color-text-main)]">• {sub.name}:</span>
                      <span>{sub.address}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Working hours */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[var(--color-primary)]" />
              Thời gian tiếp nhận
            </h4>
            <p className="text-xs sm:text-sm text-[var(--color-text-main)] bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
              {facility.operatingHours}
            </p>
          </div>

          {/* Core Services */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-[var(--color-primary)]" />
              Chương trình & Dịch vụ chuyên môn
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-[var(--color-text-main)]">
              {facility.services.map((svc, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-[var(--color-bg-light)] p-2.5 rounded-xl border border-[var(--color-border-subtle)]">
                  <CheckCircle2 className="w-4 h-4 text-[var(--color-cta)] shrink-0 mt-0.5" />
                  <span>{svc}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Admission & Advisory Guide */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[var(--color-primary)]" />
              Hướng dẫn tiếp nhận & Đăng ký
            </h4>
            <p className="text-xs sm:text-sm text-[var(--color-text-main)] leading-relaxed bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              {facility.admissionNote}
            </p>
          </div>

          {/* Land Area & Cadastral Satellite Section */}
          <div>
            <h4 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--color-primary)]" />
              Thông tin khuôn viên & Trích lục ranh giới khu đất
            </h4>
            <div className="rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden bg-slate-900 text-white">
              <div className="relative h-44 sm:h-52 w-full overflow-hidden">
                <img
                  src={facility.satelliteImageUrl}
                  alt={`Ảnh chụp vệ tinh khuôn viên ${facility.name}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg shadow-sm">
                      Khuôn viên: {facility.areaFormatted}
                    </span>
                    <span className="text-xs bg-slate-900/80 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-500/40">
                      Toạ độ: {facility.coordinates.lat.toFixed(4)}°B, {facility.coordinates.lng.toFixed(4)}°Đ
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium mt-1.5">
                    {facility.cadastralInfo || 'Đã khoanh vùng ranh giới khép góc'}
                  </p>
                </div>
              </div>
              <div className="p-3.5 bg-slate-800/90 text-xs text-slate-300 flex items-center justify-between gap-2 border-t border-slate-700">
                <span>Ranh giới: {facility.compoundBoundary.length} điểm mốc GPS khép góc khuôn viên</span>
                <span className="text-cyan-400 font-semibold">Tỉ lệ 1:2000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[var(--color-bg-light)] border-t border-[var(--color-border)] p-4 sm:p-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[var(--color-text-main)] hover:bg-slate-200 rounded-xl transition-colors min-h-[44px] focus-accessible"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={appleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 text-white hover:bg-sky-500 shadow-xs transition-colors min-h-[44px] focus-accessible"
              title="Mở chỉ đường trên Apple Maps"
            >
              <span className="text-xs"></span>
              <span>Chỉ đường Apple</span>
              <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
            </a>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-white border border-[var(--color-border)] text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] focus-accessible"
              title="Mở trên Google Maps"
            >
              <Navigation className="w-3.5 h-3.5 text-slate-500" />
              <span>Google</span>
            </a>

            <a
              href={`tel:${facility.phone}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta-hover)] shadow-xs transition-colors min-h-[44px] focus-accessible"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi {facility.formattedPhone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
