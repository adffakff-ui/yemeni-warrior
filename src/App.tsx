/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, RegionId, GameStats, CameraViewMode, RadarBlip, KillLogItem } from './types/game';
import { REGIONS } from './data/regions';
import { GameCanvas3D } from './components/GameCanvas3D';
import { GameHUD } from './components/GameHUD';
import { TitleScreen } from './components/TitleScreen';
import { PauseModal, GameOverModal, VictoryModal, APKInfoModal } from './components/Modals';
import { GoogleMapsTacticalView } from './components/GoogleMapsTacticalView';
import { UserProfileModal } from './components/UserProfileModal';
import { CinematicTrailerView } from './components/CinematicTrailerView';
import { soundSynth } from './audio/SoundSynth';
import { useFirebase } from './lib/FirebaseProvider';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_SCREEN');
  const [regionId, setRegionId] = useState<RegionId>('sanaa');
  const [viewMode, setViewMode] = useState<CameraViewMode>('FPS');
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [isCrouching, setIsCrouching] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showAPKModal, setShowAPKModal] = useState<boolean>(false);
  const [showTacticalMap, setShowTacticalMap] = useState<boolean>(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState<boolean>(false);
  const [showTrailer, setShowTrailer] = useState<boolean>(false);

  const { user, signIn, logOut, saveMatchResult } = useFirebase();

  // Live HUD stats updated from 60fps simulation
  const [hudStats, setHudStats] = useState({
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    score: 0,
    relicsCount: 0,
    kills: 0,
    ammoClip: 30,
    ammoReserve: 120,
    enemiesLeft: 7,
    playersAlive: 50,
    zoneRadius: 500,
  });

  // Radar mini-map blips
  const [radarBlips, setRadarBlips] = useState<RadarBlip[]>([]);

  // Tactical Killfeed log
  const [killLogs, setKillLogs] = useState<KillLogItem[]>([]);

  // Damage vignette flash
  const [damageFlash, setDamageFlash] = useState(false);
  const damageFlashTimeoutRef = useRef<number | null>(null);

  // In-game notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Weapon reload trigger
  const [triggerReload, setTriggerReload] = useState(false);

  // End state stats
  const [finalStats, setFinalStats] = useState<GameStats>({
    score: 0,
    kills: 0,
    relicsCollected: 0,
    totalDamageDealt: 0,
    wavesSurvived: 0,
    playtimeSeconds: 0,
    playersAlive: 50,
    zoneRadius: 500,
  });

  // Touch & Action button triggers to send to canvas
  const [joystickVector, setJoystickVector] = useState({ x: 0, y: 0 });
  const [isTouchFiring, setIsTouchFiring] = useState(false);
  const [triggerJump, setTriggerJump] = useState(false);
  const [triggerDash, setTriggerDash] = useState(false);
  const [triggerSlash, setTriggerSlash] = useState(false);
  const [triggerRoar, setTriggerRoar] = useState(false);
  const cameraRotateHandlerRef = useRef<((dx: number, dy: number) => void) | null>(null);

  // Toggle Mute
  const handleToggleMute = useCallback(() => {
    const muted = soundSynth.toggleMute();
    setIsMuted(muted);
  }, []);

  // Update Stats from Canvas
  const handleUpdateStats = useCallback(
    (
      health: number,
      maxHealth: number,
      energy: number,
      maxEnergy: number,
      score: number,
      relicsCount: number,
      kills: number,
      ammoClip: number,
      ammoReserve: number,
      enemiesLeft: number,
      playersAlive: number,
      zoneRadius: number
    ) => {
      setHudStats({
        health,
        maxHealth,
        energy,
        maxEnergy,
        score,
        relicsCount,
        kills,
        ammoClip,
        ammoReserve,
        enemiesLeft,
        playersAlive,
        zoneRadius,
      });
    },
    []
  );

  // Radar Update
  const handleUpdateRadar = useCallback((blips: RadarBlip[]) => {
    setRadarBlips(blips);
  }, []);

  // Killfeed Item Add
  const handleAddKillLog = useCallback((text: string) => {
    setKillLogs((prev) => [
      ...prev.slice(-4),
      { id: Date.now() + Math.random(), text, time: Date.now() },
    ]);
  }, []);

  // Player Damaged blood vignette trigger
  const handlePlayerDamaged = useCallback(() => {
    setDamageFlash(true);
    if (damageFlashTimeoutRef.current) {
      window.clearTimeout(damageFlashTimeoutRef.current);
    }
    damageFlashTimeoutRef.current = window.setTimeout(() => {
      setDamageFlash(false);
    }, 280);
  }, []);

  // Toast Notification trigger
  const handleShowToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Relic Found notification
  const handleRelicFound = useCallback(
    (nameAr: string, _nameEn: string, _icon: string, currentTotal: number) => {
      handleShowToast(`تم استعادة الغنيمة: ${nameAr} (${currentTotal})!`);
      handleAddKillLog(`غنيمة تاريخية: ${nameAr}`);
    },
    [handleShowToast, handleAddKillLog]
  );

  // Game Over / Victory
  const handleGameOver = useCallback(
    (won: boolean, stats: GameStats) => {
      setFinalStats(stats);
      setGameState(won ? 'VICTORY' : 'GAME_OVER');

      // Save to Firebase Firestore permanently
      const currentReg = REGIONS[regionId];
      saveMatchResult({
        regionId,
        regionName: currentReg.nameAr,
        score: stats.score,
        kills: stats.kills,
        isWin: won,
        rank: won ? 1 : stats.playersAlive,
        relicsCollected: stats.relicsCollected,
        playtimeSeconds: stats.playtimeSeconds,
      })
        .then((saved) => {
          if (saved) {
            handleShowToast('تم حفظ النتيجة وتحديث ترتيبك في Firestore بنجاح!');
          }
        })
        .catch((err) => console.error('Error saving match result:', err));
    },
    [regionId, saveMatchResult, handleShowToast]
  );

  // PWA Install prompt event capture
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleTriggerInstall = async () => {
    if (installPromptEvent) {
      try {
        installPromptEvent.prompt();
        const choice = await installPromptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          setInstallPromptEvent(null);
          handleShowToast('جارٍ تثبيت التطبيق على جهازك...');
        }
      } catch (e) {
        console.warn('Install prompt error:', e);
      }
    } else {
      handleShowToast('لتثبيت التطبيق، اضغط على (⋮) بالمتصفح ثم "إضافة إلى الشاشة الرئيسية"');
    }
  };

  // Keyboard shortcut for Pause (Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (gameState === 'PLAYING') {
          soundSynth.playClick();
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          soundSynth.playClick();
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [gameState]);

  // Actions
  const startGame = useCallback(() => {
    setHudStats({
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      score: 0,
      relicsCount: 0,
      kills: 0,
      ammoClip: 30,
      ammoReserve: 120,
      enemiesLeft: 7,
      playersAlive: 50,
      zoneRadius: 500,
    });
    setKillLogs([]);
    setGameState('PLAYING');
    handleShowToast('جاهز للقتال! انتشر في ساحة المعركة');
  }, [handleShowToast]);

  const restartGame = useCallback(() => {
    setHudStats({
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      score: 0,
      relicsCount: 0,
      kills: 0,
      ammoClip: 30,
      ammoReserve: 120,
      enemiesLeft: 7,
      playersAlive: 50,
      zoneRadius: 500,
    });
    setKillLogs([]);
    setGameState('PLAYING');
  }, []);

  const resumeGame = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const pauseGame = useCallback(() => {
    soundSynth.playClick();
    setGameState('PAUSED');
  }, []);

  const returnToTitle = useCallback(() => {
    setGameState('TITLE_SCREEN');
  }, []);

  const advanceNextRegion = useCallback(() => {
    const regionOrder: RegionId[] = ['sanaa', 'marib', 'hadramout', 'socotra'];
    const currentIndex = regionOrder.indexOf(regionId);
    const nextRegionId = regionOrder[(currentIndex + 1) % regionOrder.length];
    setRegionId(nextRegionId);
    restartGame();
  }, [regionId, restartGame]);

  const toggleViewMode = useCallback(() => {
    soundSynth.playClick();
    setViewMode((prev) => (prev === 'TPS' ? 'FPS' : 'TPS'));
    setIsAiming(false);
  }, []);

  const toggleAim = useCallback((aimState?: boolean) => {
    soundSynth.playClick();
    setIsAiming((prev) => (typeof aimState === 'boolean' ? aimState : !prev));
  }, []);

  const toggleCrouch = useCallback(() => {
    soundSynth.playClick();
    setIsCrouching((prev) => {
      const next = !prev;
      handleShowToast(next ? 'وضع القرفصاء التكتيكي' : 'وضع الوقوف');
      return next;
    });
  }, [handleShowToast]);

  const resetTriggers = useCallback(() => {
    setTriggerJump(false);
    setTriggerDash(false);
    setTriggerSlash(false);
    setTriggerRoar(false);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030712] select-none">
      {/* 60fps 3D Tactical Combat Canvas (Three.js WebGL) */}
      <GameCanvas3D
        key={regionId}
        regionId={regionId}
        isRunning={gameState === 'PLAYING'}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        isAiming={isAiming}
        onToggleAim={(aim) => setIsAiming(aim)}
        isCrouching={isCrouching}
        onToggleCrouch={toggleCrouch}
        onUpdateStats={handleUpdateStats}
        onUpdateRadar={handleUpdateRadar}
        onPlayerDamaged={handlePlayerDamaged}
        onShowToast={handleShowToast}
        onAddKillLog={handleAddKillLog}
        onRelicFound={handleRelicFound}
        onGameOver={handleGameOver}
        triggerReload={triggerReload}
        onResetReload={() => setTriggerReload(false)}
        joystickVector={joystickVector}
        isTouchFiring={isTouchFiring}
        triggerJump={triggerJump}
        triggerDash={triggerDash}
        triggerSlash={triggerSlash}
        triggerRoar={triggerRoar}
        onResetTriggers={resetTriggers}
        onRegisterCameraRotate={(fn) => {
          cameraRotateHandlerRef.current = fn;
        }}
      />

      {/* Title Screen Overlay */}
      {gameState === 'TITLE_SCREEN' && (
        <TitleScreen
          selectedRegion={regionId}
          onSelectRegion={setRegionId}
          onStartGame={startGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenTrailer={() => setShowTrailer(true)}
          onOpenAPKModal={() => setShowAPKModal(true)}
          onOpenTacticalMap={() => setShowTacticalMap(true)}
          onOpenUserProfileModal={() => setShowUserProfileModal(true)}
          user={user}
          onSignIn={signIn}
          onSignOut={logOut}
        />
      )}

      {/* Playing Active HUD Overlay */}
      {gameState === 'PLAYING' && (
        <GameHUD
          regionId={regionId}
          onChangeRegion={(newReg) => {
            setRegionId(newReg);
            restartGame();
          }}
          viewMode={viewMode}
          onToggleViewMode={toggleViewMode}
          isAiming={isAiming}
          onToggleAim={() => toggleAim()}
          isCrouching={isCrouching}
          onToggleCrouch={toggleCrouch}
          health={hudStats.health}
          maxHealth={hudStats.maxHealth}
          energy={hudStats.energy}
          maxEnergy={hudStats.maxEnergy}
          score={hudStats.score}
          kills={hudStats.kills}
          relicsCount={hudStats.relicsCount}
          enemiesLeft={hudStats.enemiesLeft}
          playersAlive={hudStats.playersAlive}
          zoneRadius={hudStats.zoneRadius}
          ammoClip={hudStats.ammoClip}
          ammoReserve={hudStats.ammoReserve}
          onTriggerReload={() => setTriggerReload(true)}
          radarBlips={radarBlips}
          killLogs={killLogs}
          damageFlash={damageFlash}
          toastMessage={toastMessage}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onPause={pauseGame}
          onJoystickMove={setJoystickVector}
          onCameraRotate={(dx, dy) => cameraRotateHandlerRef.current?.(dx, dy)}
          onTouchFireStart={() => setIsTouchFiring(true)}
          onTouchFireEnd={() => setIsTouchFiring(false)}
          onTriggerJump={() => setTriggerJump(true)}
          onTriggerDash={() => setTriggerDash(true)}
          onTriggerSlash={() => setTriggerSlash(true)}
          onTriggerRoar={() => setTriggerRoar(true)}
        />
      )}

      {/* Paused Overlay */}
      {gameState === 'PAUSED' && (
        <PauseModal
          regionId={regionId}
          onResume={resumeGame}
          onRestart={restartGame}
          onReturnTitle={returnToTitle}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onOpenTacticalMap={() => setShowTacticalMap(true)}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAME_OVER' && (
        <GameOverModal
          regionId={regionId}
          stats={finalStats}
          onRestart={restartGame}
          onReturnTitle={returnToTitle}
          user={user}
          onSignIn={signIn}
        />
      )}

      {/* Victory Modal */}
      {gameState === 'VICTORY' && (
        <VictoryModal
          regionId={regionId}
          stats={finalStats}
          onNextRegion={advanceNextRegion}
          onRestart={restartGame}
          onReturnTitle={returnToTitle}
          onOpenTacticalMap={() => setShowTacticalMap(true)}
          user={user}
          onSignIn={signIn}
        />
      )}

      {/* Google Maps Tactical Operations Viewport */}
      {showTacticalMap && (
        <GoogleMapsTacticalView
          currentRegionId={regionId}
          onSelectRegion={(newR) => setRegionId(newR)}
          onClose={() => setShowTacticalMap(false)}
          onDeployNow={(newR) => {
            setRegionId(newR);
            setShowTacticalMap(false);
            if (gameState !== 'PLAYING') {
              startGame();
            }
          }}
        />
      )}

      {/* User Profile & Historical Match Record Modal */}
      {showUserProfileModal && (
        <UserProfileModal onClose={() => setShowUserProfileModal(false)} />
      )}

      {/* APK & Game Size Info Modal */}
      {showAPKModal && (
        <APKInfoModal
          onClose={() => setShowAPKModal(false)}
          onInstallAPK={handleTriggerInstall}
          canInstall={!!installPromptEvent}
        />
      )}

      {/* 3D Cinematic Web Video Trailer */}
      {showTrailer && (
        <CinematicTrailerView
          onClose={() => setShowTrailer(false)}
          onStartBattle={(chosenRegion) => {
            setRegionId(chosenRegion);
            setShowTrailer(false);
            if (gameState !== 'PLAYING') {
              startGame();
            }
          }}
        />
      )}
    </div>
  );
}
