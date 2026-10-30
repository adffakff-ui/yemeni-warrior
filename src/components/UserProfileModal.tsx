import React, { useEffect } from 'react';
import { useFirebase } from '../lib/FirebaseProvider';
import { soundSynth } from '../audio/SoundSynth';
import { Trophy, Skull, Shield, Award, Calendar, Clock, LogIn, LogOut, X, User as UserIcon, RefreshCw } from 'lucide-react';

interface UserProfileModalProps {
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const {
    user,
    userProfile,
    authLoading,
    authError,
    clearAuthError,
    signIn,
    logOut,
    matchHistory,
    loadingHistory,
    fetchMatchHistory,
  } = useFirebase();

  useEffect(() => {
    if (user) {
      fetchMatchHistory();
    }
  }, [user, fetchMatchHistory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(245,158,11,0.25)] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wide">
                ملف المحارب وسجل المعارك التاريخية
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                حساب Google وقاعدة بيانات Firestore
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              soundSynth.playClick();
              clearAuthError();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Error Banner if present */}
        {authError && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-6 py-2.5 text-xs text-rose-300 flex items-center justify-between">
            <span>{authError}</span>
            <button
              onClick={clearAuthError}
              className="text-slate-400 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          {user ? (
            <>
              {/* User Profile Card */}
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-right">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Avatar'}
                      className="w-14 h-14 rounded-2xl border-2 border-amber-400 object-cover shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-xl font-black">
                      🇾🇪
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{user.displayName}</h3>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        حساب موثق عبر Google
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono block mt-0.5">
                      {user.email || 'حساب لاعب مسجل'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundSynth.playClick();
                    logOut();
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>

              {/* Lifetime Stats Matrix */}
              <div>
                <span className="text-xs font-bold text-amber-300 mb-3 block">
                  الأرقام القياسية الدائمة (Firestore Persistent Stats):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-amber-500/20 text-center">
                    <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 block">أعلى نتيجة (High Score)</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {(userProfile?.highScore || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-emerald-500/20 text-center">
                    <Award className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 block">الانتصارات الكلية</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {userProfile?.totalWins || 0}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-rose-500/20 text-center">
                    <Skull className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 block">مجموع الخصوم المحيدين</span>
                    <span className="text-lg font-black text-rose-400 font-mono">
                      {userProfile?.totalKills || 0}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900/60 rounded-2xl border border-sky-500/20 text-center">
                    <Shield className="w-5 h-5 text-sky-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 block">المعارك الملعوبة</span>
                    <span className="text-lg font-black text-sky-400 font-mono">
                      {userProfile?.totalMatches || matchHistory.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Historical Matches Log */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    سجل المعارك والمباريات السابقة (المحفوظة تلقائياً):
                  </span>
                  <button
                    onClick={() => {
                      soundSynth.playClick();
                      fetchMatchHistory();
                    }}
                    disabled={loadingHistory}
                    className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                    <span>تحديث السجل</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {matchHistory.length === 0 ? (
                    <div className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                      لم تخض أي معركة بعد بهذا الحساب. انطلق إلى ساحة القتال لتخليد بطولاتك!
                    </div>
                  ) : (
                    matchHistory.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                          m.isWin
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : 'bg-slate-900/70 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                              m.isWin
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {m.isWin ? '🏆' : '⚔️'}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {m.regionName || m.regionId}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded ${
                                  m.isWin
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {m.isWin ? 'نصر ساحق' : 'هزيمة تكتيكية'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {m.playtimeSeconds ? `${m.playtimeSeconds} ثانية` : 'معركة سريعة'}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-400">
                            {m.score.toLocaleString()} نقطة
                          </div>
                          <span className="text-[10px] text-rose-400 font-mono">
                            {m.kills} خصوم
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Logged Out / Sign In Prompt View */
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center text-3xl">
                🇾🇪
              </div>

              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-black text-white mb-2">
                  سجل دخولك لحفظ نتائجك وتاريخ معاركك للأبد
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  عند تسجيل الدخول بواسطة Google، سيتم حفظ نقاطك، إحصائيات القتال، وقائمة المتصدرين في
                  قاعدة بيانات Firestore السحابية بشكل دائم ومزامنتها عبر جميع أجهزتك.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    soundSynth.playClick();
                    signIn();
                  }}
                  disabled={authLoading}
                  className="mx-auto py-3.5 px-8 bg-white hover:bg-slate-100 text-slate-900 font-black rounded-2xl text-sm shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>{authLoading ? 'جاري الاتصال بـ Google...' : 'تسجيل الدخول باستخدام Google'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right max-w-lg mx-auto pt-4 border-t border-slate-800">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                  <strong className="text-amber-400 block mb-0.5">🔒 أمان ومزامنة</strong>
                  <span className="text-[11px] text-slate-400">حفظ فوري ومشفر في Firestore</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                  <strong className="text-emerald-400 block mb-0.5">🏆 صدارة الترتيب</strong>
                  <span className="text-[11px] text-slate-400">منافسة على المركز الأول عالمياً</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
                  <strong className="text-sky-400 block mb-0.5">📜 سجل المعارك</strong>
                  <span className="text-[11px] text-slate-400">توثيق انتصاراتك وتاريخك</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
