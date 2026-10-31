import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { REGIONS } from '../data/regions';
import { RegionId } from '../types/game';
import { soundSynth } from '../audio/SoundSynth';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Crosshair,
  Compass,
  Film,
  Camera,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';

interface CinematicTrailerViewProps {
  onClose: () => void;
  onStartBattle: (regionId: RegionId) => void;
}

interface TrailerScene {
  id: string;
  titleAr: string;
  regionId: RegionId;
  duration: number; // in seconds
  subtitle: string;
  cameraStart: THREE.Vector3;
  cameraEnd: THREE.Vector3;
  lookAtStart: THREE.Vector3;
  lookAtEnd: THREE.Vector3;
  action: 'parachute' | 'combat' | 'sniper' | 'tour' | 'hero';
}

const TRAILER_SCENES: TrailerScene[] = [
  {
    id: 'sanaa_drop',
    titleAr: 'الهبوط بالمظلة التكتيكية · سماء صنعاء',
    regionId: 'sanaa',
    duration: 8,
    subtitle: 'انتشار جوي تكتيكي من سماء أمانة العاصمة وحصون آزال العتيدة',
    cameraStart: new THREE.Vector3(0, 75, 45),
    cameraEnd: new THREE.Vector3(0, 18, 22),
    lookAtStart: new THREE.Vector3(0, 40, 0),
    lookAtEnd: new THREE.Vector3(0, 3, 0),
    action: 'parachute',
  },
  {
    id: 'sanaa_combat',
    titleAr: 'اشتباك في أزقة باب اليمن القديم',
    regionId: 'sanaa',
    duration: 7,
    subtitle: 'تبادل إطلاق نار سريع ومراوغة بين العمارة الطينية والقمريات الملونة',
    cameraStart: new THREE.Vector3(-14, 5, 12),
    cameraEnd: new THREE.Vector3(12, 4, -8),
    lookAtStart: new THREE.Vector3(0, 2, 0),
    lookAtEnd: new THREE.Vector3(0, 2, 0),
    action: 'combat',
  },
  {
    id: 'marib_desert',
    titleAr: 'أعمدة بلقيس وسد مأرب التاريخي',
    regionId: 'marib',
    duration: 7,
    subtitle: 'معركة حاسمة في مهد الحضارة السبئية وأعمدة معبد برّان الذهبية',
    cameraStart: new THREE.Vector3(25, 12, 35),
    cameraEnd: new THREE.Vector3(-15, 6, 20),
    lookAtStart: new THREE.Vector3(0, 3, 0),
    lookAtEnd: new THREE.Vector3(0, 2, 0),
    action: 'tour',
  },
  {
    id: 'hadramout_sniper',
    titleAr: 'قناصة ناطحات السحاب الطينية · شبام',
    regionId: 'hadramout',
    duration: 7,
    subtitle: 'تصويب بعيد المدى من شرفات أقدم ناطحات سحاب طينية في العالم',
    cameraStart: new THREE.Vector3(0, 32, -30),
    cameraEnd: new THREE.Vector3(0, 10, 15),
    lookAtStart: new THREE.Vector3(0, 8, 0),
    lookAtEnd: new THREE.Vector3(0, 2, 0),
    action: 'sniper',
  },
  {
    id: 'socotra_final',
    titleAr: 'المواجهة الكبرى · أشجار دم الأخوين',
    regionId: 'socotra',
    duration: 8,
    subtitle: 'صيحة النصر اليمانية واستلال الجنبية الصيفانية لحسم لقب بطل الباتل رويال',
    cameraStart: new THREE.Vector3(-18, 6, 20),
    cameraEnd: new THREE.Vector3(0, 3.5, 9),
    lookAtStart: new THREE.Vector3(0, 2.5, 0),
    lookAtEnd: new THREE.Vector3(0, 2.2, 0),
    action: 'hero',
  },
];

