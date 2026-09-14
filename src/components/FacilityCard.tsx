import React from 'react';
import { Phone, Navigation, Info, UserCheck, Clock, CheckCircle, ExternalLink, MapPin } from 'lucide-react';
import { Facility } from '../types';
import { formatDistance } from '../utils/distance';

interface FacilityCardProps {
  facility: Facility;
  isSelected: boolean;
  onSelect: (facility: Facility) => void;
  onOpenDetails: (facility: Facility) => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  isSelected,
  onSelect,
  onOpenDetails,
}) => {
  // Apple Maps search & directions link
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(
    `${facility.name}, ${facility.address}`
  )}&ll=${facility.coordinates.lat},${facility.coordinates.lng}`;

  // Google Maps fallback query
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${facility.name}, ${facility.address}`
  )}`;

  return (
    <article
      id={`facility-card-${facility.id}`}
      tabIndex={0}
      role="region"
      aria-label={`Chi tiết ${facility.name}`}
      onClick={() => onSelect(facility)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(facility);
        }
      }}
      className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 border cursor-pointer focus-accessible ${
        isSelected
          ? 'bg-white border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] shadow-md translate-y-[-2px]'
          : 'bg-white border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-xs'
      }`}
    >
      {/* Top row: Number Badge, Name, and Status Pill */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl font-bold text-base flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-[var(--color-primary-subtle)] text-[var(--color-text-main)] border border-[var(--color-border)]'
            }`}
            aria-label={`Cơ sở số ${facility.number}`}
          >
            {facility.number}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-main)] leading-snug">
              {facility.name}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {facility.distanceKm !== undefined && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-cta)] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Navigation className="w-3 h-3" />
                  {formatDistance(facility.distanceKm)}
                </span>
              )}
              {facility.distanceFromCATP && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <span>🏛️ Cách CATP {facility.distanceFromCATP}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <span
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-cta-light)] text-[var(--color-cta)] border border-emerald-200 shrink-0"
          title="Trạng thái tiếp nhận hồ sơ"
        >
          <CheckCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{facility.statusLabel}</span>
        </span>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 text-xs sm:text-sm text-[var(--color-text-main)] mb-2.5">
        <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" aria-hidden="true" />
        <span className="leading-relaxed">
          {facility.address}
        </span>
      </div>

      {/* Sub-branches (e.g. Bình Triệu & Bố Lá) */}
      {facility.subUnits && facility.subUnits.length > 0 && (
        <div className="mb-3 pl-6 space-y-1.5 text-xs text-[var(--color-text-muted)] border-l-2 border-[var(--color-border)] ml-2">
          {facility.subUnits.map((sub, idx) => (
            <div key={idx} className="leading-tight">
              <strong className="text-[var(--color-text-main)]">{sub.name}:</strong> {sub.address}
            </div>
          ))}
        </div>
      )}

      {/* Manager & Phone metadata block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 sm:p-3 rounded-xl bg-[var(--color-bg-light)] border border-[var(--color-border-subtle)] text-xs mb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
          <span className="text-[var(--color-text-muted)]">Trưởng cơ sở:</span>
          <strong className="text-[var(--color-text-main)] font-semibold">{facility.manager}</strong>
        </div>

        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
          <span className="text-[var(--color-text-muted)]">Điện thoại:</span>
          <a
            href={`tel:${facility.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-[var(--color-primary)] hover:underline focus-accessible rounded"
            aria-label={`Gọi điện thoại cho trưởng cơ sở ${facility.manager} số ${facility.formattedPhone}`}
          >
            {facility.formattedPhone}
          </a>
        </div>
      </div>

      {/* Action Buttons: Gọi ngay, Chỉ đường, Chi tiết */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2">
          {/* Call now button */}
          <a
            id={`call-facility-${facility.id}`}
            href={`tel:${facility.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta-hover)] shadow-xs transition-colors min-h-[44px] focus-accessible"
            aria-label={`Gọi ngay tới ${facility.name} theo số ${facility.formattedPhone}`}
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span>Gọi ngay</span>
          </a>

          {/* Direction link to Apple Maps */}
          <a
            id={`directions-facility-${facility.id}`}
            href={appleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors min-h-[44px] focus-accessible shadow-2xs"
            aria-label={`Xem chỉ đường đến ${facility.name} trên Apple Maps (mở trong tab mới)`}
            title="Mở chỉ đường trên Apple Maps"
          >
            <span className="text-xs"></span>
            <span>Chỉ đường</span>
            <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
          </a>
        </div>

        {/* View Details modal button */}
        <button
          type="button"
          id={`details-facility-${facility.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(facility);
          }}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-[var(--color-text-main)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] transition-colors min-h-[44px] focus-accessible"
          aria-label={`Xem thông tin chi tiết về ${facility.name}`}
        >
          <Info className="w-4 h-4 text-[var(--color-primary)]" />
          <span>Chi tiết</span>
        </button>
      </div>
    </article>
  );
};
