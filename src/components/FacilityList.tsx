import React, { useEffect, useRef } from 'react';
import { Facility, RegionZone } from '../types';
import { FacilityCard } from './FacilityCard';
import { Building2, RotateCcw, HelpCircle } from 'lucide-react';

interface FacilityListProps {
  facilities: Facility[];
  selectedFacilityId: string | null;
  onSelectFacility: (facility: Facility) => void;
  onOpenDetails: (facility: Facility) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  activeRegion: RegionZone | undefined;
  searchQuery: string;
}

export const FacilityList: React.FC<FacilityListProps> = ({
  facilities,
  selectedFacilityId,
  onSelectFacility,
  onOpenDetails,
  onResetFilters,
  hasActiveFilters,
  activeRegion,
  searchQuery,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected facility card into view smoothly
  useEffect(() => {
    if (selectedFacilityId) {
      const el = document.getElementById(`facility-card-${selectedFacilityId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedFacilityId]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header status count with aria-live */}
      <div className="flex items-center justify-between px-1 py-1" aria-live="polite">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
          <h2 className="text-base sm:text-lg font-bold text-[var(--color-text-main)]">
            {activeRegion 
              ? `${activeRegion.name}` 
              : searchQuery 
              ? `Kết quả tìm kiếm: "${searchQuery}"`
              : 'Danh sách cơ sở tiếp nhận'}
          </h2>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-hover)] border border-[var(--color-border)]">
          {facilities.length} cơ sở
        </span>
      </div>

      {/* Facility Cards List */}
      <div 
        ref={containerRef}
        className="space-y-3 overflow-y-auto max-h-[750px] pr-1 pb-4 scroll-smooth focus-accessible"
        tabIndex={0}
        aria-label="Danh sách các cơ sở hỗ trợ"
      >
        {facilities.length > 0 ? (
          facilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              isSelected={selectedFacilityId === facility.id}
              onSelect={onSelectFacility}
              onOpenDetails={onOpenDetails}
            />
          ))
        ) : (
          /* Empty State when 0 results found */
          <div 
            role="status"
            className="rounded-2xl border-2 border-dashed border-[var(--color-border)] p-8 text-center bg-white space-y-4 shadow-xs my-4"
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--color-bg-light)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]" aria-hidden="true">
              <HelpCircle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base font-bold text-[var(--color-text-main)]">
                Không tìm thấy cơ sở phù hợp
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                Không có cơ sở nào trùng khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Bạn có thể thử tìm với từ khóa chung hơn hoặc bấm nút bên dưới.
              </p>
            </div>

            <div>
              <button
                type="button"
                id="empty-reset-filters-btn"
                onClick={onResetFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-hover)] transition-colors shadow-xs min-h-[44px] focus-accessible"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Xóa bộ lọc & Xem toàn bộ 6 cơ sở</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
