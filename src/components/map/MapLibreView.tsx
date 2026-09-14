import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  Phone, 
  Navigation, 
  Info, 
  X, 
  Box, 
  Eye, 
  Ruler, 
  MapPin, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Car, 
  Plane, 
  RefreshCw,
  Sparkles,
  Crosshair,
  Copy,
  Check
} from 'lucide-react';
import { Facility, RegionZone, UserCoordinates, LatLng } from '../../types';
import { REGIONS } from '../../data/facilities';
import { 
  calculateDistanceKm, 
  estimateRoadDistanceKm, 
  estimateDrivingTimeMinutes, 
  formatTravelTime, 
  getCompassDirection, 
  createArcPoints, 
  CATP_HEADQUARTERS 
} from '../../utils/distance';
import { MapAdapterProps } from './MapAdapter';
import {
  LocationCalibrationModal,
  calculateBoundaryDimensions,
  generateRectangularBoundary,
} from './LocationCalibrationModal';

// Single, highly reliable 3D map engine styles (no API key required, 100% stable)
export type MapStyleKey = 'satellite' | 'street';

const MAP_STYLES: Record<MapStyleKey, { name: string; style: any }> = {
  satellite: {
    name: 'Vệ tinh 3D',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics',
        },
        'carto-labels': {
          type: 'raster',
          tiles: [
            'https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
          ],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: 'satellite-base',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 19,
        },
        {
          id: 'satellite-labels',
          type: 'raster',
          source: 'carto-labels',
          minzoom: 0,
          maxzoom: 19,
          paint: {
            'raster-opacity': 0.85,
          },
        },
      ],
    },
  },
  street: {
    name: 'Giao thông 3D',
    style: {
      version: 8,
      sources: {
        'carto-voyager': {
          type: 'raster',
          tiles: [
            'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          ],
          tileSize: 256,
          attribution: 'CartoDB, OpenStreetMap contributors',
        },
      },
      layers: [
        {
          id: 'street-base',
          type: 'raster',
          source: 'carto-voyager',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
};

export const MapLibreView: React.FC<MapAdapterProps> = ({
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
  const hoveredRegionIdRef = useRef<number | null>(null);

  // Calibration & Cursor Tracking State
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [isPickModeActive, setIsPickModeActive] = useState<boolean>(false);
  const [cursorCoords, setCursorCoords] = useState<LatLng | null>(null);
  const [copiedCursor, setCopiedCursor] = useState<boolean>(false);

  // Single unified map mode: satellite 3D (default) or street 3D
  const [currentStyle, setCurrentStyle] = useState<MapStyleKey>('satellite');
  const [viewPreset, setViewPreset] = useState<'overview' | '3d' | 'topdown'>('overview');
  const [hoveredRegion, setHoveredRegion] = useState<RegionZone | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [bearing, setBearing] = useState<number>(-12);
  const [pitch, setPitch] = useState<number>(50);

  // Distance Measurement State
  const [isMeasuring, setIsMeasuring] = useState<boolean>(true);
  const [measureOrigin, setMeasureOrigin] = useState<'user' | 'catp'>('catp');

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);

  // Mutable refs for click handling without stale closures
  const isPickModeActiveRef = useRef<boolean>(false);
  isPickModeActiveRef.current = isPickModeActive;
  const selectedFacilityRef = useRef<Facility | null>(selectedFacility || null);
  selectedFacilityRef.current = selectedFacility || null;
  const selectedRegion = REGIONS.find((r) => r.id === selectedRegionId);

  // Active origin for distance calculation (User GPS or CATP Headquarters)
  const activeOrigin = useMemo<{ name: string; shortName: string; coords: LatLng }>(() => {
    if (measureOrigin === 'user' && userLocation) {
      return {
        name: 'Vị trí hiện tại của bạn (GPS)',
        shortName: 'Vị trí của bạn',
        coords: { lat: userLocation.lat, lng: userLocation.lng },
      };
    }
    return {
      name: CATP_HEADQUARTERS.name,
      shortName: CATP_HEADQUARTERS.shortName,
      coords: CATP_HEADQUARTERS.coordinates,
    };
  }, [measureOrigin, userLocation]);

  // Real-time calculated distance metrics to selected facility
  const distanceMetrics = useMemo(() => {
    if (!selectedFacility) return null;

    // Special case for Cơ sở 6 with verified road distance from CATP: 116km
    let roadKm = 0;
    const straightKm = calculateDistanceKm(activeOrigin.coords, selectedFacility.coordinates);

    if (selectedFacility.id === 'co-so-6' && measureOrigin === 'catp') {
      roadKm = 116.0;
    } else {
      roadKm = estimateRoadDistanceKm(straightKm);
    }

    const driveMinutes = estimateDrivingTimeMinutes(roadKm);
    const direction = getCompassDirection(activeOrigin.coords, selectedFacility.coordinates);

    return {
      straightKm,
      roadKm,
      driveMinutes,
      formattedTime: formatTravelTime(driveMinutes),
      direction,
    };
  }, [selectedFacility, activeOrigin, measureOrigin]);

  // Build GeoJSON for Regions (Polygons with 3D extrusion heights)
  const buildRegionsGeoJSON = useCallback(() => {
    return {
      type: 'FeatureCollection' as const,
      features: REGIONS.map((region, index) => {
        const ring = region.polygonCoords.map((pt) => [pt.lng, pt.lat]);
        ring.push([region.polygonCoords[0].lng, region.polygonCoords[0].lat]);
        const baseHeight = 1600 + (index % 3) * 350;

        return {
          type: 'Feature' as const,
          id: index + 1,
          properties: {
            numericId: index + 1,
            regionId: region.id,
            name: region.name,
            areaHectares: region.areaHectares,
            areaFormatted: region.areaFormatted,
            height: baseHeight,
            hoverHeight: baseHeight + 1200,
            selectedHeight: baseHeight + 1600,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [ring],
          },
        };
      }),
    };
  }, []);

  // Build GeoJSON for Facility Compound Boundaries
  const buildCompoundsGeoJSON = useCallback(() => {
    return {
      type: 'FeatureCollection' as const,
      features: facilities.map((facility, index) => {
        const ring = facility.compoundBoundary.map((pt) => [pt.lng, pt.lat]);
        ring.push([facility.compoundBoundary[0].lng, facility.compoundBoundary[0].lat]);

        return {
          type: 'Feature' as const,
          id: index + 100,
          properties: {
            facilityId: facility.id,
            name: facility.name,
            number: facility.number,
            areaFormatted: facility.areaFormatted,
            height: facility.id === selectedFacilityId ? 15 : 6,
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [ring],
          },
        };
      }),
    };
  }, [facilities, selectedFacilityId]);

  // Build GeoJSON Line for distance measurement
  const buildMeasurementLineGeoJSON = useCallback(() => {
    if (!selectedFacility || !isMeasuring) {
      return {
        type: 'FeatureCollection' as const,
        features: [],
      };
    }

    const arcPoints = createArcPoints(activeOrigin.coords, selectedFacility.coordinates, 40);

    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {
            title: `Đo khoảng cách đến ${selectedFacility.name}`,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: arcPoints,
          },
        },
      ],
    };
  }, [selectedFacility, isMeasuring, activeOrigin]);

  // Function to attach 3D layers
  const add3DLayers = useCallback((map: maplibregl.Map) => {
    const regionsGeoJSON = buildRegionsGeoJSON();
    const compoundsGeoJSON = buildCompoundsGeoJSON();
    const measurementGeoJSON = buildMeasurementLineGeoJSON();

    // 1. Regions Source & Layers
    if (!map.getSource('regions-source')) {
      map.addSource('regions-source', {
        type: 'geojson',
        data: regionsGeoJSON,
      });
    }

    if (!map.getLayer('regions-extrusion')) {
      map.addLayer({
        id: 'regions-extrusion',
        type: 'fill-extrusion',
        source: 'regions-source',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            '#06b6d4',
            ['boolean', ['feature-state', 'hover'], false],
            '#10b981',
            '#0284c7',
          ],
          'fill-extrusion-height': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            ['get', 'selectedHeight'],
            ['boolean', ['feature-state', 'hover'], false],
            ['get', 'hoverHeight'],
            ['get', 'height'],
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.68,
        },
      });
    }

    if (!map.getLayer('regions-edge-line')) {
      map.addLayer({
        id: 'regions-edge-line',
        type: 'line',
        source: 'regions-source',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2,
          'line-opacity': 0.9,
        },
      });
    }

    // 2. Compounds Source & Layers
    if (!map.getSource('compounds-source')) {
      map.addSource('compounds-source', {
        type: 'geojson',
        data: compoundsGeoJSON,
      });
    }

    if (!map.getLayer('compounds-extrusion')) {
      map.addLayer({
        id: 'compounds-extrusion',
        type: 'fill-extrusion',
        source: 'compounds-source',
        paint: {
          'fill-extrusion-color': [
            'case',
            ['==', ['get', 'facilityId'], selectedFacilityId || ''],
            '#ef4444',
            '#10b981',
          ],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': [
            'case',
            ['==', ['get', 'facilityId'], selectedFacilityId || ''],
            0.18,
            0.08,
          ],
        },
      });
    }

    if (!map.getLayer('compounds-glow')) {
      map.addLayer({
        id: 'compounds-glow',
        type: 'line',
        source: 'compounds-source',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'facilityId'], selectedFacilityId || ''],
            '#ef4444',
            '#10b981',
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
            0.2,
          ],
        },
      });
    }

    if (!map.getLayer('compounds-outline')) {
      map.addLayer({
        id: 'compounds-outline',
        type: 'line',
        source: 'compounds-source',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'facilityId'], selectedFacilityId || ''],
            '#ef4444',
            '#ffffff',
          ],
          'line-width': [
            'case',
            ['==', ['get', 'facilityId'], selectedFacilityId || ''],
            3.5,
            1.5,
          ],
          'line-opacity': 1,
        },
      });
    }

    // 3. Distance Measurement Line Source & Layers
    if (!map.getSource('measurement-source')) {
      map.addSource('measurement-source', {
        type: 'geojson',
        data: measurementGeoJSON,
      });
    }

    if (!map.getLayer('measurement-glow')) {
      map.addLayer({
        id: 'measurement-glow',
        type: 'line',
        source: 'measurement-source',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 6,
          'line-opacity': 0.45,
          'line-blur': 3,
        },
      });
    }

    if (!map.getLayer('measurement-line')) {
      map.addLayer({
        id: 'measurement-line',
        type: 'line',
        source: 'measurement-source',
        paint: {
          'line-color': '#ffffff',
          'line-width': 2.5,
          'line-dasharray': [2, 2],
          'line-opacity': 0.95,
        },
      });
    }
  }, [buildRegionsGeoJSON, buildCompoundsGeoJSON, buildMeasurementLineGeoJSON, selectedFacilityId]);

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[currentStyle].style,
      center: [106.85, 10.95],
      zoom: 9.3,
      pitch: 50,
      bearing: -12,
      dragRotate: true,
      pitchWithRotate: true,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('rotate', () => setBearing(Math.round(map.getBearing())));
    map.on('pitch', () => setPitch(Math.round(map.getPitch())));

    map.on('load', () => {
      setIsMapLoaded(true);
      add3DLayers(map);
    });

    // Hover on Region 3D Polygons
    map.on('mousemove', 'regions-extrusion', (e) => {
      if (!e.features || e.features.length === 0) return;
      map.getCanvas().style.cursor = 'pointer';

      const feature = e.features[0];
      const numericId = feature.properties?.numericId;
      const regionId = feature.properties?.regionId;

      if (hoveredRegionIdRef.current !== null && hoveredRegionIdRef.current !== numericId) {
        map.setFeatureState(
          { source: 'regions-source', id: hoveredRegionIdRef.current },
          { hover: false }
        );
      }

      if (numericId) {
        hoveredRegionIdRef.current = numericId;
        map.setFeatureState(
          { source: 'regions-source', id: numericId },
          { hover: true }
        );
      }

      const matchRegion = REGIONS.find((r) => r.id === regionId);
      if (matchRegion) {
        setHoveredRegion(matchRegion);
      }
    });

    map.on('mouseleave', 'regions-extrusion', () => {
      map.getCanvas().style.cursor = '';
      if (hoveredRegionIdRef.current !== null) {
        map.setFeatureState(
          { source: 'regions-source', id: hoveredRegionIdRef.current },
          { hover: false }
        );
        hoveredRegionIdRef.current = null;
      }
      setHoveredRegion(null);
    });

    // Click on 3D Region
    map.on('click', 'regions-extrusion', (e) => {
      if (!e.features || e.features.length === 0) return;
      const regionId = e.features[0].properties?.regionId;
      if (regionId) {
        onSelectRegion(regionId);
        const matchFacility = facilities.find((f) => f.regionId === regionId);
        if (matchFacility) {
          onSelectFacility(matchFacility);
        }
      }
    });

    // Click on Compound 3D Polygon
    map.on('click', 'compounds-extrusion', (e) => {
      if (!e.features || e.features.length === 0) return;
      const facId = e.features[0].properties?.facilityId;
      const match = facilities.find((f) => f.id === facId);
      if (match) {
        onSelectFacility(match);
      }
    });

    // Point Picking Mode on Satellite surface
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
  }, []); // Run once on mount

  // Sync cursor appearance when Pick Mode is active
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isPickModeActive ? 'crosshair' : '';
  }, [isPickModeActive]);

  // Update Style when toggled
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    map.setStyle(MAP_STYLES[currentStyle].style);
    map.once('style.load', () => {
      add3DLayers(map);
    });
  }, [currentStyle, isMapLoaded, add3DLayers]);

  // Update Dynamic Compounds GeoJSON & paint properties
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const source = map.getSource('compounds-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(buildCompoundsGeoJSON());
    }

    if (map.getLayer('compounds-extrusion')) {
      map.setPaintProperty('compounds-extrusion', 'fill-extrusion-color', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        '#ef4444',
        '#10b981',
      ]);
      map.setPaintProperty('compounds-extrusion', 'fill-extrusion-opacity', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        0.18,
        0.08,
      ]);
    }

    if (map.getLayer('compounds-glow')) {
      map.setPaintProperty('compounds-glow', 'line-color', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        '#ef4444',
        '#10b981',
      ]);
      map.setPaintProperty('compounds-glow', 'line-width', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        8,
        3,
      ]);
      map.setPaintProperty('compounds-glow', 'line-opacity', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        0.65,
        0.2,
      ]);
    }

    if (map.getLayer('compounds-outline')) {
      map.setPaintProperty('compounds-outline', 'line-color', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        '#ef4444',
        '#ffffff',
      ]);
      map.setPaintProperty('compounds-outline', 'line-width', [
        'case',
        ['==', ['get', 'facilityId'], selectedFacilityId || ''],
        3.5,
        1.5,
      ]);
    }
  }, [buildCompoundsGeoJSON, isMapLoaded, selectedFacilityId]);

  // Update Dynamic Measurement Line GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    const source = map.getSource('measurement-source') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData(buildMeasurementLineGeoJSON());
    }
  }, [buildMeasurementLineGeoJSON, isMapLoaded]);

  // Update Selected Region Feature State
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    REGIONS.forEach((r, idx) => {
      const isSelected = r.id === selectedRegionId;
      try {
        map.setFeatureState(
          { source: 'regions-source', id: idx + 1 },
          { selected: isSelected }
        );
      } catch {
        // ignore if layer not fully ready
      }
    });
  }, [selectedRegionId, isMapLoaded]);

  // Update Facility Markers (1 - 6)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    facilities.forEach((fac) => {
      const isSelected = fac.id === selectedFacilityId;

      const el = document.createElement('div');
      el.className = 'group cursor-pointer select-none';
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `Cơ sở số ${fac.number}: ${fac.name}`);

      el.innerHTML = `
        <div class="relative flex flex-col items-center transition-transform duration-300 ${
          isSelected ? 'scale-125 -translate-y-2 z-50' : 'hover:scale-115 hover:-translate-y-1 z-20'
        }">
          <!-- Marker Body -->
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full shadow-2xl transition-all duration-300 ${
            isSelected
              ? 'bg-amber-500 text-slate-950 font-black ring-4 ring-white ring-offset-2 ring-offset-amber-500 shadow-amber-500/60'
              : 'bg-slate-900/90 text-cyan-300 border-2 border-cyan-400 shadow-lg hover:bg-cyan-500 hover:text-slate-950'
          }">
            <span class="font-extrabold text-sm tracking-tight">${fac.number}</span>
            
            ${
              isSelected
                ? `<span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                   </span>`
                : ''
            }
          </div>

          <!-- Pointer Triangle -->
          <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent ${
            isSelected ? 'border-t-[8px] border-t-amber-500' : 'border-t-[7px] border-t-slate-900 group-hover:border-t-cyan-500'
          } -mt-[1px]"></div>

          <!-- Ground shadow -->
          <div class="w-7 h-2 bg-slate-950/60 rounded-[100%] blur-[2px] mt-0.5"></div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectFacility(fac);
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([fac.coordinates.lng, fac.coordinates.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [facilities, selectedFacilityId, onSelectFacility]);

  // Marker for CATP Headquarters (Origin anchor)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (catpMarkerRef.current) {
      catpMarkerRef.current.remove();
      catpMarkerRef.current = null;
    }

    const el = document.createElement('div');
    el.className = 'cursor-pointer select-none group';
    el.setAttribute('title', CATP_HEADQUARTERS.name);
    el.innerHTML = `
      <div class="flex flex-col items-center">
        <div class="flex items-center gap-1 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-xl">
          <span>🏛️ CATP</span>
        </div>
        <div class="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-red-600 -mt-[1px]"></div>
      </div>
    `;

    catpMarkerRef.current = new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([CATP_HEADQUARTERS.coordinates.lng, CATP_HEADQUARTERS.coordinates.lat])
      .addTo(map);
  }, []);

  // Marker for User GPS Location
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center';
      el.innerHTML = `
        <div class="w-5 h-5 rounded-full bg-cyan-500 border-2 border-white shadow-xl z-10"></div>
        <div class="absolute w-9 h-9 rounded-full bg-cyan-400/40 animate-ping"></div>
      `;

      userMarkerRef.current = new maplibregl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    }
  }, [userLocation]);

  // Smooth camera flyTo with safe padding so selected facility is never covered by bottom card
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedFacility) {
      // Safe padding: bottom 260px ensures facility & compound boundary sit comfortably in upper center
      map.flyTo({
        center: [selectedFacility.coordinates.lng, selectedFacility.coordinates.lat],
        zoom: 14.2,
        pitch: 52,
        bearing: 15,
        speed: 1.2,
        curve: 1.4,
        padding: {
          top: 60,
          bottom: 270,
          left: 40,
          right: 40,
        },
        essential: true,
      });
    } else if (selectedRegion) {
      map.flyTo({
        center: [selectedRegion.centerCoords.lng, selectedRegion.centerCoords.lat],
        zoom: 12.0,
        pitch: 48,
        bearing: -8,
        speed: 1.1,
        curve: 1.3,
        padding: { top: 60, bottom: 80, left: 40, right: 40 },
        essential: true,
      });
    }
  }, [selectedFacilityId, selectedRegionId, selectedFacility, selectedRegion]);

  // Perspective Views
  const handleSetViewPreset = (preset: 'overview' | '3d' | 'topdown') => {
    const map = mapRef.current;
    if (!map) return;

    setViewPreset(preset);

    if (preset === 'overview') {
      const bounds = new maplibregl.LngLatBounds();
      bounds.extend([CATP_HEADQUARTERS.coordinates.lng, CATP_HEADQUARTERS.coordinates.lat]);
      facilities.forEach((f) => bounds.extend([f.coordinates.lng, f.coordinates.lat]));

      map.fitBounds(bounds, {
        padding: { top: 90, bottom: 90, left: 70, right: 70 },
        pitch: 45,
        bearing: -12,
        duration: 1600,
        maxZoom: 11,
      });
    } else if (preset === '3d') {
      map.easeTo({
        pitch: 56,
        bearing: 20,
        zoom: Math.max(map.getZoom(), 10.5),
        duration: 1400,
      });
    } else if (preset === 'topdown') {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1200,
      });
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn({ duration: 300 });
  const handleZoomOut = () => mapRef.current?.zoomOut({ duration: 300 });
  const handleResetNorth = () => {
    mapRef.current?.easeTo({ bearing: 0, pitch: 45, duration: 800 });
  };

  return (
    <div
      className="relative w-full h-full min-h-[520px] flex flex-col rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-xs select-none bg-slate-950"
      role="region"
      aria-label="Bản đồ số 3D hệ thống cơ sở cai nghiện TP.HCM"
    >
      {/* Canvas */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" />

      {/* Unified Single-Row Header Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Style Selector: Vệ tinh 3D / Giao thông 3D */}
        <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1 shadow-xl pointer-events-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentStyle('satellite')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              currentStyle === 'satellite'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Ảnh chụp vệ tinh độ nét cao kết hợp khối nổi 3D"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span>Vệ tinh 3D</span>
          </button>
          <button
            type="button"
            onClick={() => setCurrentStyle('street')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              currentStyle === 'street'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Bản đồ đường xá, giao thông 3D"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Giao thông 3D</span>
          </button>
        </div>

        {/* View Presets & Measurement Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1 shadow-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSetViewPreset('overview')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewPreset === 'overview'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Góc nhìn bao quát toàn bộ 6 cơ sở"
            >
              Toàn cảnh
            </button>
            <button
              type="button"
              onClick={() => handleSetViewPreset('3d')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewPreset === '3d'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Nghiêng 3D làm nổi khối polygon"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Góc 3D</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetViewPreset('topdown')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewPreset === 'topdown'
                  ? 'bg-cyan-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
              title="Nhìn thẳng từ trên xuống (2D phẳng)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Phẳng 2D</span>
            </button>
          </div>

          {/* Distance Measure Active Button */}
          <button
            type="button"
            onClick={() => setIsMeasuring(!isMeasuring)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-xl transition-colors ${
              isMeasuring
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-500/30'
                : 'bg-slate-900/90 text-slate-200 border-cyan-500/30 hover:bg-slate-800'
            }`}
            title="Bật/Tắt thước đo khoảng cách và vẽ đường nối 3D"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Đo khoảng cách</span>
          </button>

          {/* Calibrate & Boundary Button */}
          <button
            type="button"
            onClick={() => {
              if (!selectedFacility) {
                const f6 = facilities.find((f) => f.id === 'co-so-6') || facilities[0];
                if (f6) onSelectFacility(f6);
              }
              setIsCalibrationOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border backdrop-blur-md shadow-xl transition-all bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-300 shadow-amber-500/20"
            title="Lấy thông số Google Maps để chỉnh sửa và khoanh vùng đa giác 3D"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Khoanh vùng & Tọa độ</span>
          </button>
        </div>
      </div>

      {/* Pick Mode Top Alert */}
      {isPickModeActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl shadow-2xl font-bold text-xs flex items-center gap-2 border-2 border-white animate-pulse">
          <Crosshair className="w-4 h-4" />
          <span>Chế độ chấm điểm: Nhấp vào bất kỳ đâu trên ảnh vệ tinh để đặt vị trí</span>
          <button
            type="button"
            onClick={() => setIsPickModeActive(false)}
            className="ml-2 bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded-md hover:bg-slate-800"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Navigation Controls on Right Edge */}
      <div className="absolute right-3 top-20 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/30 rounded-xl p-1 shadow-xl flex flex-col gap-1">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 text-slate-200 hover:bg-slate-800 hover:text-cyan-300 rounded-lg transition-colors"
            title="Phóng to"
            aria-label="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 text-slate-200 hover:bg-slate-800 hover:text-cyan-300 rounded-lg transition-colors"
            title="Thu nhỏ"
            aria-label="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetNorth}
            className="p-2 text-slate-200 hover:bg-slate-800 hover:text-cyan-300 rounded-lg transition-colors"
            title="Đặt lại hướng Bắc"
            aria-label="Đặt lại hướng Bắc"
          >
            <Compass
              className="w-4 h-4 transition-transform duration-300"
              style={{ transform: `rotate(${-bearing}deg)` }}
            />
          </button>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 px-2 py-1 rounded-lg text-[10px] font-mono text-cyan-300 text-center shadow-md">
          {pitch}° | {bearing}°
        </div>
      </div>

      {/* Distance Measurement Overlay Floating Card (Top Left) */}
      {isMeasuring && selectedFacility && distanceMetrics && (
        <div className="absolute top-16 left-3 z-20 bg-slate-900/95 text-white backdrop-blur-md border border-amber-500/40 rounded-2xl shadow-2xl p-3.5 max-w-xs sm:max-w-sm animate-fadeIn pointer-events-auto">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Ruler className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-amber-300">Đo khoảng cách hành trình</span>
            </div>

            {/* Toggle Origin Button: GPS vs CATP */}
            <button
              type="button"
              onClick={() => setMeasureOrigin(measureOrigin === 'catp' ? 'user' : 'catp')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 px-2 py-1 rounded-lg border border-cyan-500/40 transition-colors"
              title="Đổi điểm xuất phát đo khoảng cách"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Đổi mốc: {measureOrigin === 'catp' ? 'Vị trí GPS' : 'CATP'}</span>
            </button>
          </div>

          <div className="mt-2.5 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-slate-400 shrink-0">Xuất phát:</span>
              <span className="font-semibold text-cyan-200 line-clamp-1">{activeOrigin.name}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-slate-400 shrink-0">Đích đến:</span>
              <span className="font-semibold text-amber-200 line-clamp-1">{selectedFacility.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Car className="w-3 h-3 text-amber-400" />
                  <span>Đường bộ ước tính</span>
                </div>
                <div className="text-base font-extrabold text-amber-400 mt-0.5">
                  {distanceMetrics.roadKm} km
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Thời gian: {distanceMetrics.formattedTime}
                </div>
              </div>

              <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Plane className="w-3 h-3 text-cyan-400" />
                  <span>Đường chim bay</span>
                </div>
                <div className="text-base font-extrabold text-cyan-400 mt-0.5">
                  {distanceMetrics.straightKm} km
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5">
                  Hướng: {distanceMetrics.direction}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hover Card for Region Polygon */}
      {hoveredRegion && (
        <div className="absolute top-16 right-16 z-20 bg-slate-900/95 backdrop-blur-md border border-cyan-400/50 px-3.5 py-2.5 rounded-xl shadow-xl animate-fadeIn pointer-events-none max-w-xs text-white">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <h4 className="text-xs font-bold text-cyan-300">{hoveredRegion.name}</h4>
          </div>
          <p className="text-xs text-emerald-300 font-semibold mt-1">
            📍 Diện tích: {hoveredRegion.areaFormatted}
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">{hoveredRegion.description}</p>
        </div>
      )}

      {/* Bottom Card for Selected Facility (Cơ sở 6 & others) */}
      {selectedFacility && (
        <div className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:max-w-md z-30 bg-slate-900/95 text-white backdrop-blur-md rounded-2xl border border-cyan-500/40 shadow-2xl p-4 animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 text-sm font-extrabold flex items-center justify-center shadow-md">
                {selectedFacility.number}
              </div>
              <div>
                <h4 className="text-sm font-bold text-cyan-200 leading-tight">
                  {selectedFacility.name}
                </h4>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                  Khuôn viên: {selectedFacility.areaFormatted}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClosePopup}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Đóng bảng tóm tắt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Real Satellite Photo with Cadastral Tag */}
          <div className="mt-3 relative rounded-xl overflow-hidden h-24 border border-cyan-500/30">
            <img
              src={selectedFacility.satelliteImageUrl}
              alt={`Ảnh chụp vệ tinh thực tế ${selectedFacility.name}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end justify-between p-2">
              <span className="text-[10px] text-cyan-200 font-medium bg-slate-900/80 px-2 py-0.5 rounded-md border border-cyan-400/30">
                {selectedFacility.cadastralInfo || 'Đã định vị ranh giới 3D'}
              </span>

              {selectedFacility.distanceFromCATP && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40">
                  Cách CATP {selectedFacility.distanceFromCATP}
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 mt-2 line-clamp-2">
            📍 {selectedFacility.address}
          </p>

          {/* Leader & Managing Agency highlights */}
          {selectedFacility.leaderTitle && (
            <p className="text-[11px] text-cyan-300 mt-1 font-medium">
              ⭐ {selectedFacility.leaderTitle}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
            <a
              href={`tel:${selectedFacility.phone}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[var(--color-cta)] hover:bg-[var(--color-cta-hover)] text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              Gọi ngay
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                selectedFacility.name + ' ' + selectedFacility.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 text-xs font-semibold py-2 px-3 rounded-xl transition-colors border border-cyan-500/40 shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              Chỉ đường
            </a>
            <button
              type="button"
              onClick={() => setIsCalibrationOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-semibold py-2 px-3 rounded-xl transition-colors shadow-2xs"
              title="Chỉnh sửa thông số Google Maps & Khoanh vùng khu đất"
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Khoanh vùng</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenDetails(selectedFacility)}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Xem thông tin chi tiết khu đất & hồ sơ"
              aria-label="Xem thông tin chi tiết khu đất"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Live Cursor Coordinates Display */}
      {cursorCoords && (
        <div className="absolute bottom-2 left-3 z-20 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md text-slate-300 px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-lg text-[11px] font-mono select-text pointer-events-auto">
          <span className="text-cyan-400 font-semibold flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-amber-400" />
            <span>Tọa độ:</span>
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
            className="text-slate-400 hover:text-cyan-200 transition-colors p-1 rounded hover:bg-slate-800"
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

      {/* Attribution Banner */}
      <div className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        <span>Bản đồ 3D Vệ tinh & Đo đạc khoảng cách</span>
      </div>
    </div>
  );
};
