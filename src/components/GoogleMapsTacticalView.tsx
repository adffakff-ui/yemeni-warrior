import React, { useState, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { REGIONS } from '../data/regions';
import { RegionId } from '../types/game';
import { soundSynth } from '../audio/SoundSynth';
import { MapPin, Navigation, Crosshair, X, Shield, Eye, Compass, Layers } from 'lucide-react';

interface GoogleMapsTacticalViewProps {
  currentRegionId: RegionId;
  onSelectRegion: (id: RegionId) => void;
  onClose: () => void;
  onDeployNow?: (id: RegionId) => void;
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBv6PU_Eb4KQRu8JnnOY1h0EPbIn1PUkII';

export const GoogleMapsTacticalView: React.FC<GoogleMapsTacticalViewProps> = ({
  currentRegionId,
  onSelectRegion,
  onClose,
  onDeployNow,
}) => {
  const [selectedPinRegion, setSelectedPinRegion] = useState<RegionId>(currentRegionId);
  const [showInfoWindow, setShowInfoWindow] = useState<boolean>(true);
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap'>('hybrid');
  const [activeCenter, setActiveCenter] = useState(REGIONS[currentRegionId].coordinates);
  const [activeZoom, setActiveZoom] = useState(REGIONS[currentRegionId].mapZoom);

  const currentConfig = REGIONS[selectedPinRegion];

  const handleSelectRegionPin = useCallback(
    (id: RegionId) => {
      soundSynth.playClick();
      setSelectedPinRegion(id);
      onSelectRegion(id);
      setActiveCenter(REGIONS[id].coordinates);
      setActiveZoom(REGIONS[id].mapZoom);
      setShowInfoWindow(true);
    },
    [onSelectRegion]
  );

  const handleDeploy = () => {
    soundSynth.playClick();
    if (onDeployNow) {
      onDeployNow(selectedPinRegion);
    } else {
      onSelectRegion(selectedPinRegion);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-slate-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.25)]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-extrabold uppercase tracking-wider">
                  Google Maps Platform · خريطة العمليات التكتيكية
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  قمر صناعي مباشر
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                استكشاف ميادين ومعالم اليمن التاريخية
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundSynth.playClick();
                setMapType((prev) => (prev === 'hybrid' ? 'roadmap' : 'hybrid'));
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>{mapType === 'hybrid' ? 'عرض تضاريسي / هجين' : 'عرض الخريطة الرقمية'}</span>
            </button>

            <button
              onClick={() => {
                soundSynth.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 flex items-center justify-center text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Map Container + Side Tactical Briefing Drawer */}
        <div className="relative flex-1 w-full h-full flex flex-col md:flex-row overflow-hidden">
          {/* Google Maps Interactive Viewport */}
          <div className="relative flex-1 w-full h-full min-h-[300px]">
            {API_KEY ? (
              <APIProvider apiKey={API_KEY} language="ar" region="YE">
                <Map
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  center={activeCenter}
                  zoom={activeZoom}
                  mapTypeId={mapType}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  style={{ width: '100%', height: '100%' }}
                >
                  {/* Advanced Markers for All 4 Battle Regions */}
                  {(Object.keys(REGIONS) as RegionId[]).map((rId) => {
                    const r = REGIONS[rId];
                    const isSelected = selectedPinRegion === rId;
                    return (
                      <AdvancedMarker
                        key={rId}
                        position={r.coordinates}
                        title={r.nameAr}
                        onClick={() => handleSelectRegionPin(rId)}
                      >
                        <div
                          className={`relative cursor-pointer transition-transform duration-300 ${
                            isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                          }`}
                        >
                          <Pin
                            background={isSelected ? '#f59e0b' : '#0f172a'}
                            borderColor={isSelected ? '#ffffff' : '#f59e0b'}
                            glyphColor={isSelected ? '#0f172a' : '#f59e0b'}
                            scale={isSelected ? 1.3 : 1.0}
                          />
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-md border border-amber-500/40 shadow-lg pointer-events-none">
                            {r.nameAr}
                          </div>
                        </div>
                      </AdvancedMarker>
                    );
                  })}

                  {/* InfoWindow for Active Region */}
                  {showInfoWindow && currentConfig && (
                    <InfoWindow
                      position={currentConfig.coordinates}
                      onCloseClick={() => setShowInfoWindow(false)}
                      pixelOffset={[0, -40]}
                    >
                      <div className="p-2 text-right max-w-xs font-tajawal text-slate-900 select-text">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-2">
                          <span className="text-xs font-black text-amber-700">🇾🇪 {currentConfig.nameAr}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {currentConfig.coordinates.lat.toFixed(4)}°N, {currentConfig.coordinates.lng.toFixed(4)}°E
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-700 leading-relaxed mb-2 font-medium">
                          {currentConfig.subtitleAr}
                        </p>
                        <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-[10px] text-amber-900 mb-2">
                          <strong className="block text-amber-800">أبرز المعالم:</strong>
                          <span>{currentConfig.landmarks.slice(0, 2).join(' · ')}</span>
                        </div>
                        <button
                          onClick={handleDeploy}
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md text-xs transition-all cursor-pointer"
                        >
                          انشر قواتك في هذا الميدان ⚔️
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Crosshair className="w-12 h-12 text-amber-400 mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-1">خريطة العمليات التكتيكية جاهزة</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  تم ضبط وتفعيل مكتبات Google Maps Platform الرسمية.
                </p>
              </div>
            )}

            {/* Quick Region Selector Overlaid Bottom Left */}
            <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-auto z-10 flex flex-wrap gap-2 pointer-events-auto">
              {(Object.keys(REGIONS) as RegionId[]).map((rId) => {
                const r = REGIONS[rId];
                const isSelected = selectedPinRegion === rId;
                return (
                  <button
                    key={rId}
                    onClick={() => handleSelectRegionPin(rId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-105'
                        : 'bg-slate-900/80 backdrop-blur-md text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {rId === 'sanaa' ? '🏛️' : rId === 'marib' ? '☀️' : rId === 'hadramout' ? '🏰' : '🌴'}{' '}
                    {r.nameAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Side Tactical Briefing Drawer */}
          <div className="w-full md:w-80 lg:w-96 bg-slate-900/95 border-t md:border-t-0 md:border-r border-slate-800 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {/* Region Overview Badge */}
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-amber-500/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-amber-400 font-extrabold uppercase">
                    معلومات القطاع الاستراتيجي
                  </span>
                  <span className="text-xs">🇾🇪</span>
                </div>
                <h3 className="text-lg font-black text-white mb-0.5">{currentConfig.nameAr}</h3>
                <p className="text-xs text-slate-400 font-mono mb-2">
                  الإحداثيات: {currentConfig.coordinates.lat}° N, {currentConfig.coordinates.lng}° E
                </p>
                <p className="text-xs text-slate-300 leading-relaxed">{currentConfig.subtitleAr}</p>
              </div>

              {/* Landmarks */}
              <div>
                <span className="text-xs font-bold text-amber-300 mb-2 block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  المعالم التاريخية الموثقة:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {currentConfig.landmarks.map((lm, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-300 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="truncate">{lm}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relics to Secure in this Region */}
              <div>
                <span className="text-xs font-bold text-amber-300 mb-2 block flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  الغنائم والآثار المستهدفة في المعركة:
                </span>
                <div className="space-y-1.5">
                  {currentConfig.relics.slice(0, 3).map((relic) => (
                    <div
                      key={relic.id}
                      className="p-2 bg-slate-950/50 rounded-xl border border-slate-800 flex items-center gap-2.5 text-xs"
                    >
                      <span className="text-lg p-1 bg-amber-500/10 rounded-lg">{relic.icon}</span>
                      <div className="overflow-hidden">
                        <span className="font-bold text-amber-200 block truncate">{relic.nameAr}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{relic.descAr}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deploy CTA */}
            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={handleDeploy}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black rounded-xl text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crosshair className="w-4 h-4" />
                <span>نشر القوات في {currentConfig.nameAr} والقتال</span>
              </button>
              <p className="text-[10px] text-center text-slate-500">
                مدعوم بواسطة خرائط Google Maps Platform للصور الفضائية عالية الدقة
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
