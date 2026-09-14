import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Compass, 
  MapPin, 
  Image as ImageIcon,
  X 
} from 'lucide-react';
import { 
  Campus, 
  LocationItem, 
  Category, 
  LocationImage 
} from '../../types/campus';

interface CampusLeafletMapProps {
  campus: Campus;
  locations: LocationItem[];
  categories: Category[];
  activeCategoryIds: string[];
  selectedLocationId: string | null;
  onSelectLocation: (locationId: string | null) => void;
  hoveredLocationId: string | null;
  onHoverLocation: (locationId: string | null) => void;
  getLocationImages: (locationId: string) => LocationImage[];
}

// Convert image coordinates [x, y] to Leaflet CRS.Simple [lat, lng]
// In Leaflet CRS.Simple: lat = height - y, lng = x
function toLeafletCoord(x: number, y: number, height: number): [number, number] {
  return [height - y, x];
}

// Compute centroid of polygon points
function computePolygonCenter(polygon: [number, number][], height: number): [number, number] {
  let sumX = 0;
  let sumY = 0;
  polygon.forEach(([x, y]) => {
    sumX += x;
    sumY += y;
  });
  const avgX = sumX / polygon.length;
  const avgY = sumY / polygon.length;
  return toLeafletCoord(avgX, avgY, height);
}

