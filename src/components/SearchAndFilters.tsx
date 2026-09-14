import React from 'react';
import { Search, X, MapPin, Loader2, RotateCcw, Compass, Filter } from 'lucide-react';
import { FilterCategory, LocationPermissionState } from '../types';
import { REGIONS } from '../data/facilities';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
  selectedRegionId: string | null;
  onRegionChange: (regionId: string | null) => void;
  locationState: LocationPermissionState;
  onRequestLocation: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  totalResultsCount: number;
}

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  selectedRegionId,
  onRegionChange,
  locationState,
  onRequestLocation,
  onResetFilters,
  hasActiveFilters,
  totalResultsCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[var(--color-border)] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Search Input Row with clear button and accessible label */}
      <div className="relative">
        <label htmlFor="facility-search-input" className="block text-xs font-semibold text-[var(--color-text-main)] mb-1.5">
          Tra cứu cơ sở hỗ trợ
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none" aria-hidden="true">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="facility-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên cơ sở, địa chỉ hoặc khu vực…"
            className="w-full pl-11 pr-10 py-3 text-base text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] bg-[var(--color-bg-light)] border border-[var(--color-border)] rounded-xl focus-accessible transition-all"
            aria-label="Tìm kiếm cơ sở theo tên, địa chỉ hoặc khu vực"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] rounded-lg hover:bg-white/80 transition-colors focus-accessible"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Segmented Control Filters and Location Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div
          role="group"
          aria-label="Bộ lọc danh sách cơ sở"
          className="inline-flex p-1 bg-[var(--color-bg-light)] border border-[var(--color-border)] rounded-xl self-start sm:self-auto w-full sm:w-auto"
        >
          <button
            type="button"
            id="filter-tab-all"
            onClick={() => onFilterChange('all')}
            aria-pressed={activeFilter === 'all'}
            className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold rounded-lg transition-all min-h-[40px] flex items-center justify-center gap-1.5 focus-accessible ${
              activeFilter === 'all'
                ? 'bg-white text-[var(--color-text-main)] shadow-xs border border-[var(--color-border)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <span>Tất cả</span>
          </button>

          <button
            type="button"
            id="filter-tab-near-me"
            onClick={() => onFilterChange('near_me')}
            aria-pressed={activeFilter === 'near_me'}
            className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold rounded-lg transition-all min-h-[40px] flex items-center justify-center gap-1.5 focus-accessible ${
              activeFilter === 'near_me'
                ? 'bg-white text-[var(--color-text-main)] shadow-xs border border-[var(--color-border)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <Compass className="w-4 h-4 text-[var(--color-primary)]" />
            <span>Gần tôi</span>
          </button>

          <button
            type="button"
            id="filter-tab-accepting"
            onClick={() => onFilterChange('accepting')}
            aria-pressed={activeFilter === 'accepting'}
            className={`flex-1 sm:flex-initial px-4 py-2 text-sm font-semibold rounded-lg transition-all min-h-[40px] flex items-center justify-center gap-1.5 focus-accessible ${
              activeFilter === 'accepting'
                ? 'bg-white text-[var(--color-cta)] shadow-xs border border-emerald-200'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--color-cta)]" aria-hidden="true" />
            <span>Đang tiếp nhận</span>
          </button>
        </div>

        {/* Location Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="my-location-button"
            onClick={onRequestLocation}
            disabled={locationState === 'prompting'}
            aria-label="Lấy vị trí của tôi để tính khoảng cách đến cơ sở gần nhất"
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border transition-all min-h-[42px] focus-accessible ${
              locationState === 'granted'
                ? 'bg-[var(--color-cta-light)] text-[var(--color-cta)] border-emerald-300'
                : locationState === 'denied'
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-[var(--color-text-main)] border-[var(--color-border)] hover:bg-[var(--color-primary-light)]'
            }`}
          >
            {locationState === 'prompting' ? (
              <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
            ) : (
              <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
            )}
            <span>
              {locationState === 'prompting'
                ? 'Đang xác định…'
                : locationState === 'granted'
                ? 'Đã bật vị trí của tôi'
                : 'Vị trí của tôi'}
            </span>
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              id="clear-all-filters-btn"
              onClick={onResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-red-50 rounded-xl transition-colors min-h-[42px] focus-accessible shrink-0"
              aria-label="Xóa tất cả các bộ lọc đang chọn"
              title="Đặt lại tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Xóa bộ lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Region Chips for convenient geographical filtering */}
      <div className="pt-2 border-t border-[var(--color-border-subtle)]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
            <Filter className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Khu vực / Quận Huyện:</span>
          </div>
          {selectedRegionId && (
            <button
              type="button"
              onClick={() => onRegionChange(null)}
              className="text-xs text-[var(--color-primary)] hover:underline font-medium"
            >
              Xem tất cả khu vực
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo từng khu vực">
          <button
            type="button"
            onClick={() => onRegionChange(null)}
            aria-pressed={selectedRegionId === null}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all min-h-[32px] focus-accessible ${
              selectedRegionId === null
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'bg-[var(--color-bg-light)] text-[var(--color-text-main)] hover:bg-[var(--color-primary-subtle)] border border-[var(--color-border)]'
            }`}
          >
            Toàn bộ ({totalResultsCount})
          </button>

          {REGIONS.map((region) => {
            const isSelected = selectedRegionId === region.id;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => onRegionChange(isSelected ? null : region.id)}
                aria-pressed={isSelected}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all min-h-[32px] flex items-center gap-1 focus-accessible ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-white shadow-xs ring-2 ring-cyan-600 ring-offset-1'
                    : 'bg-[var(--color-bg-light)] text-[var(--color-text-main)] hover:bg-[var(--color-primary-subtle)] border border-[var(--color-border)]'
                }`}
              >
                <span>{region.name.replace('Khu vực ', '')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
