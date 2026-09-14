import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building, 
  MapPin, 
  Phone, 
  Calendar, 
  User, 
  ShieldCheck, 
  Mail, 
  Users,
  Maximize,
  ArrowLeft,
  Navigation,
  CheckCircle2,
  Building2,
  HardHat
} from 'lucide-react';
import { Campus, InstitutionInfo, BoardMember, SiteSetting } from '../../types/campus';
import { parseInstitutionInfo } from '../../utils/institutionParser';

interface CampusInfoModalProps {
  campus: Campus;
  institutionInfo?: InstitutionInfo;
  boardMembers: BoardMember[];
  isOpen: boolean;
  onClose: () => void;
  siteSetting?: SiteSetting;
}

const DEFAULT_POLICE_LOGO = 'https://ghcatqoczarmetojcpok.supabase.co/storage/v1/object/public/institution/648be358-1289-449d-a821-b0bd4ada5190.png';

export const CampusInfoModal: React.FC<CampusInfoModalProps> = ({
  campus,
  institutionInfo,
  boardMembers,
  isOpen,
  onClose,
  siteSetting,
}) => {
  const [logoError, setLogoError] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const logoUrl = siteSetting?.logo_url || DEFAULT_POLICE_LOGO;
  const parsed = parseInstitutionInfo(institutionInfo?.description);

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-in fade-in isolate"
      onClick={onClose}
    >
      <div 
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-emerald-700/80 bg-[#072824] text-slate-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Police Emblem */}
        <div className="flex items-center justify-between border-b border-emerald-900/80 bg-[#051e1b] px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900/80 border border-emerald-500/50 p-0.5 shadow-lg">
              {!logoError ? (
                <img
                  src={logoUrl}
                  alt="Logo Công an TP.HCM - PC04"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <ShieldCheck className="h-6 w-6 text-emerald-400" />
              )}
            </div>
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                CÔNG AN THÀNH PHỐ HỒ CHÍ MINH
              </h4>
              <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                PHÒNG CẢNH SÁT ĐIỀU TRA TỘI PHẠM VỀ MA TÚY (PC04)
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/60 border border-emerald-800/80 text-slate-300 hover:bg-rose-900/60 hover:text-white hover:border-rose-700 transition-colors"
            title="Đóng (Esc)"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Facility Name & Former Name Badge */}
          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider">
                <Building2 className="h-3.5 w-3.5" />
                <span>ĐƠN VỊ TRỰC THUỘC</span>
              </span>
              {parsed.formerName && (
                <span className="rounded-full bg-amber-950/80 border border-amber-600/50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                  Tên cũ: {parsed.formerName}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-white mt-1.5 leading-snug">
              {campus.name}
            </h2>

            {institutionInfo?.address && (
              <div className="mt-2 flex items-start gap-2 text-xs text-emerald-200/90 font-medium">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{institutionInfo.address}</span>
              </div>
            )}
          </div>

          {/* Key Statistics Grid (Bento Grid) */}
          {parsed.stats.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                <span>Chỉ Số Quy Mô & Hoạt Động</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {parsed.stats.map((st, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl border p-3 transition-all ${
                      st.highlight
                        ? 'border-emerald-600/60 bg-emerald-900/40 shadow-sm'
                        : 'border-emerald-900/50 bg-emerald-950/40'
                    }`}
                  >
                    <span className="block text-[11px] font-semibold text-emerald-300/80">
                      {st.label}
                    </span>
                    <strong className="block text-sm sm:text-base font-black text-white mt-0.5">
                      {st.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary / Overview Text */}
          <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/30 p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Thông Tin Tổng Quan
            </span>
            <p className="text-xs sm:text-[13px] text-slate-200 leading-relaxed">
              {parsed.cleanOverview}
            </p>
            {parsed.infrastructureNotes && (
              <div className="mt-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/40 p-3 text-xs text-emerald-200/90 flex items-start gap-2">
                <HardHat className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>{parsed.infrastructureNotes}</span>
              </div>
            )}
          </div>

          {/* Contacts & Administration */}
          {(institutionInfo?.phone || institutionInfo?.established || institutionInfo?.email) && (
            <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-4 space-y-2.5 text-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Thông Tin Liên Hệ Hành Chính
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {institutionInfo?.phone && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-950/60 p-2.5 border border-emerald-900/40">
                    <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-white">Điện thoại:</strong> {institutionInfo.phone}
                    </span>
                  </div>
                )}
                {institutionInfo?.established && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-950/60 p-2.5 border border-emerald-900/40">
                    <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-white">Năm thành lập:</strong> {institutionInfo.established}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Leadership Board / Ban Chỉ Huy */}
          {boardMembers.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Ban Chỉ Huy & Ban Giám Đốc ({boardMembers.length} đồng chí)</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {boardMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-2xl border border-emerald-900/50 bg-emerald-950/40 p-3 text-xs"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-emerald-100 font-bold border border-emerald-600/50">
                      {member.photo_url ? (
                        <img
                          src={member.photo_url}
                          alt={member.name}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-slate-100 font-bold text-xs">
                        {member.name}
                      </strong>
                      <span className="block truncate text-[11px] text-emerald-300 font-semibold">
                        {member.title || member.role}
                      </span>
                      {member.department && (
                        <span className="block truncate text-[10.5px] text-slate-400 mt-0.5">
                          {member.department}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer with Clear Return Action */}
        <div className="border-t border-emerald-900/80 bg-[#051e1b] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-emerald-400/80 font-medium hidden sm:inline">
            Nhấn Esc hoặc nút Đóng để quay lại bản đồ
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại bản đồ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
