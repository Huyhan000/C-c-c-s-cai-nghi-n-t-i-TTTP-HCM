import type { ReactNode } from 'react';
import { Facility, UserCoordinates, LatLng } from '../../types';

export interface MapAdapterProps {
  facilities: Facility[];
  selectedFacilityId: string | null;
  selectedRegionId: string | null;
  userLocation: UserCoordinates | null;
  onSelectFacility: (facility: Facility) => void;
  onSelectRegion: (regionId: string) => void;
  onClosePopup: () => void;
  onOpenDetails: (facility: Facility) => void;
  onUpdateFacilityCoordinates?: (facilityId: string, coords: LatLng, boundary: LatLng[]) => void;
  onResetFacilityCoordinates?: (facilityId: string) => void;
}

/**
 * Interface để dễ dàng thay thế bản đồ SVG Prototype bằng
 * Google Maps JavaScript API hoặc Mapbox GL JS sau này.
 */
export interface MapProviderAdapter {
  name: string;
  render: (props: MapAdapterProps) => ReactNode;
}