export const CinematicTrailerView: React.FC<CinematicTrailerViewProps> = ({
  onClose,
  onStartBattle,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<'cinematic' | 'drone' | 'action'>('cinematic');

  const activeScene = TRAILER_SCENES[currentSceneIndex];
  const isPlayingRef = useRef(true);
  const currentSceneIndexRef = useRef(0);
  const sceneProgressRef = useRef(0);
  const cameraModeRef = useRef<'cinematic' | 'drone' | 'action'>('cinematic');

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentSceneIndexRef.current = currentSceneIndex;
    sceneProgressRef.current = 0;
  }, [currentSceneIndex]);

  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  // Main 3D Trailer Scene Engine
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      renderer = new THREE.WebGLRenderer({ antialias: false });
    }
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a1120');
    scene.fog = new THREE.FogExp2('#0a1120', 0.015);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      500
    );

    // Studio Environment
    let pmremGen: THREE.PMREMGenerator | null = null;
    try {
      pmremGen = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGen.fromScene(new RoomEnvironment()).texture;
    } catch (e) {
      console.warn('Trailer RoomEnvironment fallback:', e);
    }

    // Lighting
    const ambient = new THREE.AmbientLight(0xfff5ea, 0.75);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfef08a, 1.8);
    sun.position.set(40, 70, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 1024;
    sun.shadow.mapSize.height = 1024;
    scene.add(sun);

    // Ground Plane with Yemeni Desert Texture
    const groundGeo = new THREE.PlaneGeometry(300, 300, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a14,
      roughness: 0.88,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Build Yemeni Architectural Props (Towers, Arches, Dragon Blood Trees, Columns)
    const landmarksGroup = new THREE.Group();
    scene.add(landmarksGroup);

    // Mud Towers (Shibam / Sanaa gingerbread facades)
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x966d48, roughness: 0.85 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const dist = 35 + (i % 3) * 15;
      const tower = new THREE.Group();
      const height = 18 + (i % 5) * 6;

      const body = new THREE.Mesh(new THREE.BoxGeometry(7, height, 7), towerMat);
      body.position.y = height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      tower.add(body);

      // White Qamariya friezes
      const frieze = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.8, 7.2), trimMat);
      frieze.position.y = height - 1.5;
      tower.add(frieze);

      tower.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      landmarksGroup.add(tower);
    }

    // Ancient Columns of Sheba / Bilqis
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xc89d6c, roughness: 0.7 });
    for (let c = -3; c <= 3; c++) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 14, 12), columnMat);
      col.position.set(c * 3.5, 7, -15);
      col.castShadow = true;
      landmarksGroup.add(col);
    }

    // Socotra Dragon Blood Trees (Mushroom Umbrella Silhouette)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.9 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    for (let t = 0; t < 8; t++) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 8, 8), trunkMat);
      trunk.position.y = 4;
      trunk.castShadow = true;
      tree.add(trunk);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(5, 2.2, 12), canopyMat);
      canopy.position.y = 8.5;
      canopy.rotation.x = Math.PI;
      canopy.castShadow = true;
      tree.add(canopy);

      tree.position.set(-25 + t * 7, 0, 15 + (t % 2) * 8);
      landmarksGroup.add(tree);
    }

    // Hero Character Model (Composite Group with Parachute & Weapon)
    const hero = new THREE.Group();
    scene.add(hero);

    // Soldier Body
    const armorMat = new THREE.MeshStandardMaterial({ color: 0x243224, roughness: 0.65 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xb58150, roughness: 0.7 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.2 });

    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), armorMat);
    torso.position.y = 2.2;
    torso.castShadow = true;
    hero.add(torso);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), skinMat);
    head.position.y = 3.35;
    head.castShadow = true;
    hero.add(head);

    // Yemeni Keffiyeh / Shemagh Wrap
    const shemagh = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.12, 8, 16), trimMat);
    shemagh.rotation.x = Math.PI / 2;
    shemagh.position.y = 3.5;
    hero.add(shemagh);

    // Curved Janbiya Dagger on Belt
    const janbiya = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.08, 6, 8, Math.PI / 1.5), goldMat);
    janbiya.position.set(0, 1.45, 0.45);
    janbiya.rotation.z = Math.PI / 4;
    hero.add(janbiya);

    // Tactical Assault Rifle
    const rifleMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.3 });
    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 1.8), rifleMat);
    rifle.position.set(0.65, 2.1, 0.6);
    hero.add(rifle);

    // Military Tactical Parachute Canopy
    const parachuteGroup = new THREE.Group();
    const chuteMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.5,
      side: THREE.DoubleSide,
    });
    const chuteMesh = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2.2),
      chuteMat
    );
    chuteMesh.position.y = 8;
    parachuteGroup.add(chuteMesh);

    // Parachute suspension cords
    const cordMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    for (let c = 0; c < 8; c++) {
      const ang = (c / 8) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(Math.cos(ang) * 4.2, 7.5, Math.sin(ang) * 4.2),
        new THREE.Vector3(0, 2.8, 0),
      ];
      const cordGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const cordLine = new THREE.Line(cordGeo, cordMat);
      parachuteGroup.add(cordLine);
    }
    hero.add(parachuteGroup);

    // Enemy Squad Actors
    const enemies: THREE.Group[] = [];
    const enemyMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.7 });
    for (let e = 0; e < 3; e++) {
      const en = new THREE.Group();
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 0.8), enemyMat);
      b.position.y = 2.2;
      b.castShadow = true;
      en.add(b);
      const h = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), skinMat);
      h.position.y = 3.35;
      en.add(h);
      en.position.set(10 + e * 4, 0, -8 - e * 3);
      scene.add(en);
      enemies.push(en);
    }

    // Muzzle Flash Spark Light
    const muzzleLight = new THREE.PointLight(0xf59e0b, 0, 15);
    muzzleLight.position.set(0.65, 2.1, 1.8);
    hero.add(muzzleLight);

    // Animation & Camera Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isPlayingRef.current) {
        sceneProgressRef.current += dt;
        const currentScene = TRAILER_SCENES[currentSceneIndexRef.current];

        // Scene Transition Logic
        if (sceneProgressRef.current >= currentScene.duration) {
          sceneProgressRef.current = 0;
          const nextIndex = (currentSceneIndexRef.current + 1) % TRAILER_SCENES.length;
          currentSceneIndexRef.current = nextIndex;
          setCurrentSceneIndex(nextIndex);
        }

        const t = Math.min(sceneProgressRef.current / currentScene.duration, 1.0);
        const smoothT = THREE.MathUtils.smoothstep(t, 0, 1);
        setProgressPercent(Math.round(t * 100));

        // Camera Motion Interpolation
        if (cameraModeRef.current === 'cinematic') {
          camera.position.lerpVectors(currentScene.cameraStart, currentScene.cameraEnd, smoothT);
          const currentLookAt = new THREE.Vector3().lerpVectors(
            currentScene.lookAtStart,
            currentScene.lookAtEnd,
            smoothT
          );
          camera.lookAt(currentLookAt);
        } else if (cameraModeRef.current === 'drone') {
          // Dynamic Orbital Drone Angle
          const droneAngle = time * 0.0006;
          camera.position.set(Math.cos(droneAngle) * 35, 18, Math.sin(droneAngle) * 35);
          camera.lookAt(hero.position.x, 2.5, hero.position.z);
        } else {
          // Action Cam behind hero shoulder
          const shoulderOffset = new THREE.Vector3(1.2, 2.8, 4.5);
          camera.position.copy(hero.position).add(shoulderOffset);
          camera.lookAt(hero.position.x + 2, 2.2, hero.position.z - 15);
        }

        // Action-Specific Character Choreography
        if (currentScene.action === 'parachute') {
          parachuteGroup.visible = true;
          // Hero descends smoothly from altitude
          const altitude = THREE.MathUtils.lerp(55, 0, smoothT);
          hero.position.set(Math.sin(time * 0.001) * 3, altitude, Math.cos(time * 0.001) * 3);
          parachuteGroup.rotation.z = Math.sin(time * 0.003) * 0.12;
          torso.rotation.x = 0.2;
        } else if (currentScene.action === 'combat') {
          parachuteGroup.visible = false;
          hero.position.set(0, 0, 0);
          torso.rotation.x = 0;

          // Muzzle flash pulses & gun recoil
          const isShooting = Math.sin(time * 0.02) > 0.4;
          muzzleLight.intensity = isShooting ? 5.0 : 0;
          rifle.position.z = isShooting ? 0.45 : 0.6;

          // Enemy reactions
          enemies.forEach((en, idx) => {
            en.position.x = 10 + idx * 4 + Math.sin(time * 0.003 + idx) * 2;
            en.rotation.y = -Math.PI / 2 + Math.sin(time * 0.002) * 0.3;
          });
        } else if (currentScene.action === 'sniper') {
          parachuteGroup.visible = false;
          hero.position.set(0, 0, 0);
          rifle.rotation.x = -0.15;
          muzzleLight.intensity = Math.sin(time * 0.008) > 0.8 ? 6.0 : 0;
        } else if (currentScene.action === 'hero') {
          parachuteGroup.visible = false;
          hero.position.set(0, 0, 0);
          // Hero unsheathes Janbiya dagger triumphantly
          janbiya.position.set(0.4, 2.8 + Math.sin(time * 0.002) * 0.2, 0.5);
          janbiya.rotation.z = Math.PI / 3;
          muzzleLight.intensity = 0;
        } else {
          parachuteGroup.visible = false;
          hero.position.set(0, 0, 0);
          muzzleLight.intensity = 0;
        }

        // Subtly rotate environment landmarks for kinetic energy
        landmarksGroup.rotation.y = time * 0.0001;
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      pmremGen?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleNextScene = () => {
    soundSynth.playClick();
    setCurrentSceneIndex((prev) => (prev + 1) % TRAILER_SCENES.length);
  };

  const handlePrevScene = () => {
    soundSynth.playClick();
    setCurrentSceneIndex((prev) => (prev - 1 + TRAILER_SCENES.length) % TRAILER_SCENES.length);
  };

  const handleTogglePlay = () => {
    soundSynth.playClick();
    setIsPlaying((prev) => !prev);
  };

  const handleToggleMute = () => {
    const muted = soundSynth.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[860px] bg-slate-950 border-2 border-amber-500/40 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_60px_rgba(245,158,11,0.35)]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 font-extrabold uppercase tracking-wide">
                  فيديو الويب السينمائي الرسمي (3D Web Trailer)
                </span>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full border border-rose-500/30">
                  مباشر 60 FPS
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white">
                محارب اليمن 3D · ملحمة الباتل رويال الكبرى
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Camera Perspective Selector */}
            <div className="hidden sm:flex items-center bg-slate-800/80 rounded-xl p-1 border border-slate-700 text-xs font-bold text-slate-300">
              <button
                onClick={() => setCameraMode('cinematic')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  cameraMode === 'cinematic' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'hover:text-white'
                }`}
              >
                سينمائي
              </button>
              <button
                onClick={() => setCameraMode('drone')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  cameraMode === 'drone' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'hover:text-white'
                }`}
              >
                طائرة درونز
              </button>
              <button
                onClick={() => setCameraMode('action')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  cameraMode === 'action' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'hover:text-white'
                }`}
              >
                أكشن
              </button>
            </div>

            <button
              onClick={handleToggleMute}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => {
                soundSynth.playClick();
                onClose();
              }}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3D Viewport */}
        <div ref={mountRef} className="relative flex-1 w-full h-full min-h-[350px] overflow-hidden">
          {/* Cinematic Letterbox Bars */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/90 to-transparent pointer-events-none z-10" />

          {/* Dynamic Scene Subtitle Card */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 max-w-xl w-[90%] text-center z-10 pointer-events-none animate-in fade-in">
            <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block drop-shadow-md">
              مشهد {currentSceneIndex + 1} من {TRAILER_SCENES.length}: {activeScene.titleAr}
            </span>
            <p className="text-xs sm:text-sm text-white font-black drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] mt-0.5">
              {activeScene.subtitle}
            </p>
          </div>

          {/* Quick Jump Buttons Across the 5 Cinematic Scenes */}
          <div className="absolute top-16 right-4 flex flex-col gap-1.5 z-20 pointer-events-auto">
            {TRAILER_SCENES.map((sc, idx) => (
              <button
                key={sc.id}
                onClick={() => {
                  soundSynth.playClick();
                  setCurrentSceneIndex(idx);
                }}
                className={`text-right px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  currentSceneIndex === idx
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] scale-102'
                    : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600 backdrop-blur-sm'
                }`}
              >
                <span>{sc.titleAr.split('·')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Playback & Deploy Dock */}
        <div className="p-4 sm:p-5 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
          {/* Playback Controls & Progress Bar */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handlePrevScene}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title="المشهد السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition-all cursor-pointer shadow-md"
              title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              onClick={handleNextScene}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
              title="المشهد التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Visual Timeline Progress Bar */}
            <div className="flex-1 sm:w-60 md:w-80">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>{activeScene.titleAr}</span>
                <span>{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Launch Battle CTA Button directly into the current scene's region */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                soundSynth.playClick();
                onStartBattle(activeScene.regionId);
              }}
              className="w-full sm:w-auto py-3.5 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black rounded-2xl text-sm shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crosshair className="w-4 h-4" />
              <span>العب هذه المعركة الآن في {REGIONS[activeScene.regionId].nameAr}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
