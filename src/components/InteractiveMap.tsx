import React, { useState } from 'react';
import { MapAdapterProps } from './map/MapAdapter';
import { AppleMapView } from './map/AppleMapView';
import { MapLibreView } from './map/MapLibreView';
import { ActiveMapEngine } from '../types';

/**
 * InteractiveMap with Apple Maps as the primary default engine:
 * - Official Apple MapKit JS integration & Cupertino styling
 * - Standard, Satellite, Hybrid & Official Apple Maps Embed
 * - Interactive 3D compound polygon extrusion & real-time distance measuring
 * - Seamless toggle to 3D Photorealistic Satellite Engine
 */
export const InteractiveMap: React.FC<MapAdapterProps> = (props) => {
  const [engine, setEngine] = useState<ActiveMapEngine>('apple');

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Engine Switcher Ribbon */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1 bg-slate-950/90 backdrop-blur-md p-1 rounded-2xl shadow-2xl border border-slate-700/90 text-xs">
        <button
          type="button"
          onClick={() => setEngine('apple')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold transition-all ${
            engine === 'apple'
              ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white'
          }`}
          title="Bản đồ Apple Maps (Cupertino / MapKit JS)"
        >
          <span className="text-sm leading-none"></span>
          <span>Apple Maps</span>
        </button>
        <button
          type="button"
          onClick={() => setEngine('maplibre')}
          className={`flex items-center gap-1 px-3 py-1 rounded-xl font-medium transition-all ${
            engine === 'maplibre'
              ? 'bg-slate-800 text-white shadow-md border border-slate-600 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Bản đồ Vệ tinh 3D chi tiết"
        >
          <span>Vệ tinh 3D</span>
        </button>
      </div>

      {/* Render Active Map Engine */}
      <div className="w-full h-full">
        {engine === 'apple' ? (
          <AppleMapView {...props} />
        ) : (
          <MapLibreView {...props} />
        )}
      </div>
    </div>
  );
};
