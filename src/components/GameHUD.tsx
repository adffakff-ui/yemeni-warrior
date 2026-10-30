import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Pause,
  Sparkles,
  Shield,
  Zap,
  Crosshair,
  Eye,
  RotateCw,
  Users,
  ArrowUp,
} from 'lucide-react';
import { REGIONS } from '../data/regions';
import { CameraViewMode, KillLogItem, RadarBlip, RegionId } from '../types/game';
import { triggerHaptic } from './GameCanvas3D';

interface GameHUDProps {
  regionId: RegionId;
  onChangeRegion: (r: RegionId) => void;
  viewMode: CameraViewMode;
  onToggleViewMode: () => void;
  isAiming: boolean;
  onToggleAim: () => void;
  isCrouching: boolean;
  onToggleCrouch: () => void;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  score: number;
  kills: number;
  relicsCount: number;
  enemiesLeft: number;
  playersAlive: number;
  zoneRadius: number;
  ammoClip: number;
  ammoReserve: number;
  onTriggerReload: () => void;
  radarBlips: RadarBlip[];
  killLogs: KillLogItem[];
  damageFlash: boolean;
  toastMessage: string | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  // Touch & camera inputs passed to canvas
  onJoystickMove: (vector: { x: number; y: number }) => void;
  onCameraRotate?: (deltaX: number, deltaY: number) => void;
  onTouchFireStart: () => void;
  onTouchFireEnd: () => void;
  onTriggerJump: () => void;
  onTriggerDash: () => void;
  onTriggerSlash: () => void;
  onTriggerRoar: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  regionId,
  onChangeRegion,
  viewMode,
  onToggleViewMode,
  isAiming,
  onToggleAim,
  isCrouching,
  onToggleCrouch,
  health,
  maxHealth,
  energy,
  maxEnergy,
  score,
  kills,
  relicsCount,
  enemiesLeft,
  playersAlive,
  zoneRadius,
  ammoClip,
  ammoReserve,
  onTriggerReload,
  radarBlips,
  killLogs,
  damageFlash,
  toastMessage,
  isMuted,
  onToggleMute,
  onPause,
  onJoystickMove,
  onCameraRotate,
  onTouchFireStart,
  onTouchFireEnd,
  onTriggerJump,
  onTriggerDash,
  onTriggerSlash,
  onTriggerRoar,
}) => {
  const currentRegion = REGIONS[regionId];
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Joystick touch tracking
  const joystickRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const centerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera Swipe Aim Zone Tracking
  const cameraTouchIdRef = useRef<number | null>(null);
  const prevCameraTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      setIsTouchDevice(true);
    }
  }, []);

  // Universal Joystick Pointer Handlers (Works on Touch, Stylus, and Mouse Drag)
  const processJoystickCoords = (clientX: number, clientY: number) => {
    if (!thumbRef.current) return;
    const dx = clientX - centerRef.current.x;
    const dy = clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 44;

    if (dist === 0) {
      onJoystickMove({ x: 0, y: 0 });
      thumbRef.current.style.transform = 'translate(0px, 0px)';
    } else {
      const angle = Math.atan2(dy, dx);
      const clamped = Math.min(dist, maxDist);
      const vx = Math.cos(angle) * (clamped / maxDist);
      const vy = Math.sin(angle) * (clamped / maxDist);
      onJoystickMove({ x: vx, y: vy });
      thumbRef.current.style.transform = `translate(${Math.cos(angle) * clamped}px, ${Math.sin(angle) * clamped}px)`;
    }
  };

  const handleJoystickPointerDown = (e: React.PointerEvent) => {
    if (!joystickRef.current) return;
    activePointerIdRef.current = e.pointerId;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    const rect = joystickRef.current.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
    processJoystickCoords(e.clientX, e.clientY);
  };

  const handleJoystickPointerMove = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    processJoystickCoords(e.clientX, e.clientY);
  };

  const handleJoystickPointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current === e.pointerId) {
      activePointerIdRef.current = null;
      onJoystickMove({ x: 0, y: 0 });
      if (thumbRef.current) {
        thumbRef.current.style.transform = 'translate(0px, 0px)';
      }
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Right-Side Touch Camera Swipe / Aim Handlers
  const handleCameraAimDown = (e: React.PointerEvent) => {
    cameraTouchIdRef.current = e.pointerId;
    prevCameraTouchRef.current = { x: e.clientX, y: e.clientY };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleCameraAimMove = (e: React.PointerEvent) => {
    if (cameraTouchIdRef.current !== e.pointerId) return;
    const dx = e.clientX - prevCameraTouchRef.current.x;
    const dy = e.clientY - prevCameraTouchRef.current.y;
    prevCameraTouchRef.current = { x: e.clientX, y: e.clientY };
    if (onCameraRotate) {
      onCameraRotate(dx, dy);
    }
  };

  const handleCameraAimUp = (e: React.PointerEvent) => {
    if (cameraTouchIdRef.current === e.pointerId) {
      cameraTouchIdRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const healthPct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const energyPct = Math.max(0, Math.min(100, (energy / maxEnergy) * 100));

  return (
    <>
      {/* Top Yemeni Flag Line Accent */}
      <div className="fixed top-0 left-0 right-0 h-1.5 flex pointer-events-none z-30">
        <div className="w-1/3 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]" />
        <div className="w-1/3 bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
        <div className="w-1/3 bg-black shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Blood Vignette Effect on Damage & Low Health */}
      <div
        id="damage-overlay"
        className={`fixed inset-0 pointer-events-none transition-opacity duration-200 z-15 ${
          damageFlash
            ? 'opacity-85'
            : healthPct < 30
            ? 'opacity-60 animate-pulse'
            : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(220, 38, 38, 0.75) 100%)',
        }}
      />

      {/* Full-Screen Sniper Scope Overlay (Active when Aiming in FPS Mode) */}
      {isAiming && viewMode === 'FPS' && (
        <div
          id="scope-overlay"
          className="fixed inset-0 pointer-events-none z-18 flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.94) 31%)',
          }}
        >
          {/* Sniper Reticle Lines */}
          <div className="absolute w-full h-[1px] bg-emerald-400/70 shadow-[0_0_4px_#34d399]" />
          <div className="absolute h-full w-[1px] bg-emerald-400/70 shadow-[0_0_4px_#34d399]" />
          <div className="w-2.5 h-2.5 rounded-full border border-emerald-400/80" />
          <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />

          {/* Scope Markings */}
          <div className="absolute top-[28%] text-[10px] font-mono text-emerald-400/80">
            ▲ RANGE: 100M
          </div>
          <div className="absolute bottom-[28%] text-[10px] font-mono text-emerald-400/80">
            ▼ 4X TACTICAL ZOOM
          </div>
        </div>
      )}

      {/* Standard Interactive Crosshair (Hidden during Sniper Scope) */}
      {(!isAiming || viewMode === 'TPS') && (
        <div
          id="crosshair"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 w-8 h-8 flex items-center justify-center transition-all duration-150"
        >
          <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
          <div className="absolute w-3 h-0.5 bg-white/80 -left-3.5 shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          <div className="absolute w-3 h-0.5 bg-white/80 -right-3.5 shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          <div className="absolute w-0.5 h-3 bg-white/80 -top-3.5 shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          <div className="absolute w-0.5 h-3 bg-white/80 -bottom-3.5 shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
        </div>
      )}

      {/* Center Toast Notification */}
      <div
        className={`fixed top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-all duration-300 ${
          toastMessage ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-3 scale-95'
        }`}
      >
        <div className="hud-panel bg-black/85 text-amber-300 border border-amber-500/50 px-5 py-2 rounded-full font-bold text-xs sm:text-sm backdrop-blur-md shadow-[0_4px_24px_rgba(245,158,11,0.3)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      </div>

      {/* Outer HUD Overlay Container */}
      <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-3 md:p-6 overflow-hidden">
        {/* Top Perimeter HUD */}
        <div className="flex flex-wrap items-start justify-between gap-3 w-full">
          {/* Left Cluster: Player Health & Squad Status */}
          <div className="hud-panel rounded-2xl p-3 w-64 md:w-72 pointer-events-auto border-r-4 border-red-600">
            {/* Health Bar */}
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
                صحة القائد
              </span>
              <span className="tabular-nums font-mono text-slate-200">
                {health} / {maxHealth}
              </span>
            </div>
            <div className="w-full bg-slate-900/80 rounded-full h-2.5 overflow-hidden border border-slate-700/60 p-0.5 mb-2">
              <div
                className="h-full rounded-full transition-all duration-200 shadow-sm"
                style={{
                  width: `${healthPct}%`,
                  background:
                    healthPct > 50
                      ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                      : healthPct > 25
                      ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                      : 'linear-gradient(90deg, #e11d48 0%, #f43f5e 100%)',
                }}
              />
            </div>

            {/* Energy Bar (Warrior Roar) */}
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Zap className="w-3.5 h-3.5" />
                طاقة الصيحة
              </span>
              <span className="tabular-nums font-mono text-slate-300">
                {energy} / {maxEnergy}
              </span>
            </div>
            <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden border border-slate-700/60 mb-2">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-150"
                style={{ width: `${energyPct}%` }}
              />
            </div>

            {/* Battle Royale Alive Count & Relics */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-700/50 text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                الناجون المتبقون:
              </span>
              <span className="font-extrabold text-sky-400 font-mono text-xs">
                {playersAlive}
              </span>
            </div>
            
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span className="text-slate-300 font-bold flex items-center gap-1">
                <div className="w-3.5 h-3.5 rounded-full border border-amber-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                </div>
                منطقة الخطر:
              </span>
              <span className="font-extrabold text-amber-500 font-mono text-xs">
                {Math.round(zoneRadius)}م
              </span>
            </div>
          </div>

          {/* Killfeed Log (Top Center) */}
          <div className="hidden sm:flex flex-col gap-1.5 max-h-28 w-60 overflow-hidden pointer-events-none text-right text-xs">
            {killLogs.slice(-3).map((item) => (
              <div
                key={item.id}
                className="bg-black/75 text-amber-300 border-r-2 border-amber-500 px-2.5 py-1 rounded backdrop-blur-md shadow-md animate-fadeIn"
              >
                <span>⚔️ {item.text}</span>
              </div>
            ))}
          </div>

          {/* Right Cluster: Mini-Map Radar + Controls */}
          <div className="flex items-start gap-2.5 pointer-events-auto">
            {/* View Mode Toggle Button (FPS / TPS) */}
            <button
              onClick={onToggleViewMode}
              title="تبديل زاوية الرؤية (V)"
              className="hud-panel rounded-2xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold text-sky-300 hover:text-white bg-sky-500/10 hover:bg-sky-500/20 active:scale-95 transition-all cursor-pointer border border-sky-400/30"
            >
              <Eye className="w-4 h-4 text-sky-400" />
              <span>{viewMode === 'FPS' ? 'FPS' : 'TPS'}</span>
            </button>

            {/* Aim Down Sights (ADS) Toggle Button */}
            <button
              onClick={onToggleAim}
              title="تصويب دقيق بالمنظار (الزر الأيمن)"
              className={`hud-panel rounded-2xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer border ${
                isAiming
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                  : 'border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              <span>منظار</span>
            </button>

            {/* Stance Toggle (Crouch / Stand) */}
            <button
              onClick={onToggleCrouch}
              title="وضعية القرفصاء التكتيكية (C)"
              className={`hud-panel rounded-2xl px-3 py-2 flex items-center gap-1.5 text-xs font-bold active:scale-95 transition-all cursor-pointer border ${
                isCrouching
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                  : 'border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <span>{isCrouching ? 'قرفصاء' : 'وقوف'}</span>
            </button>

            {/* Region Selector */}
            <div className="hud-panel rounded-2xl px-2.5 py-1.5 flex items-center gap-1.5">
              <select
                value={regionId}
                onChange={(e) => onChangeRegion(e.target.value as RegionId)}
                className="bg-transparent text-amber-300 font-bold text-xs outline-none cursor-pointer pr-1"
              >
                <option value="sanaa" className="bg-slate-900 text-white">صنعاء 🇾🇪</option>
                <option value="marib" className="bg-slate-900 text-white">مأرب 🏛️</option>
                <option value="hadramout" className="bg-slate-900 text-white">حضرموت 🏰</option>
                <option value="socotra" className="bg-slate-900 text-white">سقطرى 🌴</option>
              </select>
            </div>

            {/* Sound Mute Toggle */}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              className="hud-panel rounded-2xl p-2.5 text-slate-300 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            {/* Pause Button */}
            <button
              onClick={onPause}
              title="إيقاف مؤقت (Esc)"
              className="hud-panel rounded-2xl p-2.5 text-slate-300 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>

            {/* Mini-Map / Radar Display */}
            <div
              className="hud-panel w-20 h-20 md:w-24 md:h-24 rounded-2xl relative overflow-hidden border border-amber-500/40 flex items-center justify-center shadow-lg"
              title="الرادار: الأخضر = المحارب، الأحمر = الأعداء، الأصفر = الآثار"
            >
              {/* Radar Grid Circles */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:8px_8px]" />
              <div className="absolute w-12 h-12 md:w-16 md:h-16 rounded-full border border-amber-500/20 pointer-events-none" />
              <div className="absolute w-6 h-6 md:w-8 md:h-8 rounded-full border border-amber-500/30 pointer-events-none" />

              {/* Player Green Dot in Center */}
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full z-10 shadow-[0_0_8px_#10b981] pointer-events-none" />

              {/* Dynamic Radar Blips */}
              <div className="absolute inset-0 pointer-events-none">
                {radarBlips.map((blip) => {
                  const leftPct = Math.max(5, Math.min(95, 50 + (blip.relX / 60) * 44));
                  const topPct = Math.max(5, Math.min(95, 50 + (blip.relZ / 60) * 44));
                  return (
                    <div
                      key={blip.id}
                      className={`absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-100 ${
                        blip.isEnemy
                          ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                          : 'bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-ping'
                      }`}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Corner Tag */}
              <span className="absolute bottom-1 right-2 text-[8px] font-mono font-bold text-amber-500/60 pointer-events-none">
                رادار 60m
              </span>
            </div>
          </div>
        </div>

        {/* Desktop Keyboard Controls Legend */}
        <div className="hidden lg:flex justify-center items-center pointer-events-none mb-1">
          <div className="hud-panel px-4 py-1.5 rounded-full text-slate-400 text-[11px] font-medium tracking-wide flex items-center gap-3">
            <span><strong className="text-slate-200">WASD</strong> التحرك</span>
            <span>·</span>
            <span><strong className="text-slate-200">Shift</strong> الركض السريع</span>
            <span>·</span>
            <span><strong className="text-slate-200">الزر الأيسر</strong> إطلاق النار</span>
            <span>·</span>
            <span><strong className="text-slate-200">الزر الأيمن</strong> المنظار (ADS)</span>
            <span>·</span>
            <span><strong className="text-slate-200">C</strong> قرفصاء / وقوف</span>
            <span>·</span>
            <span><strong className="text-slate-200">R</strong> تعبئة الذخيرة</span>
            <span>·</span>
            <span><strong className="text-slate-200">F</strong> ضربة جنبية</span>
            <span>·</span>
            <span><strong className="text-slate-200">Space</strong> مراوغة</span>
            <span>·</span>
            <span><strong className="text-slate-200">V</strong> تبديل المنظور</span>
          </div>
        </div>

        {/* Right-Side Dedicated Camera Swipe & Aim Zone (Like PUBG / Free Fire & Attached Code) */}
        <div
          id="camera-touch-zone"
          onPointerDown={handleCameraAimDown}
          onPointerMove={handleCameraAimMove}
          onPointerUp={handleCameraAimUp}
          onPointerCancel={handleCameraAimUp}
          className="absolute top-16 right-0 bottom-28 w-1/2 pointer-events-auto touch-none select-none z-10"
          style={{ touchAction: 'none' }}
        />

        {/* Bottom Perimeter Controls (Tactile Touch & Ammo Box) */}
        <div className="flex items-end justify-between w-full pointer-events-none pb-2 z-20">
          {/* Left: Virtual Touch Joystick */}
          <div
            ref={joystickRef}
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            className={`relative w-28 h-28 md:w-32 md:h-32 joystick-base rounded-full flex items-center justify-center pointer-events-auto touch-none select-none ${
              isTouchDevice ? 'opacity-95' : 'opacity-60 hover:opacity-95 transition-opacity'
            }`}
            style={{ touchAction: 'none' }}
          >
            {/* Center origin indicator */}
            <div className="absolute w-4 h-4 rounded-full border border-amber-500/40 pointer-events-none" />
            <div
              ref={thumbRef}
              className="w-12 h-12 md:w-14 md:h-14 joystick-thumb rounded-full pointer-events-none transition-transform duration-75 flex items-center justify-center shadow-lg"
            >
              <div className="w-4 h-4 rounded-full bg-amber-200/60" />
            </div>
            <span className="absolute -bottom-5 text-[10px] font-bold text-amber-400 tracking-wider">
              عصا التحرك
            </span>
          </div>

          {/* Right: Ammo Box + Actions Cluster */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto z-30">
            {/* Ammo & Reload Section */}
            <div className="flex items-center gap-2">
              {/* Reload Button */}
              <button
                onClick={onTriggerReload}
                title="إعادة تعبئة الذخيرة (R)"
                className="hud-panel px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 active:scale-95 flex items-center gap-1.5 border border-amber-500/30 cursor-pointer shadow-md"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>تعبئة [R]</span>
              </button>

              {/* Ammo Status Box */}
              <div className="hud-panel p-1.5 px-3 rounded-2xl flex items-center gap-3 border-r-4 border-amber-500 shadow-lg">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Crosshair className="w-3.5 h-3.5" />
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    سلاح اقتحام
                  </div>
                  <div className="text-base md:text-lg font-black font-mono tracking-wider flex items-baseline gap-1">
                    <span className={ammoClip <= 5 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}>
                      {ammoClip}
                    </span>
                    <span className="text-slate-500 text-xs">/</span>
                    <span className="text-slate-400 text-xs">{ammoReserve}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Cluster */}
            <div className="flex items-center gap-1.5 md:gap-2">
              {/* Mobile Aim Button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onToggleAim();
                }}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex flex-col items-center justify-center text-amber-400 active:scale-90 transition-transform cursor-pointer border ${
                  isAiming
                    ? 'bg-amber-500/30 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                    : 'bg-slate-900/80 border-slate-700'
                }`}
                title="تصويب بالمنظار"
              >
                <Crosshair className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">صوب</span>
              </button>

              {/* Mobile Crouch Button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onToggleCrouch();
                }}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex flex-col items-center justify-center text-white active:scale-90 transition-transform cursor-pointer border ${
                  isCrouching
                    ? 'bg-emerald-600/50 border-emerald-400'
                    : 'bg-slate-900/80 border-slate-700'
                }`}
                title="قرفصاء (C)"
              >
                <span className="text-xs font-black">C</span>
                <span className="text-[8px] text-slate-300">انحناء</span>
              </button>

              {/* Mobile Jump Button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onTriggerJump();
                }}
                className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 flex flex-col items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                title="قفز (Space)"
              >
                <ArrowUp className="w-4 h-4 text-sky-400 mb-0.5" />
                <span className="text-[8px] text-sky-300">قفز</span>
              </button>

              {/* Dash Button */}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onTriggerDash();
                }}
                className="w-11 h-11 md:w-12 md:h-12 dash-btn rounded-full flex flex-col items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                title="مراوغة (Shift)"
              >
                <Zap className="w-4 h-4 mb-0.5" />
                <span className="text-[8px]">مراوغة</span>
              </button>

              {/* Dagger Slash Button */}
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onTriggerSlash();
                }}
                className="w-11 h-11 md:w-12 md:h-12 special-btn rounded-full flex flex-col items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                title="ضربة جنبية (F)"
              >
                <span className="text-xs">🗡️</span>
                <span className="text-[8px]">جنبية</span>
              </button>

              {/* Special Roar Button */}
              <button
                onClick={() => {
                  triggerHaptic('heavy');
                  onTriggerRoar();
                }}
                disabled={energy < 40}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex flex-col items-center justify-center text-white active:scale-90 transition-transform cursor-pointer border-2 ${
                  energy >= 40
                    ? 'bg-amber-600 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                    : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
                }`}
                title="صيحة المحارب (E)"
              >
                <span className="text-xs">⚡</span>
                <span className="text-[8px]">صيحة</span>
              </button>

              {/* Primary Musket Fire Button */}
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  triggerHaptic('medium');
                  onTouchFireStart();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  onTouchFireEnd();
                }}
                onMouseDown={() => {
                  triggerHaptic('medium');
                  onTouchFireStart();
                }}
                onMouseUp={onTouchFireEnd}
                className="w-16 h-16 md:w-20 md:h-20 action-btn rounded-full flex flex-col items-center justify-center text-white active:scale-90 transition-transform cursor-pointer ml-1"
                title="إطلاق نار (زر الفأرة)"
              >
                <Crosshair className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow-md mb-0.5" />
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider">إطلاق</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
