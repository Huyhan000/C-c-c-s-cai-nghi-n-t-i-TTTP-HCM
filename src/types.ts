export type FacilityStatus = 'accepting' | 'consultation' | 'temporarily_limited';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FacilitySubUnit {
  name: string;
  address: string;
  phone?: string;
  coordinates: LatLng;
  mapSvgCoords?: {
    x: number;
    y: number;
  };
}

export interface Facility {
  id: string;
  number: number;
  name: string;
  shortName: string;
  status: FacilityStatus;
  statusLabel: string;
  address: string;
  subUnits?: FacilitySubUnit[];
  district: string;
  regionId: string;
  manager: string;
  phone: string;
  formattedPhone: string;
  coordinates: LatLng;
  // Stylized SVG position percentage [0-100] for interactive prototype map
  mapSvgCoords: {
    x: number;
    y: number;
  };
  // Detailed land parcel & boundary polygon for satellite overlay
  compoundBoundary: LatLng[];
  areaHectares: number;
  areaFormatted: string;
  cadastralInfo?: string;
  satelliteImageUrl: string;
  operatingHours: string;
  services: string[];
  admissionNote: string;
  distanceKm?: number;
  // Official administrative data (e.g. Trại 6)
  managingAgency?: string;
  taxCode?: string;
  taxActiveDate?: string;
  leaderTitle?: string;
  designedCapacity?: string;
  studentCountHistory?: { period: string; count: string }[];
  currentStudentCount?: string;
  distanceFromCATP?: string;
  historicalNote?: string;
}

export type FilterCategory = 'all' | 'near_me' | 'accepting';

export interface RegionZone {
  id: string;
  name: string;
  description: string;
  svgPath: string;
  center: { x: number; y: number };
  centerCoords: LatLng;
  polygonCoords: LatLng[];
  areaHectares: number;
  areaFormatted: string;
  facilityCount: number;
}

export type LocationPermissionState = 'idle' | 'prompting' | 'granted' | 'denied' | 'unsupported';

export interface UserCoordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export type MobileTab = 'map' | 'list';

export type MapDisplayMode = 'satellite' | 'hybrid' | 'roadmap';

export type AppleMapType = 'standard' | 'satellite' | 'hybrid' | 'embed';

export type ActiveMapEngine = 'apple' | 'maplibre';

declare global {
  interface Window {
    mapkit?: any;
  }
}

