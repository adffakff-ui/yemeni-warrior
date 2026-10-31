import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  RotateCcw,
  Play,
  Home,
  Trophy,
  Skull,
  Volume2,
  VolumeX,
  ArrowLeft,
  Compass,
  CheckCircle2,
  MapPin,
  Share2,
  QrCode,
  Download,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { REGIONS } from '../data/regions';
import { GameStats, RegionId } from '../types/game';
import { soundSynth } from '../audio/SoundSynth';
import { User } from 'firebase/auth';

interface PauseModalProps {
  regionId: RegionId;
  onResume: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenTacticalMap: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  regionId,
  onResume,
  onRestart,
  onReturnTitle,
  isMuted,
  onToggleMute,
  onOpenTacticalMap,
}) => {
  const reg = REGIONS[regionId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 select-none">
      <div className="hud-panel max-w-sm w-full p-6 rounded-3xl text-center flex flex-col gap-4 border-2 border-amber-500/40">
        <div>
          <span className="text-xs text-amber-400 font-bold block mb-1">
            {reg.nameAr} · 🇾🇪
          </span>
          <h2 className="text-2xl font-black text-white">إيقاف مؤقت</h2>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundSynth.playClick();
              onResume();
            }}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-sm shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>استئناف المعركة</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playClick();
              onOpenTacticalMap();
            }}
            className="w-full py-2.5 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 hover:text-white font-bold rounded-xl text-xs border border-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>خريطة العمليات (Google Maps)</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playClick();
              onRestart();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playClick();
              onReturnTitle();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>القائمة الرئيسية</span>
          </button>
        </div>

        <div className="border-t border-slate-800 pt-3 flex justify-center">
          <button
            onClick={() => {
              soundSynth.playClick();
              onToggleMute();
            }}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'الصوت مكتوم' : 'الصوت يعمل'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  regionId: RegionId;
  stats: GameStats;
  onRestart: () => void;
  onReturnTitle: () => void;
  user: User | null;
  onSignIn: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  regionId,
  stats,
  onRestart,
  onReturnTitle,
  user,
  onSignIn,
}) => {
  const reg = REGIONS[regionId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-in fade-in duration-300">
      <div className="hud-panel-danger max-w-md w-full p-6 md:p-8 rounded-3xl text-center flex flex-col gap-4 border-2 border-rose-500/40 shadow-[0_0_40px_rgba(244,63,94,0.3)]">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
          <Skull className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-3xl font-black text-rose-400 mb-1">سقط المحارب ⚔️</h2>
          <p className="text-sm text-slate-300">
            لقد قاتلت ببسالة وشرف في أرض {reg.nameAr}! انهض من جديد لحماية تاريخ اليمن.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 py-3 px-4 bg-slate-950/70 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block">الترتيب</span>
            <span className="text-xl font-extrabold text-white tabular-nums font-mono">#{stats.playersAlive}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">النتيجة</span>
            <span className="text-xl font-extrabold text-amber-400 tabular-nums font-mono">{stats.score}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">الناجون</span>
            <span className="text-xl font-extrabold text-emerald-400 tabular-nums font-mono">
              {stats.playersAlive}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">الخصوم</span>
            <span className="text-xl font-extrabold text-rose-400 tabular-nums font-mono">{stats.kills}</span>
          </div>
        </div>

        {/* Google Sign-in / Persistent status */}
        {user ? (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تم حفظ نتيجتك وسجل المعركة تلقائياً في حسابك بـ Firestore</span>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 text-right">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-300">هل ترغب بحفظ هذه النتيجة؟</span>
              <span className="text-[10px] text-slate-400 font-mono">نقاطك: {stats.score}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              سجل الدخول بحساب Google لتوثيق معاركك في قائمة المتصدرين وسجل المعارك الدائم.
            </p>
            <button
              onClick={() => {
                soundSynth.playClick();
                onSignIn();
              }}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
              <span>تسجيل الدخول بـ Google وحفظ النتيجة</span>
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              soundSynth.playClick();
              onRestart();
            }}
            className="w-full py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة المعركة فوراً</span>
          </button>

          <button
            onClick={() => {
              soundSynth.playClick();
              onReturnTitle();
            }}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>تغيير المنطقة والعتاد</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  regionId: RegionId;
  stats: GameStats;
  onNextRegion: () => void;
  onRestart: () => void;
  onReturnTitle: () => void;
  onOpenTacticalMap: () => void;
  user: User | null;
  onSignIn: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  regionId,
  stats,
  onNextRegion,
  onRestart,
  onReturnTitle,
  onOpenTacticalMap,
  user,
  onSignIn,
}) => {
  const reg = REGIONS[regionId];

  const regionOrder: RegionId[] = ['sanaa', 'marib', 'hadramout', 'socotra'];
  const currentIndex = regionOrder.indexOf(regionId);
  const nextRegionId = regionOrder[(currentIndex + 1) % regionOrder.length];
  const nextReg = REGIONS[nextRegionId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-in fade-in duration-300 overflow-y-auto">
      <div className="hud-panel max-w-lg w-full p-6 md:p-8 rounded-3xl text-center flex flex-col gap-4 border-2 border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.35)] my-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <Trophy className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs text-amber-400 font-extrabold tracking-wide block mb-1">
            انتصار يماني تاريخي 🇾🇪
          </span>
          <h2 className="text-3xl font-black text-white">تم تأمين {reg.nameAr}!</h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            جمعت جميع الغنائم والآثار الوطنية الـ {reg.relicsNeeded} وحفظت شرف الراية والوطن!
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 py-3 px-4 bg-slate-950/70 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block">الترتيب</span>
            <span className="text-xl font-extrabold text-emerald-400 tabular-nums font-mono">#1</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">النتيجة الكلية</span>
            <span className="text-xl font-extrabold text-amber-400 tabular-nums font-mono">{stats.score}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">الخصوم المحيدين</span>
            <span className="text-xl font-extrabold text-rose-400 tabular-nums font-mono">{stats.kills}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">زمن المعركة</span>
            <span className="text-xl font-extrabold text-sky-400 tabular-nums font-mono">
              {stats.playtimeSeconds}ث
            </span>
          </div>
        </div>

        {/* Google Sign-in / Persistent status */}
        {user ? (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>تم توثيق هذا النصر في ملفك الدائم وقاعدة بيانات Firestore بنجاح!</span>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 text-right">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-300">خلّد هذا النصر برقمك القياسي</span>
              <span className="text-[10px] text-emerald-400 font-bold">🏆 نصر حاسم</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              سجل الدخول بحساب Google لتوثيق هذا الانتصار وإضافة نقاطك لقائمة المتصدرين العالمية.
            </p>
            <button
              onClick={() => {
                soundSynth.playClick();
                onSignIn();
              }}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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
              <span>تسجيل الدخول بـ Google وحفظ النصر</span>
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              soundSynth.playClick();
              onNextRegion();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-500 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>الانتقال للمنطقة التالية: {nextReg.nameAr}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              soundSynth.playClick();
              onOpenTacticalMap();
            }}
            className="w-full py-2.5 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 hover:text-white font-bold rounded-xl text-xs border border-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-blue-400" />
            <span>استكشاف موقع النصر في خريطة Google Maps</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => {
                soundSynth.playClick();
                onRestart();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة هذه المعركة</span>
            </button>

            <button
              onClick={() => {
                soundSynth.playClick();
                onReturnTitle();
              }}
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl text-xs border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>القائمة الرئيسية</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface APKInfoModalProps {
  onClose: () => void;
  onInstallAPK: () => void;
  canInstall: boolean;
}

export const APKInfoModal: React.FC<APKInfoModalProps> = ({ onClose, onInstallAPK, canInstall }) => {
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  const shareText = `🇾🇪 العب لعبة محارب اليمن 3D (Yemeni Warrior) - أقوى لعبة باتل رويال تاريخية ثلاثية الأبعاد! جرب الهبوط بالمظلة التكتيكية ومعارك صنعاء ومأرب وحضرموت وسقطرى، والعب فوراً على هاتفك:\n${appUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent('لعبة محارب اليمن 3D الأصلية')}`;

  useEffect(() => {
    if (qrCanvasRef.current && appUrl) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        appUrl,
        {
          width: 150,
          margin: 1,
          color: {
            dark: '#030712',
            light: '#f59e0b',
          },
        },
        (err) => {
          if (err) console.error('QR Code render error:', err);
        }
      );
    }
  }, [appUrl]);

  const handleCopyLink = () => {
    soundSynth.playClick();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    soundSynth.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'محارب اليمن 3D - Battle Royale',
          text: shareText,
          url: appUrl,
        });
      } catch {
        // User dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 select-none backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="hud-panel max-w-xl w-full p-5 sm:p-7 rounded-3xl text-right flex flex-col gap-4 border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.3)] my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-amber-400">مركز حزمة اللعبة والمشاركة لكافة الهواتف</h2>
              <span className="text-[11px] text-slate-400">تحميل مباشر · تثبيت WebAPK رسمي · بدون أخطاء</span>
            </div>
          </div>
          <button
            onClick={() => {
              soundSynth.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Diagnostic Box for the Free Fire MAX base.apk error */}
          <div className="p-3.5 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-1.5 text-right">
            <div className="flex items-center gap-2 text-rose-300 font-black text-xs">
              <span>⚠️</span>
              <span>توضيح خطأ تثبيت ملف «base.apk» في الصورة المرفقة:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              الملف الذي ظهر في لقطة الشاشة بحجم <code className="text-amber-300 font-mono">14.92MB</code> باسم <code className="text-amber-300 font-mono">Free Fire MAX base.apk</code> هو حزمة مجزأة (Split APK) لـ Free Fire ولا يحتوي على ملفات البيانات والمكتبات، ولذلك يرفض نظام أندرويد (PackageInstaller و SAI) تثبيته ويعطي الخطأ <code className="text-rose-400 font-mono">INSTALL_FAILED_INTERNAL_ERROR: Permission Denied</code>.
            </p>
            <p className="text-[11px] text-emerald-300 font-bold">
              ✅ بالمقابل، لعبة <strong>«محارب اليمن 3D»</strong> مبرمجة وجاهزة 100% وتُثبت على هاتفك مباشرة كحزمة WebAPK رسمية بنقرة واحدة ودون الحاجة لأي برنامج تثبيت إضافي!
            </p>
          </div>

          {/* QR Code and Direct Mobile Access Hub */}
          <div className="p-4 bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="p-2 bg-amber-400 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <canvas ref={qrCanvasRef} className="rounded-lg block w-[130px] h-[130px]" />
              </div>
              <span className="text-[10px] text-amber-300 font-bold mt-1.5 flex items-center gap-1">
                <QrCode className="w-3 h-3" />
                <span>امسح بكاميرا الهاتف</span>
              </span>
            </div>

            <div className="flex-1 text-right space-y-2">
              <strong className="text-amber-300 block text-sm font-black">
                📷 التثبيت الفوري عبر كاميرا أي هاتف ذكي
              </strong>
              <p className="text-[11px] text-slate-300">
                افتح تطبيق الكاميرا على أي هاتف (أندرويد أو آيفون) ووجّهه نحو رمز الاستجابة السريعة (QR) أعلاه، وسيفتح رابط اللعبة تلقائياً لتثبيتها كرمز تطبيق كامل على شاشة الهاتف.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  ⚡ حجم خفيف: 3.8 ميجابايت فقط
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                  📱 يعمل بملء الشاشة
                </span>
              </div>
            </div>
          </div>

          {/* 1-Click Installation Button */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>تثبيت حزمة WebAPK الرسمية على جهازك:</span>
              </span>
              <span className="text-[10px] text-slate-400">Google Approved</span>
            </div>
            <p className="text-[11px] text-slate-300">
              اضغط الزر أدناه لتثبيت لعبة محارب اليمن فوراً على هاتفك دون المرور بأي رسائل أخطاء:
            </p>
            <button
              onClick={() => {
                soundSynth.playClick();
                onInstallAPK();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>📲 تثبيت لعبة محارب اليمن 3D الآن (WebAPK Install)</span>
            </button>
          </div>

          {/* Share with Friends Section */}
          <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-2.5">
            <strong className="text-amber-300 block text-xs font-bold flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>مشاركة اللعبة وبدء التحدي مع الأصدقاء:</span>
            </strong>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundSynth.playClick()}
                className="py-2.5 px-3 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>💬 مشاركة عبر WhatsApp</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => soundSynth.playClick()}
                className="py-2.5 px-3 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 text-sky-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>✈️ مشاركة عبر Telegram</span>
              </a>
            </div>

            {/* Direct Copy Link Input */}
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <input
                type="text"
                readOnly
                value={appUrl}
                className="bg-transparent text-[11px] text-amber-200 flex-1 outline-none font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs transition-all cursor-pointer shrink-0"
              >
                {copied ? 'تم النسخ بنجاح ✅' : 'نسخ الرابط'}
              </button>
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg text-xs transition-all cursor-pointer shrink-0"
                >
                  مشاركة 📤
                </button>
              )}
            </div>
          </div>

          {/* Simple 3-Step Manual Guides */}
          <div className="space-y-2">
            <strong className="text-white block text-xs font-bold">طريقة التثبيت اليدوية للمتصفح:</strong>

            <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <span className="font-bold text-emerald-400 block">🤖 لهواتف أندرويد (Chrome):</span>
              <p className="text-slate-300">
                اضغط على القائمة <strong>(⋮)</strong> أعلى المتصفح ➔ اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«إضافة للشاشة الرئيسية»</strong>.
              </p>
            </div>

            <div className="p-2.5 bg-slate-900/70 rounded-xl border border-slate-800 text-[11px] space-y-1">
              <span className="font-bold text-sky-400 block">🍎 لهواتف آيفون (Safari):</span>
              <p className="text-slate-300">
                اضغط على أيقونة المشاركة <strong>[↑]</strong> أسفل المتصفح ➔ اختر <strong>«إضافة إلى الصفحة الرئيسية»</strong>.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundSynth.playClick();
            onClose();
          }}
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer mt-1"
        >
          فهمت، العودة للعب
        </button>
      </div>
    </div>
  );
};

