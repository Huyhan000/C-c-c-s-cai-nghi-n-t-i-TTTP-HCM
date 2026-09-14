import { UserCoordinates, LatLng } from '../types';

/**
 * Trụ sở Công an Thành phố Hồ Chí Minh (CATP)
 * 268 Trần Hưng Đạo, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM
 * Điểm mốc quy chiếu chuẩn của lực lượng quản lý
 */
export const CATP_HEADQUARTERS: {
  name: string;
  shortName: string;
  address: string;
  coordinates: LatLng;
} = {
  name: 'Trụ sở Công an Thành phố Hồ Chí Minh (CATP)',
  shortName: 'Trụ sở CATP (Q.1)',
  address: '268 Trần Hưng Đạo, Phường Nguyễn Cư Trinh, Quận 1, TP.HCM',
  coordinates: {
    lat: 10.7602,
    lng: 106.6917,
  },
};

/**
 * Calculates great-circle distance between two points in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);

  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Estimate road driving distance based on straight-line distance and road winding factor (~1.25 - 1.30)
 */
export function estimateRoadDistanceKm(straightDistanceKm: number): number {
  if (straightDistanceKm < 5) return Math.round((straightDistanceKm * 1.35) * 10) / 10;
  if (straightDistanceKm < 30) return Math.round((straightDistanceKm * 1.30) * 10) / 10;
  return Math.round((straightDistanceKm * 1.28) * 10) / 10;
}

/**
 * Estimate driving travel time in minutes based on realistic road speeds in southern Vietnam
 */
export function estimateDrivingTimeMinutes(roadDistanceKm: number): number {
  // Speed model: ~35 km/h in urban, ~55 km/h on highways/provincial roads
  let hours = 0;
  if (roadDistanceKm <= 15) {
    hours = roadDistanceKm / 32;
  } else {
    const urbanPart = 12 / 32;
    const highwayPart = (roadDistanceKm - 12) / 55;
    hours = urbanPart + highwayPart;
  }
  return Math.max(5, Math.round(hours * 60));
}

export function formatTravelTime(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} phút`;
  }
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `~${hrs} giờ`;
  return `~${hrs} giờ ${mins} phút`;
}

export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || distanceKm === null) return '';
  if (distanceKm < 1) {
    return `Cách bạn ${Math.round(distanceKm * 1000)}m`;
  }
  return `Cách bạn ~${distanceKm.toFixed(1)} km`;
}

/**
 * Calculates cardinal compass direction in Vietnamese from origin to destination
 */
export function getCompassDirection(from: LatLng, to: LatLng): string {
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  if (bearing >= 337.5 || bearing < 22.5) return 'Bắc';
  if (bearing >= 22.5 && bearing < 67.5) return 'Đông Bắc';
  if (bearing >= 67.5 && bearing < 112.5) return 'Đông';
  if (bearing >= 112.5 && bearing < 157.5) return 'Đông Nam';
  if (bearing >= 157.5 && bearing < 202.5) return 'Nam';
  if (bearing >= 202.5 && bearing < 247.5) return 'Tây Nam';
  if (bearing >= 247.5 && bearing < 292.5) return 'Tây';
  return 'Tây Bắc';
}

/**
 * Creates intermediate points along an arc for drawing smooth 3D curved measurement lines on the map
 */
export function createArcPoints(start: LatLng, end: LatLng, numPoints = 30): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lng = start.lng + (end.lng - start.lng) * t;
    const lat = start.lat + (end.lat - start.lat) * t;
    points.push([lng, lat]);
  }
  return points;
}
