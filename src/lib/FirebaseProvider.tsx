import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrors';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  totalWins: number;
  totalKills: number;
  totalMatches: number;
  highScore: number;
  lastPlayed?: any;
}

export interface HistoricalMatch {
  id: string;
  userId: string;
  regionId: string;
  regionName: string;
  score: number;
  kills: number;
  isWin: boolean;
  rank: number;
  relicsCollected: number;
  playtimeSeconds: number;
  timestamp?: any;
}

export interface MatchResultPayload {
  regionId: string;
  regionName: string;
  score: number;
  kills: number;
  isWin: boolean;
  rank: number;
  relicsCollected: number;
  playtimeSeconds: number;
}

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signIn: () => Promise<void>;
  logOut: () => Promise<void>;
  saveMatchResult: (result: MatchResultPayload) => Promise<boolean>;
  matchHistory: HistoricalMatch[];
  loadingHistory: boolean;
  fetchMatchHistory: () => Promise<void>;
  pendingMatch: MatchResultPayload | null;
  setPendingMatch: (match: MatchResultPayload | null) => void;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<HistoricalMatch[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [pendingMatch, setPendingMatch] = useState<MatchResultPayload | null>(null);
  const pendingMatchRef = useRef<MatchResultPayload | null>(null);

  useEffect(() => {
    pendingMatchRef.current = pendingMatch;
  }, [pendingMatch]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Fetch or sync user profile
  const syncUserProfile = useCallback(async (u: User) => {
    const userDocPath = `users/${u.uid}`;
    try {
      const userRef = doc(db, 'users', u.uid);
      const snap = await getDoc(userRef);

      const name = u.displayName || u.email?.split('@')[0] || 'محارب يمني';
      const photo = u.photoURL || '';
      const email = u.email || '';

      if (!snap.exists()) {
        const initialProfile: UserProfile = {
          uid: u.uid,
          displayName: name,
          photoURL: photo,
          email,
          totalWins: 0,
          totalKills: 0,
          totalMatches: 0,
          highScore: 0,
        };

        await setDoc(userRef, {
          ...initialProfile,
          lastPlayed: serverTimestamp(),
        });
        setUserProfile(initialProfile);
      } else {
        const data = snap.data() as UserProfile;
        // Keep name and avatar updated from Google if missing
        if (!data.displayName || !data.photoURL) {
          await setDoc(
            userRef,
            {
              displayName: data.displayName || name,
              photoURL: data.photoURL || photo,
              email: data.email || email,
            },
            { merge: true }
          );
        }
        setUserProfile({
          ...data,
          displayName: data.displayName || name,
          photoURL: data.photoURL || photo,
          email: data.email || email,
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, userDocPath);
    }
  }, []);

  // Fetch user match history
  const fetchMatchHistory = useCallback(async () => {
    if (!auth.currentUser) {
      setMatchHistory([]);
      return;
    }
    const path = `users/${auth.currentUser.uid}/matches`;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'matches'),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const matches: HistoricalMatch[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<HistoricalMatch, 'id'>),
      }));
      setMatchHistory(matches);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Save match result to Firestore
  const saveMatchResult = useCallback(
    async (result: MatchResultPayload): Promise<boolean> => {
      if (!auth.currentUser) {
        // Cache as pending so if user logs in right away, we save it!
        setPendingMatch(result);
        return false;
      }

      const uid = auth.currentUser.uid;
      const userName = auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'محارب يمني';
      const userRef = doc(db, 'users', uid);
      const matchDocId = `match_${Date.now()}`;
      const matchRef = doc(db, 'users', uid, 'matches', matchDocId);
      const leaderboardRef = doc(db, 'leaderboard', `lb_${uid}_${Date.now()}`);

      try {
        // 1. Fetch current user profile to accurately increment stats
        const snap = await getDoc(userRef);
        const existing = snap.exists() ? (snap.data() as UserProfile) : null;

        const currentHighScore = existing?.highScore || 0;
        const newHighScore = Math.max(currentHighScore, result.score);
        const newTotalWins = (existing?.totalWins || 0) + (result.isWin ? 1 : 0);
        const newTotalKills = (existing?.totalKills || 0) + result.kills;
        const newTotalMatches = (existing?.totalMatches || 0) + 1;

        // 2. Update user profile document
        await setDoc(
          userRef,
          {
            uid,
            displayName: userName,
            photoURL: auth.currentUser.photoURL || existing?.photoURL || '',
            email: auth.currentUser.email || existing?.email || '',
            totalWins: newTotalWins,
            totalKills: newTotalKills,
            totalMatches: newTotalMatches,
            highScore: newHighScore,
            lastPlayed: serverTimestamp(),
          },
          { merge: true }
        );

        // Update local state
        setUserProfile((prev) => ({
          uid,
          displayName: userName,
          photoURL: auth.currentUser?.photoURL || prev?.photoURL || '',
          email: auth.currentUser?.email || prev?.email || '',
          totalWins: newTotalWins,
          totalKills: newTotalKills,
          totalMatches: newTotalMatches,
          highScore: newHighScore,
        }));

        // 3. Save match history record
        await setDoc(matchRef, {
          userId: uid,
          regionId: result.regionId,
          regionName: result.regionName,
          score: result.score,
          kills: result.kills,
          isWin: result.isWin,
          rank: result.rank,
          relicsCollected: result.relicsCollected,
          playtimeSeconds: result.playtimeSeconds,
          timestamp: serverTimestamp(),
        });

        // 4. Record to public leaderboard if score is positive
        if (result.score > 0) {
          await setDoc(leaderboardRef, {
            userId: uid,
            userName,
            score: result.score,
            kills: result.kills,
            regionId: result.regionId,
            timestamp: serverTimestamp(),
          });
        }

        // Refresh history
        fetchMatchHistory();
        setPendingMatch(null);
        return true;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/matches/${matchDocId}`);
        return false;
      }
    },
    [fetchMatchHistory]
  );

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        await syncUserProfile(u);
        await fetchMatchHistory();

        // If there was a pending match from playing before logging in, save it!
        if (pendingMatchRef.current) {
          const matchToSave = pendingMatchRef.current;
          pendingMatchRef.current = null;
          setPendingMatch(null);
          saveMatchResult(matchToSave);
        }
      } else {
        setUserProfile(null);
        setMatchHistory([]);
      }
    });

    return unsubscribe;
  }, [syncUserProfile, fetchMatchHistory, saveMatchResult]);

  // Google Sign-In with popup
  const signIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google Sign-in error:', error);
      let errorMsg = 'تعذر تسجيل الدخول بواسطة Google. يرجى المحاولة مجدداً.';
      if (error?.code === 'auth/popup-closed-by-user') {
        errorMsg = 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.';
      } else if (error?.code === 'auth/cancelled-popup-request') {
        errorMsg = 'تم إلغاء طلب تسجيل الدخول.';
      } else if (error?.code === 'auth/popup-blocked') {
        errorMsg = 'تم حظر النافذة المنبثقة من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة.';
      } else if (error?.message) {
        errorMsg = `خطأ في تسجيل الدخول: ${error.message}`;
      }
      setAuthError(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setMatchHistory([]);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authLoading,
        authError,
        clearAuthError,
        signIn,
        logOut,
        saveMatchResult,
        matchHistory,
        loadingHistory,
        fetchMatchHistory,
        pendingMatch,
        setPendingMatch,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
};
