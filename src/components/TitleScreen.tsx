import React, { useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  User as UserIcon,
  LogOut,
  Compass,
  Trophy,
  Film,
  Sparkles,
  Share2,
} from 'lucide-react';
import { REGIONS } from '../data/regions';
import { RegionId } from '../types/game';
import { soundSynth } from '../audio/SoundSynth';
import { User } from 'firebase/auth';
import { Leaderboard } from './Leaderboard';

interface TitleScreenProps {
  selectedRegion: RegionId;
  onSelectRegion: (id: RegionId) => void;
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenTrailer: () => void;
  onOpenAPKModal: () => void;
  onOpenTacticalMap: () => void;
  onOpenUserProfileModal: () => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedRegion,
  onSelectRegion,
  onStartGame,
  isMuted,
  onToggleMute,
  onOpenTrailer,
  onOpenAPKModal,
  onOpenTacticalMap,
  onOpenUserProfileModal,
  user,
  onSignIn,
  onSignOut,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  const currentConfig = REGIONS[selectedRegion];

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between items-center p-4 md:p-8 select-none z-20">
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
            🇾🇪
          </div>
          <div>
            <span className="text-xs text-amber-400 font-extrabold tracking-wide block">
              تراث اليمن الخالد
            </span>
            <span className="text-[11px] text-slate-400">ملحمة الشجاعة والسيادة 3D</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* User Profile / Google Sign-in */}
          {user ? (
            <div className="flex items-center gap-2 mr-1">
              <button
                onClick={() => {
                  soundSynth.playClick();
                  onOpenUserProfileModal();
                }}
                className="hud-panel rounded-xl px-2.5 py-1.5 flex items-center gap-2 border border-amber-500/30 hover:border-amber-400 active:scale-95 transition-all cursor-pointer bg-slate-900/80"
                title="عرض ملف المحارب وسجل المعارك"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-lg object-cover border border-amber-400"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-amber-400" />
                )}
                <div className="flex flex-col text-right">
                  <span className="text-[11px] font-bold text-amber-300 truncate max-w-[110px]">
                    {user.displayName || 'محارب يمني'}
                  </span>
                  <span className="text-[9px] text-slate-400">سجل المعارك 📜</span>
                </div>
              </button>

              <button
                onClick={() => {
                  soundSynth.playClick();
                  onSignOut();
                }}
                className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/50 transition-all cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                soundSynth.playClick();
                onSignIn();
              }}
              className="hud-panel rounded-xl px-3 py-2 flex items-center gap-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-sm mr-1"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>تسجيل الدخول بـ Google</span>
            </button>
          )}

          {/* 3D Web Video Trailer */}
          <button
            onClick={() => {
              soundSynth.playClick();
              onOpenTrailer();
            }}
            className="hud-panel rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-rose-600/20 border border-rose-500/40 hover:border-rose-400 active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse"
            title="فيديو العرض السينمائي 3D للعبة"
          >
            <Film className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">فيديو الويب 3D</span>
            <span className="sm:hidden">الفيديو</span>
          </button>

          {/* Google Maps Tactical Button */}
          <button
            onClick={() => {
              soundSynth.playClick();
              onOpenTacticalMap();
            }}
            className="hud-panel rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-white bg-blue-600/20 border border-blue-500/30 hover:border-blue-400 active:scale-95 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">خريطة العمليات</span>
            <span className="sm:hidden">الخريطة</span>
          </button>

          {/* APK & Package Hub */}
          <button
            onClick={() => {
              soundSynth.playClick();
              onOpenAPKModal();
            }}
            className="hud-panel rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-500/10 border border-amber-500/30 active:scale-95 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-400" />
            <span>حزمة التثبيت والمشاركة</span>
          </button>

          {/* Audio */}
          <button
            onClick={() => {
              soundSynth.playClick();
              onToggleMute();
            }}
            className="hud-panel rounded-xl px-2.5 py-2 flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-amber-400 active:scale-95 transition-all cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Hero Centerpiece */}
      <div className="flex flex-col items-center text-center max-w-3xl my-auto">
        {/* SVG Title Lockup */}
        <div className="relative mb-5">
          <svg
            viewBox="0 0 680 140"
            className="w-full max-w-[540px] h-auto drop-shadow-[0_10px_25px_rgba(245,158,11,0.35)]"
          >
            <defs>
              <linearGradient id="yemenGold" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            <path
              d="M 60 70 C 140 20, 220 15, 340 15 C 460 15, 540 20, 620 70"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.6"
            />
            <path
              d="M 340 5 C 342 18, 345 28, 335 34 C 325 40, 318 42, 320 46 C 322 50, 332 48, 340 42 C 348 36, 355 24, 340 5 Z"
              fill="#fbbf24"
            />
            <text
              x="340"
              y="85"
              textAnchor="middle"
              className="font-tajawal"
              fontWeight="900"
              fontSize="64"
              fill="url(#yemenGold)"
              stroke="#0f172a"
              strokeWidth="2"
              letterSpacing="2"
            >
              مُحَارِبُ اليَمَن
            </text>
            <text
              x="340"
              y="120"
              textAnchor="middle"
              className="font-cinzel"
              fontWeight="800"
              fontSize="16"
              fill="#94a3b8"
              letterSpacing="5"
            >
              WARRIOR OF YEMEN 3D · BATTLE ROYALE TPS
            </text>
          </svg>
        </div>

        <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium max-w-xl mx-auto leading-relaxed mb-5">
          معركة باتل رويال ملحمية (Battle Royale) للبقاء على قيد الحياة. كن آخر محارب صامد في أرض سبأ وحمير، بمنظور الشخص الثالث عبر صنعاء ومأرب وحضرموت وسقطرى.
        </p>

        {/* Region Selector Grid with Google Maps satellite preview trigger */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 w-full max-w-2xl mb-6">
          {(Object.keys(REGIONS) as RegionId[]).map((rId) => {
            const reg = REGIONS[rId];
            const isSelected = selectedRegion === rId;
            return (
              <button
                key={rId}
                onClick={() => {
                  soundSynth.playClick();
                  onSelectRegion(rId);
                }}
                className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_16px_rgba(245,158,11,0.35)] scale-102'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">
                    {rId === 'sanaa' ? '🏛️' : rId === 'marib' ? '☀️' : rId === 'hadramout' ? '🏰' : '🌴'}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                  )}
                </div>
                <span className={`text-xs font-bold block ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                  {reg.nameAr}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {reg.landmarks[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tactical Map preview callout button */}
        <button
          onClick={() => {
            soundSynth.playClick();
            onOpenTacticalMap();
          }}
          className="mb-6 px-4 py-2 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-400 rounded-xl text-xs font-semibold text-amber-300 flex items-center gap-2 cursor-pointer transition-all shadow-sm"
        >
          <Compass className="w-4 h-4 text-amber-400" />
          <span>استكشف تضاريس ومعالم {currentConfig.nameAr} عبر Google Maps Satellite</span>
        </button>

        {/* Global Leaderboard Section */}
        <div className="w-full max-w-2xl mb-5">
          <Leaderboard />
        </div>

        {/* 3D Web Video Showcase Banner */}
        <div className="w-full max-w-md mb-4">
          <button
            onClick={() => {
              soundSynth.playClick();
              onOpenTrailer();
            }}
            className="w-full p-3 bg-gradient-to-r from-red-950/70 via-slate-900/90 to-amber-950/70 hover:from-red-900/80 hover:to-amber-900/80 border-2 border-amber-500/50 hover:border-amber-400 rounded-2xl text-right transition-all flex items-center justify-between gap-3 shadow-[0_0_25px_rgba(245,158,11,0.25)] group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <Film className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300">🎬 فيديو الويب السينمائي 3D (Web Video)</span>
                  <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">جديد</span>
                </div>
                <span className="text-[10px] text-slate-300 block">
                  شاهد الهبوط بالمظلة التكتيكية ومعارك أزقة صنعاء ومأرب وحضرموت وسقطرى
                </span>
              </div>
            </div>
            <span className="text-amber-400 text-sm font-bold pl-2 group-hover:translate-x-[-3px] transition-transform">◀</span>
          </button>
        </div>

        {/* Primary Start CTA Button */}
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <button
            onClick={() => {
              soundSynth.playClick();
              onStartGame();
            }}
            className="w-full py-4 px-8 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black rounded-2xl text-lg shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>ابدأ المعركة في {currentConfig.nameAr}</span>
          </button>
          <span className="text-xs text-amber-300/80 font-mono">
            اضغط [ <kbd className="font-bold text-white">Enter</kbd> أو <kbd className="font-bold text-white">Space</kbd> ] للبدء فوراً
          </span>
        </div>
      </div>

      {/* Flat Control Hint Line */}
      <div className="w-full max-w-4xl text-center border-t border-slate-800/80 pt-3">
        <div className="text-xs text-slate-400 font-medium flex flex-wrap items-center justify-center gap-2 md:gap-4">
          <span><strong className="text-slate-200">عصا التحكم / WASD</strong> الحركة</span>
          <span>·</span>
          <span><strong className="text-slate-200">سحب الشاشة يميناً</strong> التوجيه والتصويب</span>
          <span>·</span>
          <span><strong className="text-slate-200">إطلاق النار</strong> زر الإطلاق</span>
          <span>·</span>
          <span><strong className="text-slate-200">F</strong> طعنة الجنبية</span>
          <span>·</span>
          <span><strong className="text-slate-200">E</strong> صيحة المحارب</span>
          <span>·</span>
          <span><strong className="text-slate-200">Esc</strong> إيقاف مؤقت</span>
        </div>
      </div>
    </div>
  );
};