export const CampusLeafletMap: React.FC<CampusLeafletMapProps> = ({
  campus,
  locations,
  categories,
  activeCategoryIds,
  selectedLocationId,
  onSelectLocation,
  hoveredLocationId,
  onHoverLocation,
  getLocationImages,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const campusAreaLayerRef = useRef<L.Polygon | null>(null);
  const imageOverlayRef = useRef<L.ImageOverlay | null>(null);
  const polygonLayersMapRef = useRef<Map<string, L.Polygon>>(new Map());

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Bounds for the whole campus image
  const imageBounds: L.LatLngBoundsExpression = [
    [0, 0],
    [campus.image_height, campus.image_width],
  ];

  // Reset view to fit entire campus image and lock minZoom
  const handleFitBounds = useCallback(() => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([0, 0], [campus.image_height, campus.image_width]);
      mapInstanceRef.current.fitBounds(bounds, {
        padding: [10, 10],
        animate: true,
      });
      // Dynamically lock minZoom so user cannot zoom out smaller than the image
      const fitZoom = mapInstanceRef.current.getBoundsZoom(bounds, false);
      mapInstanceRef.current.setMinZoom(fitZoom);
    }
  }, [campus.image_height, campus.image_width]);

  // Zoom controls
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  // Initialize Map with strict bounds & locked minZoom
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean previous map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const bounds = L.latLngBounds([0, 0], [campus.image_height, campus.image_width]);
    // Tight 4% margin: strictly prevents panning out into empty space!
    const paddedBounds = bounds.pad(0.04);

    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -2, // Temporary, will be locked to fitZoom right after fitBounds
      maxZoom: 3,
      zoomSnap: 0.1,
      zoomDelta: 0.4,
      scrollWheelZoom: true,
      touchZoom: true,
      doubleClickZoom: true,
      zoomControl: false,
      attributionControl: false,
      maxBounds: paddedBounds,
      maxBoundsViscosity: 1.0, // Strictly locks map inside campus bounds
    });

    // Add Image Overlay for campus master plan
    const overlay = L.imageOverlay(campus.image_url, imageBounds, {
      interactive: true,
    }).addTo(map);
    imageOverlayRef.current = overlay;

    // Layer group for location polygons and markers
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    // Fit image to viewport
    map.fitBounds(bounds, { padding: [10, 10] });

    // CRITICAL: Calculate exact fit zoom and lock minZoom
    // This completely eliminates the issue of zooming out into a tiny thumbnail surrounded by empty void!
    const fitZoom = map.getBoundsZoom(bounds, false);
    map.setMinZoom(fitZoom);
    map.setZoom(fitZoom);

    mapInstanceRef.current = map;

    // Clicking empty space on map deselects location
    map.on('click', () => {
      onSelectLocation(null);
    });

    // Observe container resizes (e.g. sidebar open/close, mobile orientation change)
    const resizeObserver = new ResizeObserver(() => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.invalidateSize();
      const currentBounds = L.latLngBounds([0, 0], [campus.image_height, campus.image_width]);
      const currentFitZoom = mapInstanceRef.current.getBoundsZoom(currentBounds, false);
      mapInstanceRef.current.setMinZoom(currentFitZoom);
      if (mapInstanceRef.current.getZoom() < currentFitZoom) {
        mapInstanceRef.current.setZoom(currentFitZoom);
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [campus.id, campus.image_url, campus.image_width, campus.image_height]);

  // Update Campus Boundary Polygon if present
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (campusAreaLayerRef.current) {
      map.removeLayer(campusAreaLayerRef.current);
      campusAreaLayerRef.current = null;
    }

    if (campus.campus_area && campus.campus_area.length >= 3) {
      const boundaryLatLngs = campus.campus_area.map(([x, y]) =>
        toLeafletCoord(x, y, campus.image_height)
      );
      const boundaryLayer = L.polygon(boundaryLatLngs, {
        color: '#10b981',
        weight: 2.5,
        dashArray: '6, 6',
        fill: false,
        interactive: false,
      }).addTo(map);
      campusAreaLayerRef.current = boundaryLayer;
    }
  }, [campus.campus_area, campus.image_height]);

  // Render Locations (Polygons + Markers + Hover Popups)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    polygonLayersMapRef.current.clear();

    const visibleLocs = locations.filter((loc) => activeCategoryIds.includes(loc.category_id));

    visibleLocs.forEach((loc) => {
      const cat = categoryMap.get(loc.category_id);
      const color = cat?.color || '#10b981';
      const isSelected = loc.id === selectedLocationId;
      const isHovered = loc.id === hoveredLocationId;
      const images = getLocationImages(loc.id);
      const coverImage = images[0]?.image_url;

      // Has polygon definition
      if (loc.polygon && loc.polygon.length >= 3) {
        const latLngs = loc.polygon.map(([x, y]) => toLeafletCoord(x, y, campus.image_height));

        const polygon = L.polygon(latLngs, {
          color: isSelected ? '#ffffff' : isHovered ? '#34d399' : color,
          weight: isSelected ? 4 : isHovered ? 3 : 2,
          fillColor: color,
          fillOpacity: isSelected ? 0.65 : isHovered ? 0.55 : 0.35,
          className: `location-polygon-${loc.id} cursor-pointer transition-all`,
        });

        // Hover Tooltip
        const tooltipContent = `
          <div class="p-2.5 bg-slate-950/95 text-white rounded-xl shadow-2xl border border-emerald-500/50 text-left min-w-[200px] max-w-[260px] backdrop-blur-md">
            ${
              coverImage
                ? `<div class="w-full h-28 mb-2 rounded-lg overflow-hidden bg-black/60 border border-slate-700">
                    <img src="${coverImage}" class="w-full h-full object-cover" />
                   </div>`
                : ''
            }
            <div class="flex items-center gap-2 mb-1.5">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black text-white shadow" style="background-color: ${color}">
                ${loc.display_number}
              </span>
              <strong class="text-xs font-bold text-white truncate flex-1">${loc.name}</strong>
            </div>
            <div class="flex items-center justify-between text-[11px] text-slate-300 mt-1">
              <span class="text-emerald-300 font-semibold">${cat?.name || 'Khu chức năng'}</span>
              ${
                images.length > 0
                  ? `<span class="bg-emerald-900/80 text-emerald-200 px-1.5 py-0.5 rounded font-bold border border-emerald-700/50">📷 ${images.length} ảnh</span>`
                  : '<span class="text-slate-500">Chưa có ảnh</span>'
              }
            </div>
            <p class="text-[10px] text-emerald-400 font-medium mt-2 border-t border-slate-800 pt-1.5 flex items-center gap-1">
              👉 Nhấp để mở ảnh con & chi tiết
            </p>
          </div>
        `;

        polygon.bindTooltip(tooltipContent, {
          sticky: true,
          direction: 'top',
          offset: [0, -10],
          className: 'custom-leaflet-tooltip',
          opacity: 1,
        });

        // Event listeners
        polygon.on('mouseover', () => {
          onHoverLocation(loc.id);
          polygon.setStyle({
            weight: 3.5,
            fillOpacity: 0.6,
          });
        });

        polygon.on('mouseout', () => {
          onHoverLocation(null);
          polygon.setStyle({
            weight: isSelected ? 4 : 2,
            fillOpacity: isSelected ? 0.65 : 0.35,
          });
        });

        polygon.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectLocation(loc.id);
        });

        polygon.addTo(layerGroup);
        polygonLayersMapRef.current.set(loc.id, polygon);
      }

      // Pin Marker with badge number
      const centerCoord: [number, number] =
        loc.polygon && loc.polygon.length >= 3
          ? computePolygonCenter(loc.polygon, campus.image_height)
          : toLeafletCoord(loc.pos_x, loc.pos_y, campus.image_height);

      const markerHtml = `
        <div class="group relative flex items-center justify-center transition-transform hover:scale-125 cursor-pointer">
          <div 
            class="flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-xs shadow-2xl transition-all ${
              isSelected
                ? 'ring-4 ring-white scale-125 shadow-emerald-500/50'
                : isHovered
                ? 'ring-2 ring-emerald-300 scale-115'
                : 'ring-2 ring-white/90'
            }"
            style="background-color: ${color};"
          >
            ${loc.display_number}
          </div>
          ${
            images.length > 0
              ? `<span class="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[8px] font-extrabold text-black ring-1 ring-white">
                  ${images.length}
                 </span>`
              : ''
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'label-anchor',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(centerCoord, { icon: customIcon });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectLocation(loc.id);
      });

      marker.on('mouseover', () => onHoverLocation(loc.id));
      marker.on('mouseout', () => onHoverLocation(null));

      marker.addTo(layerGroup);
    });
  }, [
    locations,
    categories,
    activeCategoryIds,
    selectedLocationId,
    hoveredLocationId,
    campus.image_height,
    getLocationImages,
    onSelectLocation,
    onHoverLocation,
  ]);

  // Center on Selected Location with contextual zoom (gentle, not over-zooming)
  useEffect(() => {
    if (!selectedLocationId || !mapInstanceRef.current) return;
    const loc = locations.find((l) => l.id === selectedLocationId);
    if (!loc) return;

    const center: [number, number] =
      loc.polygon && loc.polygon.length >= 3
        ? computePolygonCenter(loc.polygon, campus.image_height) ||
          toLeafletCoord(loc.pos_x, loc.pos_y, campus.image_height)
        : toLeafletCoord(loc.pos_x, loc.pos_y, campus.image_height);

    const bounds = L.latLngBounds([0, 0], [campus.image_height, campus.image_width]);
    const fitZoom = mapInstanceRef.current.getBoundsZoom(bounds, false);

    // Zoom slightly in (e.g. +0.5 to +0.8 above fitZoom) so surroundings are still clear
    const targetZoom = Math.min(fitZoom + 0.6, 1.8);

    mapInstanceRef.current.flyTo(center, targetZoom, {
      duration: 0.5,
    });
  }, [selectedLocationId, locations, campus.image_height, campus.image_width]);

  const activeLoc = locations.find((l) => l.id === selectedLocationId);

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden bg-[#061e1b] select-none">
      {/* Map Container DOM */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Floating Top Indicator & Quick Zoom Out Controls */}
      <div className="absolute left-3 sm:left-4 top-3 z-20 flex flex-wrap items-center gap-2 max-w-[90%]">
        {/* If an area is selected: Prominent Back / Zoom Out button */}
        {activeLoc ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/70 bg-slate-950/90 p-1.5 text-xs text-white shadow-2xl backdrop-blur-md">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 font-bold text-xs text-white">
              {activeLoc.display_number}
            </span>
            <span className="max-w-[140px] sm:max-w-[200px] truncate font-bold text-slate-100 px-1">
              {activeLoc.name}
            </span>
            <button
              onClick={() => {
                onSelectLocation(null);
                handleFitBounds();
              }}
              className="flex items-center gap-1 rounded-lg bg-emerald-600/30 px-2.5 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white transition-colors"
              title="Quay lại toàn cảnh khuôn viên"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Toàn cảnh</span>
            </button>
            <button
              onClick={() => onSelectLocation(null)}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              title="Đóng chi tiết"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="pointer-events-none hidden sm:flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-slate-950/85 px-3 py-1.5 text-xs text-slate-200 shadow-xl backdrop-blur-md">
            <Compass className="h-3.5 w-3.5 text-emerald-400" />
            <span>Rê chuột xem nhanh • Nhấp vào khu vực để xem ảnh con</span>
          </div>
        )}

        {/* Global Reset View Button (Always visible on top bar) */}
        <button
          onClick={handleFitBounds}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-700/60 bg-slate-950/85 px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-xl backdrop-blur-md transition-all hover:bg-emerald-900/60 hover:text-white"
          title="Thu nhỏ xem toàn bộ khuôn viên cơ sở"
        >
          <RotateCcw className="h-3.5 w-3.5 text-emerald-400" />
          <span className="hidden xs:inline">Toàn cảnh cơ sở</span>
        </button>
      </div>

      {/* Floating Map Navigation Controls (Bottom-Left: Never obscured by right drawers) */}
      <div className="absolute left-3 sm:left-4 bottom-4 sm:bottom-6 z-20 flex flex-col gap-2">
        <div className="flex flex-col overflow-hidden rounded-xl border border-emerald-700/70 bg-slate-950/90 shadow-2xl backdrop-blur-md">
          <button
            onClick={handleZoomIn}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center text-slate-200 transition-colors hover:bg-emerald-800/50 hover:text-white active:bg-emerald-700"
            title="Phóng to bản đồ (+)"
            aria-label="Zoom in"
          >
            <Plus className="h-5 w-5" />
          </button>
          <div className="h-px bg-slate-800" />
          <button
            onClick={handleZoomOut}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center text-slate-200 transition-colors hover:bg-emerald-800/50 hover:text-white active:bg-emerald-700"
            title="Thu nhỏ bản đồ (-)"
            aria-label="Zoom out"
          >
            <Minus className="h-5 w-5" />
          </button>
          <div className="h-px bg-slate-800" />
          <button
            onClick={handleFitBounds}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center text-emerald-400 transition-colors hover:bg-emerald-800/50 hover:text-white"
            title="Thu nhỏ hết cỡ - Về khung toàn cảnh"
            aria-label="Reset zoom"
          >
            <RotateCcw className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <style>{`
        .custom-leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-leaflet-tooltip:before {
          display: none !important;
        }
        .leaflet-container {
          background: #061e1b !important;
          font-family: inherit;
        }
      `}</style>
    </div>
  );
};
