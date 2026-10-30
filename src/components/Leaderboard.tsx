import React, { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Trophy, Medal, Users } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  userName: string;
  score: number;
  kills: number;
  timestamp: any;
}

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('score', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeaderboardEntry[];
      setEntries(data);
      setLoading(false);
    }, (error) => {
      console.error("Leaderboard error:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) return <div className="text-center py-4 text-slate-400">جاري تحميل قائمة المتصدرين...</div>;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-hidden">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
        <Trophy className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold text-white">قائمة المتصدرين (الأعلى نقاطاً)</h3>
      </div>
      
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">لا توجد سجلات بعد. كن أول من يتصدر!</div>
        ) : (
          entries.map((entry, index) => (
            <div 
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                index === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/40 border-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                  index === 0 ? 'bg-amber-500 text-slate-950' : 
                  index === 1 ? 'bg-slate-300 text-slate-900' :
                  index === 2 ? 'bg-orange-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}>
                  {index + 1}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{entry.userName}</span>
                  <span className="text-[10px] text-slate-500">{entry.kills} قتيل</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-amber-400 font-mono">{entry.score.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 block">نقطة</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
