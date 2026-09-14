import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Navigation, 
  Layers, 
  Maximize2, 
  Compass, 
  Crosshair, 
  MapPin, 
  Ruler, 
  Car, 
  Plane, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink, 
  Phone, 
  Info, 
  Copy, 
  Check, 
  X,
  Key
} from 'lucide-react';
import { Facility, LatLng } from '../../types';
import { REGIONS } from '../../data/facilities';
import { 
  calculateDistanceKm, 
  estimateRoadDistanceKm, 
  CATP_HEADQUARTERS 
} from '../../utils/distance';
import { MapAdapterProps } from './MapAdapter';
import { 
  LocationCalibrationModal, 
  calculateBoundaryDimensions, 
  generateRectangularBoundary 
} from './LocationCalibrationModal';
import { AppleMapsConfigModal } from './AppleMapsConfigModal';

// Apple Maps Tile Styles
// Standard: Clean Cupertino pastel roads, soft greens, Cupertino water blue
// Satellite: Photorealistic imagery
// Hybrid: Satellite with roads & labels
export type AppleMapStyleKey = 'standard' | 'satellite' | 'hybrid' | 'embed';

const APPLE_STANDARD_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'apple-standard-tiles': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '© Apple Maps Style / OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'apple-standard-layer',
      type: 'raster',
      source: 'apple-standard-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const APPLE_SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'apple-sat-tiles': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution: '© Apple Imagery Partner Services',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'apple-sat-layer',
      type: 'raster',
      source: 'apple-sat-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const APPLE_HYBRID_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    'apple-hybrid-sat': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
    'apple-hybrid-roads': {
      type: 'raster',
      tiles: [
        'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'apple-hybrid-sat-layer',
      type: 'raster',
      source: 'apple-hybrid-sat',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'apple-hybrid-roads-layer',
      type: 'raster',
      source: 'apple-hybrid-roads',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const DEFAULT_CENTER: [number, number] = [106.85, 11.2]; // Southern Vietnam view covering TP.HCM to Đắk Nông
const DEFAULT_ZOOM = 8;

export const AppleMapView: React.FC<MapAdapterProps> = ({
  facilities,
  selectedFacilityId,
  selectedRegionId,
  userLocation,
  onSelectFacility,
  onSelectRegion,
  onClosePopup,
  onOpenDetails,
  onUpdateFacilityCoordinates,
  onResetFacilityCoordinates,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const catpMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Map state
  const [mapStyle, setMapStyle] = useState<AppleMapStyleKey>('standard');
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [isMeasuring, setIsMeasuring] = useState<boolean>(false);
  const [measureOrigin, setMeasureOrigin] = useState<'user' | 'catp'>('catp');

  // Calibration & Cursor Tracking State
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isPickModeActive, setIsPickModeActive] = useState<boolean>(false);
  const [cursorCoords, setCursorCoords] = useState<LatLng | null>(null);
  const [copiedCursor, setCopiedCursor] = useState<boolean>(false);

  // Apple MapKit JS configuration state
  const [jwtToken, setJwtToken] = useState<string>(() => {
    return localStorage.getItem('apple_maps_jwt_token') || (import.meta as any).env?.VITE_APPLE_MAPS_TOKEN || '';
  });
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isMapKitJsActive, setIsMapKitJsActive] = useState<boolean>(false);

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  // Mutable refs for click handling without stale closures
  const isPickModeActiveRef = useRef<boolean>(false);
  isPickModeActiveRef.current = isPickModeActive;
  const selectedFacilityRef = useRef<Facility | null>(selectedFacility || null);
  selectedFacilityRef.current = selectedFacility || null;

  // Active origin for distance calculation
  const originCoords = useMemo<LatLng>(() => {
    if (measureOrigin === 'user' && userLocation) {
      return { lat: userLocation.lat, lng: userLocation.lng };
    }
    return CATP_HEADQUARTERS;
  }, [measureOrigin, userLocation]);

  // Distance to selected facility
  const measuredDistanceKm = useMemo(() => {
    if (!selectedFacility) return null;
    return calculateDistanceKm(
      originCoords,
      selectedFacility.coordinates
    );
  }, [selectedFacility, originCoords]);

  // Build GeoJSON Polygons for compounds
  const buildCompoundsGeoJSON = useCallback((): GeoJSON.FeatureCollection<GeoJSON.Polygon> => {
    return {
      type: 'FeatureCollection',
      features: facilities
        .filter((f) => f.compoundBoundary && f.compoundBoundary.length >= 3)
        .map((facility) => {
          const coords = facility.compoundBoundary.map((pt) => [pt.lng, pt.lat]);
          const first = coords[0];
          const last = coords[coords.length - 1];
          const ring =
            first[0] === last[0] && first[1] === last[1] ? coords : [...coords, first];

          return {
            type: 'Feature' as const,
            properties: {
              facilityId: facility.id,
              name: facility.name,
              number: facility.number,
              areaFormatted: facility.areaFormatted,
            },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [ring],
            },
          };
        }),
    };
  }, [facilities]);

  // Build GeoJSON Line for distance measurement
  const buildMeasurementLineGeoJSON = useCallback((): GeoJSON.FeatureCollection<GeoJSON.LineString> => {
    if (!isMeasuring || !selectedFacility) {
      return { type: 'FeatureCollection', features: [] };
    }

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            distanceFormatted: `${measuredDistanceKm || 0} km`,
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [originCoords.lng, originCoords.lat],
              [selectedFacility.coordinates.lng, selectedFacility.coordinates.lat],
            ],
          },
        },
      ],
    };
  }, [isMeasuring, selectedFacility, originCoords, measuredDistanceKm]);

  // Add 3D compound layers and measurement lines
  const addAppleMapLayers = useCallback(
    (map: maplibregl.Map) => {
      // 1. Compound Boundary Source
      if (!map.getSource('apple-compounds-source')) {
        map.addSource('apple-compounds-source', {
          type: 'geojson',
          data: buildCompoundsGeoJSON(),
        });
      }

      // 2. Compound Extrusion / Fill
      if (!map.getLayer('apple-compounds-fill')) {
        map.addLayer({
          id: 'apple-compounds-fill',
          type: 'fill',
          source: 'apple-compounds-source',
          paint: {
            'fill-color': [
              'case',
              ['==', ['get', 'facilityId'], selectedFacilityId || ''],
              '#ef4444',
              '#0284c7',
            ],
            'fill-opacity': [
              'case',
              ['==', ['get', 'facilityId'], selectedFacilityId || ''],
              0.28,
              0.15,
            ],
          },
        });
      }

      // 3. Glowing Outline
      if (!map.getLayer('apple-compounds-glow')) {
        map.addLayer({
          id: 'apple-compounds-glow',
          type: 'line',
          source: 'apple-compounds-source',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'facilityId'], selectedFacilityId || ''],
              '#ef4444',
              '#0284c7',
            ],
            'line-width': [
              'case',
              ['==', ['get', 'facilityId'], selectedFacilityId || ''],
              8,
              3,
            ],
            'line-blur': 4,
            'line-opacity': [
              'case',
              ['==', ['get', 'facilityId'], selectedFacilityId || ''],
              0.65,
              0.25,
            ],
          },
        });
      }

      // 4. Sharp Crisp Edge
      if (!map.getLayer('apple-compounds-outline')) {
        map.addLayer({
          id: 'apple-compounds-outline',
          type: 'line',
          source: 'apple-compounds-source',
          paint: {
            'line-color': [
              'case',
              ['==', ['get', 'facilityId'], selectedFacilityId || ''],
              '#dc2626',
              '#0369a1',
            ],
            'line-width': [
              'case',
              ['==', ['get', 'facilityId'], selectedFacilityId || ''],
              3.5,
              2,
            ],
            'line-opacity': 1,
          },
        });
      }

      // 5. Distance Measurement Line Source
      if (!map.getSource('apple-measure-line-source')) {
        map.addSource('apple-measure-line-source', {
          type: 'geojson',
          data: buildMeasurementLineGeoJSON(),
        });
      }

      // 6. Measurement Line Layers
      if (!map.getLayer('apple-measure-line-glow')) {
        map.addLayer({
          id: 'apple-measure-line-glow',
          type: 'line',
          source: 'apple-measure-line-source',
          paint: {
            'line-color': '#0ea5e9',
            'line-width': 8,
            'line-blur': 3,
            'line-opacity': 0.7,
          },
        });
      }

      if (!map.getLayer('apple-measure-line')) {
        map.addLayer({
          id: 'apple-measure-line',
          type: 'line',
          source: 'apple-measure-line-source',
          paint: {
            'line-color': '#38bdf8',
            'line-width': 3.5,
            'line-dasharray': [2, 1.5],
          },
        });
      }
    },
    [buildCompoundsGeoJSON, buildMeasurementLineGeoJSON, selectedFacilityId]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialStyle =
      mapStyle === 'satellite'
        ? APPLE_SATELLITE_STYLE
        : mapStyle === 'hybrid'
        ? APPLE_HYBRID_STYLE
        : APPLE_STANDARD_STYLE;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: 35,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('load', () => {
      setIsMapLoaded(true);
      addAppleMapLayers(map);
    });

    // Point Picking Mode
    map.on('click', (e) => {
      if (isPickModeActiveRef.current && selectedFacilityRef.current) {
        const clickedLat = Number(e.lngLat.lat.toFixed(6));
        const clickedLng = Number(e.lngLat.lng.toFixed(6));
        const dims = calculateBoundaryDimensions(selectedFacilityRef.current.compoundBoundary);
        const newBoundary = generateRectangularBoundary(
          { lat: clickedLat, lng: clickedLng },
          dims.width,
          dims.height
        );
        if (onUpdateFacilityCoordinates) {
          onUpdateFacilityCoordinates(
            selectedFacilityRef.current.id,
            { lat: clickedLat, lng: clickedLng },
            newBoundary
          );
        }
        setIsPickModeActive(false);
      }
    });

    // Real-time cursor coordinates tracking
    map.on('mousemove', (e) => {
      setCursorCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync cursor appearance when Pick Mode is active
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isPickModeActive ? 'crosshair' : '';
  }, [isPickModeActive]);

  // Update Style when mapStyle changed (standard / satellite / hybrid)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded || mapStyle === 'embed') return;

    const targetStyle =
      mapStyle === 'satellite'
        ? APPLE_SATELLITE_STYLE
        : mapStyle === 'hybrid'
        ? APPLE_HYBRID_STYLE
        : APPLE_STANDARD_STYLE;

    map.setStyle(targetStyle);
    map.once('style.load', () => {
      addAppleMapLayers(map);
    });
  }, [mapStyle, isMapLoaded, addAppleMapLayers]);

  // Update Dynamic Compounds GeoJSON & paint properties
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const source = map.getSource('apple-compounds-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(buildCompoundsGeoJSON());
    }

    if (map.getLayer('apple-compounds-fill')) {
      map.setPaintProperty('apple-compounds-fill', 'fill-color', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        '#ef4444',
        '#0284c7',
      ]);
      map.setPaintProperty('apple-compounds-fill', 'fill-opacity', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        0.3,
        0.12,
      ]);
    }

    if (map.getLayer('apple-compounds-glow')) {
      map.setPaintProperty('apple-compounds-glow', 'line-color', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        '#ef4444',
        '#0284c7',
      ]);
      map.setPaintProperty('apple-compounds-glow', 'line-width', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        8,
        3,
      ]);
    }

    if (map.getLayer('apple-compounds-outline')) {
      map.setPaintProperty('apple-compounds-outline', 'line-color', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        '#dc2626',
        '#0369a1',
      ]);
      map.setPaintProperty('apple-compounds-outline', 'line-width', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        3.5,
        2,
      ]);
    }
  }, [buildCompoundsGeoJSON, isMapLoaded, selectedFacilityId]);

  // Update Dynamic Measurement Line GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const source = map.getSource('apple-measure-line-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(buildMeasurementLineGeoJSON());
    }
  }, [buildMeasurementLineGeoJSON, isMapLoaded]);

  // Render Apple-style Teardrop Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    facilities.forEach((facility) => {
      const isSelected = facility.id === selectedFacilityId;

      // Outer Apple Pin Marker container
      const el = document.createElement('div');
      el.className = 'group cursor-pointer relative';
      el.setAttribute('tabindex', '0');
      el.setAttribute('aria-label', `Cơ sở ${facility.name}`);

      // Apple Maps signature pin design:
      // Red teardrop pin for accepting/active with glossy circle & SF typography number
      const pinColor = isSelected
        ? 'bg-gradient-to-b from-red-500 to-red-600 border-white ring-4 ring-red-500/40'
        : facility.status === 'accepting'
        ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-white ring-2 ring-emerald-500/30'
        : 'bg-gradient-to-b from-amber-500 to-amber-600 border-white ring-2 ring-amber-500/30';

      const pinSize = isSelected ? 'w-10 h-10' : 'w-8 h-8';
      const numberSize = isSelected ? 'text-sm' : 'text-xs';

      el.innerHTML = `
        <div class="relative flex flex-col items-center transition-all duration-300 transform group-hover:scale-110 ${
          isSelected ? 'scale-115 z-30' : 'z-10'
        }">
          <div class="${pinSize} rounded-full border-2 ${pinColor} flex items-center justify-center text-white font-extrabold shadow-xl transition-all">
            <span class="${numberSize} font-sans drop-shadow-xs">${facility.number}</span>
          </div>
          <div class="w-2 h-2 -mt-1 rotate-45 ${isSelected ? 'bg-red-600' : 'bg-slate-700'} shadow-xs"></div>
          
          <!-- Apple pill label on hover / selection -->
          <div class="absolute -top-8 px-2.5 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-white font-medium text-[11px] whitespace-nowrap shadow-lg border border-slate-700 transition-opacity duration-200 pointer-events-none ${
            isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }">
            ${facility.shortName || facility.name}
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectFacility(facility);
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([facility.coordinates.lng, facility.coordinates.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [facilities, selectedFacilityId, isMapLoaded, onSelectFacility]);

  // Render Origin Marker (CATP or User GPS)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (catpMarkerRef.current) {
      catpMarkerRef.current.remove();
      catpMarkerRef.current = null;
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (isMeasuring) {
      const el = document.createElement('div');
      el.className = 'cursor-pointer relative z-20';
      const isUser = measureOrigin === 'user' && userLocation;

      el.innerHTML = `
        <div class="flex items-center gap-1.5 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-sky-400 shadow-xl backdrop-blur-md animate-bounce">
          <span class="w-2 h-2 rounded-full ${isUser ? 'bg-emerald-400' : 'bg-red-400'} animate-ping"></span>
          <span>${isUser ? 'Vị trí của bạn' : 'Trụ sở CATP'}</span>
        </div>
      `;

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([originCoords.lng, originCoords.lat])
        .addTo(map);

      catpMarkerRef.current = marker;
    }
  }, [isMeasuring, measureOrigin, userLocation, originCoords, isMapLoaded]);

  // Fly to Selected Facility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFacility) return;

    map.flyTo({
      center: [selectedFacility.coordinates.lng, selectedFacility.coordinates.lat],
      zoom: selectedFacility.id === 'co-so-6' ? 14.5 : 14,
      pitch: 45,
      bearing: 15,
      duration: 1600,
      essential: true,
    });
  }, [selectedFacility]);

  // Apple Maps deep link URLs
  const appleMapsWebUrl = useMemo(() => {
    if (!selectedFacility) return 'https://maps.apple.com/';
    return `https://maps.apple.com/?q=${encodeURIComponent(
      `${selectedFacility.name}, ${selectedFacility.address}`
    )}&ll=${selectedFacility.coordinates.lat},${selectedFacility.coordinates.lng}&z=16`;
  }, [selectedFacility]);

  const appleMapsAppUrl = useMemo(() => {
    if (!selectedFacility) return 'maps://';
    return `maps://?q=${encodeURIComponent(
      selectedFacility.name
    )}&ll=${selectedFacility.coordinates.lat},${selectedFacility.coordinates.lng}`;
  }, [selectedFacility]);

  const appleMapsDirectionsUrl = useMemo(() => {
    if (!selectedFacility) return 'https://maps.apple.com/';
    return `https://maps.apple.com/?daddr=${selectedFacility.coordinates.lat},${selectedFacility.coordinates.lng}&dirflg=d`;
  }, [selectedFacility]);

  // Handle Token Saved from Config Modal
  const handleSaveToken = (token: string) => {
    setJwtToken(token);
    localStorage.setItem('apple_maps_jwt_token', token);
    if (token) {
      setIsMapKitJsActive(true);
    } else {
      setIsMapKitJsActive(false);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-300/80 bg-slate-900 select-none flex flex-col">
      {/* Apple Maps Cupertino Floating Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        {/* Apple Maps Logo & Brand Pill */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100">
          <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-slate-900 to-slate-700 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            
          </div>
          <span className="font-bold tracking-tight">Apple Maps</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
            Miễn phí 100%
          </span>
        </div>

        {/* Apple Style Switcher & Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMapStyle('standard')}
            className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
              mapStyle === 'standard'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Bản đồ
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
              mapStyle === 'satellite'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Vệ tinh
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('hybrid')}
            className={`px-2.5 py-1.5 rounded-xl font-medium transition-all ${
              mapStyle === 'hybrid'
                ? 'bg-sky-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hỗn hợp
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('embed')}
            className={`px-2.5 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1 ${
              mapStyle === 'embed'
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Mở ứng dụng Apple Maps & Xem nhúng"
          >
            <span>Nhúng & App</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Developer Token & Calibration Action */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-emerald-300/80 dark:border-emerald-700/60 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            title="Bản đồ đang hoạt động miễn phí, không yêu cầu API Key"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Không cần Key</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!selectedFacility) {
                const f6 = facilities.find((f) => f.id === 'co-so-6') || facilities[0];
                if (f6) onSelectFacility(f6);
              }
              setIsCalibrationOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg text-xs font-bold hover:from-red-500 hover:to-rose-500 transition-all border border-red-400"
            title="Hiệu chỉnh tọa độ và kích thước khoanh vùng khuôn viên theo Google/Apple Maps"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khoanh vùng 3D</span>
          </button>
        </div>
      </div>

      {/* Main Map View Area: Either MapLibre Cupertino Canvas OR Apple Maps Embed */}
      {mapStyle === 'embed' ? (
        <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-4 relative pt-16">
          <div className="w-full h-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col">
            {/* Embed Header Bar */}
            <div className="px-4 py-3 bg-slate-800 flex items-center justify-between border-b border-slate-700 text-xs text-white">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-bold text-sky-400">Xem trực tiếp & Dẫn đường Apple Maps</span>
                <span className="text-slate-400">|</span>
                <span className="truncate max-w-xs">{selectedFacility?.name || 'Cơ sở cai nghiện TP.HCM'}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={appleMapsWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold flex items-center gap-1 transition-colors"
                  title="Mở trên Apple Maps Web"
                >
                  <span>Mở Apple Maps Web</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={appleMapsAppUrl}
                  className="px-3 py-1.5 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-600 hover:border-slate-500 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Mở ứng dụng Bản đồ trên iPhone, iPad, Mac"
                >
                  <span className="text-sm"></span>
                  <span>Mở App Bản đồ</span>
                </a>
              </div>
            </div>

            {/* Live Interactive Map Embed (No API Key Required) */}
            <div className="relative flex-1 bg-slate-950 flex flex-col">
              <iframe
                title="Bản đồ tương tác trực tiếp"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${(selectedFacility ? selectedFacility.lng : 107.2949) - 0.02}%2C${(selectedFacility ? selectedFacility.lat : 11.9686) - 0.02}%2C${(selectedFacility ? selectedFacility.lng : 107.2949) + 0.02}%2C${(selectedFacility ? selectedFacility.lat : 11.9686) + 0.02}&layer=mapnik&marker=${selectedFacility ? selectedFacility.lat : 11.9686}%2C${selectedFacility ? selectedFacility.lng : 107.2949}`}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
              />

              {/* Floating Quick Navigation Card */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-700 shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-base">
                    
                  </div>
                  <div>
                    <div className="font-bold text-white">
                      {selectedFacility?.name || 'Cơ sở cai nghiện TP.HCM'}
                    </div>
                    <div className="text-slate-400 text-[11px] truncate max-w-sm">
                      {selectedFacility?.address || 'Đang chọn cơ sở'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMapStyle('standard')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-700"
                  >
                    Về Bản đồ 3D
                  </button>
                  <a
                    href={`https://maps.apple.com/?daddr=${selectedFacility?.lat || 11.9686},${selectedFacility?.lng || 107.2949}&dirflg=d`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1 shadow-md transition-colors"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Dẫn đường Apple Maps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div ref={mapContainerRef} className="w-full h-full relative" />
      )}

      {/* Pick Mode Top Alert */}
      {isPickModeActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-4 py-2 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 border-2 border-white animate-pulse">
          <Crosshair className="w-4 h-4" />
          <span>Chế độ chấm điểm: Nhấp vào bất kỳ đâu trên bản đồ Apple Maps để dời khuôn viên</span>
          <button
            type="button"
            onClick={() => setIsPickModeActive(false)}
            className="ml-2 bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded-md hover:bg-slate-800"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Cupertino Glass Controls on Right */}
      {mapStyle !== 'embed' && (
        <div className="absolute right-3 top-18 z-20 flex flex-col gap-1.5 pointer-events-auto">
          {/* Zoom In */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
            className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-100 font-bold hover:bg-white text-base transition-colors"
            title="Phóng to"
          >
            +
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
            className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-100 font-bold hover:bg-white text-base transition-colors"
            title="Thu nhỏ"
          >
            −
          </button>

          {/* Reset North & Tilt */}
          <button
            type="button"
            onClick={() => {
              mapRef.current?.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 600,
              });
            }}
            className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors"
            title="Căn hướng Bắc và góc nhìn phẳng"
          >
            <Compass className="w-4 h-4 text-rose-500" />
          </button>

          {/* Recenter View */}
          <button
            type="button"
            onClick={() => {
              if (selectedFacility) {
                mapRef.current?.flyTo({
                  center: [selectedFacility.coordinates.lng, selectedFacility.coordinates.lat],
                  zoom: 14.5,
                  pitch: 45,
                  duration: 1200,
                });
              } else {
                mapRef.current?.flyTo({
                  center: DEFAULT_CENTER,
                  zoom: DEFAULT_ZOOM,
                  pitch: 35,
                  bearing: 0,
                  duration: 1200,
                });
              }
            }}
            className="w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-sky-600 transition-colors"
            title="Tập trung vào cơ sở"
          >
            <Maximize2 className="w-4 h-4 text-sky-600" />
          </button>

          {/* Distance Measure Tool Toggle */}
          <button
            type="button"
            onClick={() => setIsMeasuring(!isMeasuring)}
            className={`w-9 h-9 rounded-xl backdrop-blur-md shadow-md border flex items-center justify-center transition-colors ${
              isMeasuring
                ? 'bg-sky-600 text-white border-sky-400'
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:text-sky-600'
            }`}
            title="Đo khoảng cách từ Trụ sở CATP / GPS"
          >
            <Ruler className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Distance Measurement Control Bar */}
      {isMeasuring && selectedFacility && (
        <div className="absolute top-18 left-3 z-20 bg-slate-950/90 backdrop-blur-md text-white p-3 rounded-2xl border border-sky-500/40 shadow-xl max-w-sm pointer-events-auto text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-sky-400" />
              Khoảng cách tới {selectedFacility.name}:
            </span>
            <button
              type="button"
              onClick={() => setIsMeasuring(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMeasureOrigin('catp')}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                measureOrigin === 'catp'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Từ CATP (Trần Hưng Đạo)
            </button>
            {userLocation && (
              <button
                type="button"
                onClick={() => setMeasureOrigin('user')}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                  measureOrigin === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Từ vị trí của bạn
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>Đường thẳng: <strong>{measuredDistanceKm || 0} km</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-200">
              <Car className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đường bộ ước tính: <strong>~{estimateRoadDistanceKm(measuredDistanceKm || 0)} km</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Selected Facility Cupertino Card (Bottom Floating) */}
      {selectedFacility && mapStyle !== 'embed' && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-20 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 pointer-events-auto">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-500 to-red-600 text-white font-extrabold text-base flex items-center justify-center shadow-md">
                {selectedFacility.number}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                  {selectedFacility.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-red-500" />
                  <span className="truncate max-w-[200px] sm:max-w-[260px]">{selectedFacility.address}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClosePopup}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-lg">
              Khuôn viên: {selectedFacility.areaFormatted}
            </span>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
              {selectedFacility.coordinates.lat.toFixed(4)}°N, {selectedFacility.coordinates.lng.toFixed(4)}°E
            </span>
          </div>

          {/* Action Buttons: Apple Maps Navigation & Details */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <a
              href={appleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-xs"
              title="Chỉ đường trên Apple Maps"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Chỉ đường Apple</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>

            <a
              href={appleMapsAppUrl}
              className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
              title="Mở trong app Apple Maps"
            >
              <span>App</span>
            </a>

            <button
              type="button"
              onClick={() => setIsCalibrationOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
              title="Khoanh vùng khuôn viên"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Khoanh vùng</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDetails(selectedFacility)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              title="Xem hồ sơ chi tiết"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Live Cursor Coordinates Display */}
      {cursorCoords && mapStyle !== 'embed' && (
        <div className="absolute bottom-2 left-3 z-20 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md text-slate-300 px-3 py-1.5 rounded-xl border border-sky-500/30 shadow-lg text-[11px] font-mono select-text pointer-events-auto">
          <span className="text-sky-400 font-semibold flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-red-400" />
            <span>Tọa độ Apple:</span>
          </span>
          <span className="font-bold text-white">
            {cursorCoords.lat.toFixed(5)}°N, {cursorCoords.lng.toFixed(5)}°E
          </span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${cursorCoords.lat.toFixed(6)}, ${cursorCoords.lng.toFixed(6)}`);
              setCopiedCursor(true);
              setTimeout(() => setCopiedCursor(false), 2000);
            }}
            className="text-slate-400 hover:text-sky-200 transition-colors p-1 rounded hover:bg-slate-800"
            title="Sao chép tọa độ này"
          >
            {copiedCursor ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
        </div>
      )}

      {/* Apple Developer JWT Token Modal */}
      <AppleMapsConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onTokenSaved={handleSaveToken}
        currentToken={jwtToken}
      />

      {/* Location Calibration & Boundary Modal */}
      <LocationCalibrationModal
        isOpen={isCalibrationOpen}
        facility={selectedFacility || facilities.find((f) => f.id === 'co-so-6') || facilities[0]}
        onClose={() => setIsCalibrationOpen(false)}
        onApplyCoordinates={(coords, boundary) => {
          const target = selectedFacility || facilities.find((f) => f.id === 'co-so-6') || facilities[0];
          if (target && onUpdateFacilityCoordinates) {
            onUpdateFacilityCoordinates(target.id, coords, boundary);
          }
        }}
        onResetToDefault={() => {
          const target = selectedFacility || facilities.find((f) => f.id === 'co-so-6') || facilities[0];
          if (target && onResetFacilityCoordinates) {
            onResetFacilityCoordinates(target.id);
          }
        }}
        isPickModeActive={isPickModeActive}
        onTogglePickMode={(active) => {
          setIsPickModeActive(active);
          if (active) setIsCalibrationOpen(false);
        }}
      />

      {/* Apple Attribution Banner */}
      <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
        <span> Apple Maps Web Platform</span>
      </div>
    </div>
  );
};
