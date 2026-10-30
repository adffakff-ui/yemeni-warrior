import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { soundSynth } from '../audio/SoundSynth';
import { REGIONS } from '../data/regions';
import { CameraViewMode, GameStats, RadarBlip, RegionId } from '../types/game';

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(15);
      else if (type === 'medium') navigator.vibrate(35);
      else if (type === 'heavy') navigator.vibrate([40, 30, 40]);
    } catch {
      // Ignore vibration error on unsupported platforms
    }
  }
}

interface GameCanvas3DProps {
  regionId: RegionId;
  isRunning: boolean;
  viewMode: CameraViewMode;
  onToggleViewMode: () => void;
  isAiming: boolean;
  onToggleAim: (aiming: boolean) => void;
  isCrouching: boolean;
  onToggleCrouch: () => void;
  onUpdateStats: (
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
  ) => void;
  onUpdateRadar: (blips: RadarBlip[]) => void;
  onPlayerDamaged: () => void;
  onShowToast: (text: string) => void;
  onAddKillLog: (text: string) => void;
  onRelicFound: (relicNameAr: string, relicNameEn: string, icon: string, currentTotal: number) => void;
  onGameOver: (won: boolean, stats: GameStats) => void;
  triggerReload: boolean;
  onResetReload: () => void;
  // External inputs from touch controls or custom triggers
  joystickVector: { x: number; y: number };
  isTouchFiring: boolean;
  triggerJump: boolean;
  triggerDash: boolean;
  triggerSlash: boolean;
  triggerRoar: boolean;
  onResetTriggers: () => void;
  onRegisterCameraRotate?: (fn: (dx: number, dy: number) => void) => void;
}

export const GameCanvas3D: React.FC<GameCanvas3DProps> = ({
  regionId,
  isRunning,
  viewMode,
  onToggleViewMode,
  isAiming,
  onToggleAim,
  isCrouching,
  onToggleCrouch,
  onUpdateStats,
  onUpdateRadar,
  onPlayerDamaged,
  onShowToast,
  onAddKillLog,
  onRelicFound,
  onGameOver,
  triggerReload,
  onResetReload,
  joystickVector,
  isTouchFiring,
  triggerJump,
  triggerDash,
  triggerSlash,
  triggerRoar,
  onResetTriggers,
  onRegisterCameraRotate,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Mutable state ref decoupled from 60fps render loop
  const stateRef = useRef({
    regionId,
    isRunning,
    viewMode,
    isAiming,
    isCrouching,
    player: {
      x: 0,
      y: 0,
      z: 0,
      isJumping: false,
      verticalVelocity: 0,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      rotationY: 0,
      pitchX: 0,
      speed: 6.0,
      dashCooldown: 0,
      dashDuration: 0,
      isDashing: false,
      slashCooldown: 0,
      invincibleTimer: 0,
    },
    ammoClip: 30,
    ammoReserve: 120,
    isReloading: false,
    enemies: [] as {
      id: number;
      mesh: THREE.Group;
      hp: number;
      maxHp: number;
      speed: number;
      damage: number;
      lastShot: number;
      state: 'patrol' | 'attack';
      patrolTarget: THREE.Vector3;
      hitFlashTimer: number;
    }[],
    bullets: [] as {
      mesh: THREE.Mesh;
      dir: THREE.Vector3;
      speed: number;
      damage: number;
      life: number;
      isEnemy: boolean;
    }[],
    obstacles: [] as THREE.Object3D[],
    relicItems: [] as {
      group: THREE.Group;
      relicIndex: number;
      bobOffset: number;
      relicInfo: typeof REGIONS['sanaa']['relics'][0];
    }[],
    particles: [] as {
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      life: number;
    }[],
    cameraShake: 0,
    hitstopTimer: 0,
    footstepTimer: 0,
    score: 0,
    kills: 0,
    relicsCollected: 0,
    totalDamage: 0,
    startTime: Date.now(),
    lastShotTime: 0,
    keys: {} as Record<string, boolean>,
    isMouseDown: false,
    isDraggingView: false,
    prevTouch: { x: 0, y: 0 },
    spawnTimer: 0,
    radarTimer: 0,
    nextEnemyId: 1,
    // Battle Royale specific state
    playersAlive: 50,
    zoneRadius: 500,
    zoneTargetRadius: 500,
    zoneShrinkTimer: 30, // seconds until next shrink
    zonePhase: 1,
    zoneMesh: null as THREE.Mesh | null,
    lootCrates: [] as {
      mesh: THREE.Group;
      type: 'weapon' | 'health' | 'armor';
    }[],
  });

  // Keep props synced with stateRef
  useEffect(() => {
    stateRef.current.regionId = regionId;
  }, [regionId]);

  useEffect(() => {
    stateRef.current.viewMode = viewMode;
  }, [viewMode]);

  useEffect(() => {
    stateRef.current.isRunning = isRunning;
  }, [isRunning]);

  useEffect(() => {
    stateRef.current.isAiming = isAiming;
  }, [isAiming]);

  useEffect(() => {
    stateRef.current.isCrouching = isCrouching;
  }, [isCrouching]);

  // Handle external reload trigger
  useEffect(() => {
    if (triggerReload) {
      handleReload();
      onResetReload();
    }
  }, [triggerReload]);

  // Handle external triggers from touch HUD
  useEffect(() => {
    if (!isRunning) return;
    if (triggerJump) executeJump();
    if (triggerDash) executeDash();
    if (triggerSlash) executeSlash();
    if (triggerRoar) executeRoar();
    onResetTriggers();
  }, [triggerJump, triggerDash, triggerSlash, triggerRoar]);

  const executeJump = () => {
    const s = stateRef.current;
    if (s.player.isJumping || s.player.health <= 0) return;
    s.player.isJumping = true;
    s.player.verticalVelocity = 0.22;
    soundSynth.playDash();
    triggerHaptic('light');
  };

  const handleReload = () => {
    const s = stateRef.current;
    if (s.isReloading || s.ammoClip === 30 || s.ammoReserve <= 0 || s.player.health <= 0) return;
    s.isReloading = true;
    soundSynth.playReload();
    onShowToast('جاري إعادة تعبئة السلاح...');

    setTimeout(() => {
      const needed = 30 - s.ammoClip;
      const amount = Math.min(needed, s.ammoReserve);
      s.ammoClip += amount;
      s.ammoReserve -= amount;
      s.isReloading = false;
      onShowToast('تمت تعبئة الذخيرة بنجاح!');
    }, 1100);
  };

  const executeDash = () => {
    const s = stateRef.current;
    if (s.player.dashCooldown > 0 || s.player.health <= 0) return;
    s.player.isDashing = true;
    s.player.dashDuration = 0.22;
    s.player.dashCooldown = 0.85;
    s.player.invincibleTimer = 0.3;
    soundSynth.playDash();
  };

  const executeSlash = () => {
    const s = stateRef.current;
    if (s.player.slashCooldown > 0 || s.player.health <= 0) return;
    s.player.slashCooldown = 0.45;
    soundSynth.playSlash();
    s.cameraShake = Math.max(s.cameraShake, 0.4);

    const pPos = new THREE.Vector3(s.player.x, 0, s.player.z);
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), s.player.rotationY);

    s.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const ePos = enemy.mesh.position;
      const toEnemy = new THREE.Vector3().subVectors(ePos, pPos);
      const dist = toEnemy.length();

      if (dist < 5.0) {
        toEnemy.normalize();
        const dot = forward.dot(toEnemy);
        if (dot > 0.2) {
          const damage = 65;
          enemy.hp -= damage;
          enemy.hitFlashTimer = 0.15;
          s.hitstopTimer = 0.05;
          soundSynth.playHit();
          enemy.mesh.position.add(forward.clone().multiplyScalar(3.0));

          if (enemy.hp <= 0) {
            collapseRagdoll(enemy.mesh);
            s.kills++;
            s.score += 50;
            onAddKillLog('ضربة جنبية يمنية قاضية');
            onShowToast('تم القضاء على جندي معادٍ بالسلاح الأبيض!');
          }
        }
      }
    });
  };

  const executeRoar = () => {
    const s = stateRef.current;
    if (s.player.energy < 40 || s.player.health <= 0) return;
    s.player.energy = Math.max(0, s.player.energy - 40);
    soundSynth.playRoar();
    s.cameraShake = 1.0;
    s.hitstopTimer = 0.08;
    onShowToast('⚡ صيحة المحارب اليمني!');

    const pPos = new THREE.Vector3(s.player.x, 0, s.player.z);
    s.enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const dist = enemy.mesh.position.distanceTo(pPos);
      if (dist < 18) {
        const damage = 50;
        enemy.hp -= damage;
        enemy.hitFlashTimer = 0.2;
        const pushDir = new THREE.Vector3().subVectors(enemy.mesh.position, pPos).normalize();
        enemy.mesh.position.add(pushDir.multiplyScalar(6.5));

        if (enemy.hp <= 0) {
          collapseRagdoll(enemy.mesh);
          s.kills++;
          s.score += 50;
          onAddKillLog('صيحة أطاحت بالخصم');
        }
      }
    });
  };

  const collapseRagdoll = (rig: THREE.Group) => {
    const u = rig.userData as {
      hips: THREE.Group;
      leftLeg: { hip: THREE.Group };
      rightLeg: { hip: THREE.Group };
      leftArm: { shoulder: THREE.Group };
      rightArm: { shoulder: THREE.Group };
    };
    if (!u || !u.hips) return;
    u.hips.rotation.x = -Math.PI / 2.2;
    u.hips.position.y = 0.2;
    u.leftLeg.hip.rotation.x = 0.5;
    u.rightLeg.hip.rotation.x = -0.3;
    u.leftArm.shoulder.rotation.z = -1.2;
    u.rightArm.shoulder.rotation.z = 1.2;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      try {
        const testCanvas = document.createElement('canvas');
        const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Three.js Scene & Camera Setup
    const reg = REGIONS[stateRef.current.regionId];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(reg.bgGradStart);
    scene.fog = new THREE.FogExp2(reg.bgGradStart, 0.012);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        powerPreference: 'high-performance',
        antialias: !isSoftwareGl,
        precision: isSoftwareGl ? 'mediump' : 'highp',
      });
    } catch {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        precision: 'mediump',
      });
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSoftwareGl ? 1 : 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Environment Lighting with safe fallback
    let pmremGen: THREE.PMREMGenerator | null = null;
    try {
      pmremGen = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGen.fromScene(new RoomEnvironment()).texture;
    } catch (e) {
      console.warn('RoomEnvironment fallback triggered:', e);
    }

    const ambientLight = new THREE.AmbientLight(0xfff5eb, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 1.35);
    dirLight.position.set(50, 80, 40);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = isSoftwareGl ? 512 : 2048;
    dirLight.shadow.mapSize.height = isSoftwareGl ? 512 : 2048;
    const shadowD = 65;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    scene.add(dirLight);

    // 3. Procedural Texture Generators
    const createCamoTexture = (c1: string, c2: string, c3: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = c1;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? c2 : c3;
        ctx.beginPath();
        ctx.arc(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 26, 0, Math.PI * 2);
        ctx.fill();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };

    const createMudTowerTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#a67c52';
      ctx.fillRect(0, 0, 256, 256);

      ctx.fillStyle = 'rgba(50, 30, 15, 0.16)';
      for (let i = 0; i < 900; i++) {
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
      }

      // Traditional Yemeni White Plaster Trim (Qamariya & Arches)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(18, 18, 220, 220);
      for (let x = 18; x < 230; x += 32) {
        ctx.beginPath();
        ctx.arc(x + 16, 40, 12, Math.PI, 0);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const playerCamoTex = createCamoTexture('#2e3b2b', '#1a2418', '#4a5d43'); // Desert Green Camo
    const enemyCamoTex = createCamoTexture('#4a3b32', '#2b211a', '#6e584a'); // Urban Desert Camo
    const mudTowerTex = createMudTowerTexture();

    // 4. Procedural Humanoid Soldier Builder with Skeleton
    const createProceduralHumanSoldier = (isEnemy = false) => {
      const soldierGroup = new THREE.Group();
      const camoTex = isEnemy ? enemyCamoTex : playerCamoTex;
      const suitMat = new THREE.MeshStandardMaterial({ map: camoTex, roughness: 0.7 });
      const vestMat = new THREE.MeshStandardMaterial({
        color: isEnemy ? 0x241c18 : 0x1e281f,
        roughness: 0.5,
        metalness: 0.2,
      });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xbd886e, roughness: 0.6 });
      const bootMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
      const gearMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.4, metalness: 0.5 });

      // HIPS / ROOT
      const hips = new THREE.Group();
      hips.position.y = 0.95;
      soldierGroup.add(hips);

      const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.22), suitMat);
      hips.add(pelvis);

      // SPINE / TORSO
      const spine = new THREE.Group();
      spine.position.y = 0.12;
      hips.add(spine);

      const chest = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.42, 0.24), suitMat);
      chest.position.y = 0.21;
      chest.castShadow = !isSoftwareGl;
      spine.add(chest);

      // Tactical Armor Vest
      const vest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.28), vestMat);
      vest.position.set(0, 0.21, 0);
      spine.add(vest);

      // Ammo Pouches on Vest
      for (let i = -0.12; i <= 0.12; i += 0.12) {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 0.08), gearMat);
        pouch.position.set(i, 0.12, 0.16);
        spine.add(pouch);
      }

      // NECK & HEAD
      const neck = new THREE.Group();
      neck.position.y = 0.44;
      spine.add(neck);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), skinMat);
      head.position.y = 0.12;
      neck.add(head);

      // Tactical Helmet
      const helmet = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
        vestMat
      );
      helmet.position.set(0, 0.13, 0);
      neck.add(helmet);

      // Night Vision Goggles / Headset
      const nvg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12), gearMat);
      nvg.rotation.z = Math.PI / 2;
      nvg.position.set(0, 0.16, 0.13);
      neck.add(nvg);

      // ARMS
      const createArm = (isRight: boolean) => {
        const side = isRight ? 1 : -1;
        const shoulderJoint = new THREE.Group();
        shoulderJoint.position.set(side * 0.24, 0.38, 0);
        spine.add(shoulderJoint);

        const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.28), suitMat);
        upperArm.position.y = -0.14;
        shoulderJoint.add(upperArm);

        const elbowJoint = new THREE.Group();
        elbowJoint.position.y = -0.28;
        shoulderJoint.add(elbowJoint);

        const forearm = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.26), suitMat);
        forearm.position.y = -0.13;
        elbowJoint.add(forearm);

        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), gearMat);
        hand.position.y = -0.28;
        elbowJoint.add(hand);

        return { shoulder: shoulderJoint, elbow: elbowJoint, hand };
      };

      const leftArm = createArm(false);
      const rightArm = createArm(true);

      // LEGS
      const createLeg = (isRight: boolean) => {
        const side = isRight ? 1 : -1;
        const hipJoint = new THREE.Group();
        hipJoint.position.set(side * 0.11, -0.08, 0);
        hips.add(hipJoint);

        const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.4), suitMat);
        thigh.position.y = -0.2;
        thigh.castShadow = !isSoftwareGl;
        hipJoint.add(thigh);

        const kneeJoint = new THREE.Group();
        kneeJoint.position.y = -0.4;
        hipJoint.add(kneeJoint);

        const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.38), suitMat);
        calf.position.y = -0.19;
        calf.castShadow = !isSoftwareGl;
        kneeJoint.add(calf);

        const boot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.22), bootMat);
        boot.position.set(0, -0.41, 0.04);
        kneeJoint.add(boot);

        return { hip: hipJoint, knee: kneeJoint };
      };

      const leftLeg = createLeg(false);
      const rightLeg = createLeg(true);

      // ASSAULT RIFLE
      const rifleGroup = new THREE.Group();
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.45), gearMat);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35), gearMat);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.38);

      const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.08), gearMat);
      magazine.position.set(0, -0.1, -0.05);
      magazine.rotation.x = 0.3;

      const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14), gearMat);
      scope.rotation.x = Math.PI / 2;
      scope.position.set(0, 0.08, -0.05);

      rifleGroup.add(receiver, barrel, magazine, scope);
      rightArm.elbow.add(rifleGroup);
      rifleGroup.position.set(0, -0.26, -0.12);
      rifleGroup.rotation.set(Math.PI / 2, 0, -0.2);

      // Rig references for animation system
      soldierGroup.userData = {
        hips,
        spine,
        neck,
        leftArm,
        rightArm,
        leftLeg,
        rightLeg,
        rifleGroup,
        barrel,
        suitMat,
        animTimer: Math.random() * 100,
      };

      return soldierGroup;
    };

    // 5. Gait Animation System
    const animateSoldierGait = (uData: any, isMoving: boolean, delta: number) => {
      if (!uData || !uData.leftLeg) return;
      const t = uData.animTimer;

      if (isMoving) {
        // Leg swing
        uData.leftLeg.hip.rotation.x = Math.sin(t) * 0.65;
        uData.rightLeg.hip.rotation.x = -Math.sin(t) * 0.65;
        uData.leftLeg.knee.rotation.x = Math.max(0, -Math.sin(t) * 0.5);
        uData.rightLeg.knee.rotation.x = Math.max(0, Math.sin(t) * 0.5);

        // Tactical gun holding arm swing
        uData.leftArm.shoulder.rotation.x = -Math.PI / 3 + Math.sin(t) * 0.15;
        uData.rightArm.shoulder.rotation.x = -Math.PI / 3 - Math.sin(t) * 0.15;
      } else {
        // Combat Idle Breathing
        uData.leftLeg.hip.rotation.x = 0;
        uData.rightLeg.hip.rotation.x = 0;
        uData.leftLeg.knee.rotation.x = 0;
        uData.rightLeg.knee.rotation.x = 0;

        uData.spine.position.y = 0.12 + Math.sin(t * 0.4) * 0.015;
        uData.leftArm.shoulder.rotation.x = -Math.PI / 2.8 + Math.sin(t * 0.4) * 0.03;
        uData.rightArm.shoulder.rotation.x = -Math.PI / 2.8 + Math.sin(t * 0.4) * 0.03;
      }
    };

    // 6. Build Environment Map & Covers
    const buildEnvironment = () => {
      stateRef.current.obstacles = [];

      // Ground plane - Battle Royale size
      const worldSize = 1500;
      const floorGeo = new THREE.PlaneGeometry(worldSize, worldSize);
      const floorMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(reg.arenaGroundColor),
        roughness: 0.95,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = !isSoftwareGl;
      scene.add(floor);

      // 6.1 Battle Royale Zone (Storm) Visual
      const zoneGeo = new THREE.CylinderGeometry(1, 1, 60, 64, 1, true);
      const zoneMat = new THREE.MeshBasicMaterial({
        color: 0x4f46e5, // Indigo storm
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide,
      });
      const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
      zoneMesh.position.y = 30;
      scene.add(zoneMesh);
      stateRef.current.zoneMesh = zoneMesh;

      // Outer Danger Wall (more visible)
      const outerZoneMat = new THREE.MeshBasicMaterial({
        color: 0x4f46e5,
        transparent: true,
        opacity: 0.15,
        side: THREE.FrontSide,
        wireframe: true,
      });
      const outerZoneMesh = new THREE.Mesh(zoneGeo, outerZoneMat);
      zoneMesh.add(outerZoneMesh);

      // Mud Tower Fortresses
      const towerGeo = new THREE.BoxGeometry(10, 24, 10);
      const towerMat = new THREE.MeshStandardMaterial({ map: mudTowerTex, roughness: 0.8 });

      for (let i = 0; i < 16; i++) {
        const tower = new THREE.Mesh(towerGeo, towerMat);
        const angle = (i / 16) * Math.PI * 2;
        const radius = 45 + (i % 3) * 15;
        tower.position.set(Math.cos(angle) * radius, 12, Math.sin(angle) * radius);
        tower.castShadow = !isSoftwareGl;
        tower.receiveShadow = !isSoftwareGl;
        scene.add(tower);
        stateRef.current.obstacles.push(tower);
      }

      // 6.2 Loot Crates
      const createCrate = (pos: THREE.Vector3, type: 'weapon' | 'health' | 'armor') => {
        const group = new THREE.Group();
        const boxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        const boxMat = new THREE.MeshStandardMaterial({
          color: type === 'weapon' ? 0xef4444 : type === 'health' ? 0x10b981 : 0x3b82f6,
          roughness: 0.4,
          metalness: 0.6,
        });
        const mesh = new THREE.Mesh(boxGeo, boxMat);
        mesh.position.y = 0.75;
        group.add(mesh);

        // Add glow
        const light = new THREE.PointLight(boxMat.color, 2, 4);
        light.position.y = 1;
        group.add(light);

        group.position.copy(pos);
        scene.add(group);
        stateRef.current.lootCrates.push({ mesh: group, type });
      };

      // Spawn crates across the world
      for (let i = 0; i < 40; i++) {
        const x = (Math.random() - 0.5) * 900;
        const z = (Math.random() - 0.5) * 900;
        const type = Math.random() > 0.6 ? 'weapon' : Math.random() > 0.5 ? 'health' : 'armor';
        createCrate(new THREE.Vector3(x, 0, z), type);
      }

      // Sandbag Bunkers / Tactical Covers - Spread across large map
      const sandbagMat = new THREE.MeshStandardMaterial({ color: 0x8a724d, roughness: 0.9 });
      for (let i = 0; i < 60; i++) {
        const bunker = new THREE.Mesh(new THREE.BoxGeometry(4.0, 1.3, 1.4), sandbagMat);
        const x = (Math.random() - 0.5) * 800;
        const z = (Math.random() - 0.5) * 800;
        if (Math.abs(x) > 10 || Math.abs(z) > 10) {
          bunker.position.set(x, 0.65, z);
          bunker.rotation.y = Math.random() * Math.PI;
          bunker.castShadow = !isSoftwareGl;
          bunker.receiveShadow = !isSoftwareGl;
          scene.add(bunker);
          stateRef.current.obstacles.push(bunker);
        }
      }
    };

    buildEnvironment();

    // 7. Player Rig Setup
    const playerGroup = new THREE.Group();
    const playerRig = createProceduralHumanSoldier(false);
    playerGroup.add(playerRig);
    scene.add(playerGroup);

    playerGroup.add(camera);
    camera.position.set(0, 1.65, 0);

    // 8. Spawn Tactical Enemy Squad
    const spawnEnemySquad = (count = 7) => {
      stateRef.current.enemies.forEach((e) => scene.remove(e.mesh));
      stateRef.current.enemies = [];

      for (let i = 0; i < count; i++) {
        const enemyRig = createProceduralHumanSoldier(true);
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 32 + Math.random() * 35;
        enemyRig.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
        scene.add(enemyRig);

        stateRef.current.enemies.push({
          id: stateRef.current.nextEnemyId++,
          mesh: enemyRig,
          hp: 100,
          maxHp: 100,
          speed: 3.2 + Math.random() * 1.2,
          damage: 12,
          lastShot: performance.now() + Math.random() * 1500,
          state: 'patrol',
          patrolTarget: new THREE.Vector3((Math.random() - 0.5) * 70, 0, (Math.random() - 0.5) * 70),
          hitFlashTimer: 0,
        });
      }
    };

    spawnEnemySquad(49); // 49 bots + 1 player = 50 total
    stateRef.current.playersAlive = 50;

    // 9. Relic Spawn helper
    const spawnRelic = (pos: THREE.Vector3, relicIndex: number) => {
      const relicInfo = reg.relics[relicIndex % reg.relics.length];
      const relicGroup = new THREE.Group();

      const boxGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
      const boxMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.8,
        roughness: 0.2,
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      boxMesh.position.y = 0.5;
      boxMesh.castShadow = !isSoftwareGl;
      relicGroup.add(boxMesh);

      const crystalGeo = new THREE.OctahedronGeometry(0.5);
      const crystalMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
      crystalMesh.position.y = 1.4;
      relicGroup.add(crystalMesh);

      relicGroup.position.copy(pos);
      relicGroup.position.y = 0;
      scene.add(relicGroup);

      stateRef.current.relicItems.push({
        group: relicGroup,
        relicIndex,
        bobOffset: Math.random() * Math.PI * 2,
        relicInfo,
      });
    };

    // 10. Impact Particles helper
    const createImpactFX = (pos: THREE.Vector3, colorHex: number) => {
      const pGeo = new THREE.SphereGeometry(0.05, 4, 4);
      const pMat = new THREE.MeshBasicMaterial({ color: colorHex });
      for (let i = 0; i < 6; i++) {
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.copy(pos);
        scene.add(p);
        stateRef.current.particles.push({
          mesh: p,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            Math.random() * 2.5,
            (Math.random() - 0.5) * 3
          ),
          life: 0.35,
        });
      }
    };

    // 11. Player Weapon Shoot (Assault Rifle)
    const playerShoot = () => {
      const s = stateRef.current;
      if (!s.isRunning || s.player.health <= 0) return;
      if (s.isReloading) return;

      const now = performance.now();
      if (now - s.lastShotTime < 130) return; // ~460 RPM tactical assault rifle
      s.lastShotTime = now;

      if (s.ammoClip <= 0) {
        onShowToast('المخزن فارغ! اضغط R للتعبئة');
        return;
      }

      s.ammoClip--;
      soundSynth.playShoot();

      // Recoil & camera kick
      camera.rotation.x += 0.035;
      setTimeout(() => (camera.rotation.x -= 0.035), 70);

      // Muzzle flash point light
      const muzzleFlash = new THREE.PointLight(0xffcc00, 5, 6);
      muzzleFlash.position.set(0.2, -0.1, -0.6);
      camera.add(muzzleFlash);
      setTimeout(() => camera.remove(muzzleFlash), 40);

      // Raycast Target Aiming
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);

      // Bullet Tracer Visual
      const bGeo = new THREE.SphereGeometry(0.06, 6, 6);
      const bMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      const bullet = new THREE.Mesh(bGeo, bMat);

      const spawnPos = new THREE.Vector3();
      camera.getWorldPosition(spawnPos);
      bullet.position.copy(spawnPos);

      scene.add(bullet);
      s.bullets.push({
        mesh: bullet,
        dir: raycaster.ray.direction.clone(),
        speed: 60,
        damage: 35,
        life: 1.5,
        isEnemy: false,
      });

      // Hit Detection against active enemy meshes
      const aliveEnemyMeshes = s.enemies.filter((e) => e.hp > 0).map((e) => e.mesh);
      const intersects = raycaster.intersectObjects(aliveEnemyMeshes, true);

      if (intersects.length > 0) {
        const hitObj = intersects[0].object;
        let rootRig: THREE.Object3D = hitObj;
        while (rootRig.parent && rootRig.parent !== scene) {
          rootRig = rootRig.parent;
        }

        const enemy = s.enemies.find((e) => e.mesh === rootRig);
        if (enemy) {
          enemy.hp -= 35;
          enemy.hitFlashTimer = 0.12;
          s.totalDamage += 35;
          soundSynth.playHit();
          createImpactFX(intersects[0].point, 0xff0000);

          if (enemy.hp <= 0) {
            collapseRagdoll(enemy.mesh);
            s.kills++;
            s.score += 50;
            s.cameraShake = Math.max(s.cameraShake, 0.4);
            onAddKillLog('تم القضاء على جندي معادٍ');
            onShowToast('تم تطهير الهدف بنجاح!');

            if (s.relicsCollected < reg.relicsNeeded) {
              spawnRelic(enemy.mesh.position.clone(), s.relicsCollected);
            }

            const remaining = s.enemies.filter((e) => e.hp > 0).length;
            s.playersAlive = remaining + 1; // Bots + Player

            if (s.playersAlive === 1) {
              setTimeout(() => {
                soundSynth.playVictory();
                onGameOver(true, {
                  score: s.score,
                  kills: s.kills,
                  relicsCollected: s.relicsCollected,
                  totalDamageDealt: s.totalDamage,
                  wavesSurvived: s.zonePhase,
                  playtimeSeconds: Math.floor((Date.now() - s.startTime) / 1000),
                  playersAlive: s.playersAlive,
                  zoneRadius: s.zoneRadius,
                });
              }, 800);
            }
          }
        }
      } else {
        // Dust impact on obstacles
        const obsHits = raycaster.intersectObjects(s.obstacles);
        if (obsHits.length > 0) {
          createImpactFX(obsHits[0].point, 0xd2b48c);
        }
      }
    };

    // 12. Enemy Shooting Action
    const enemyShootWeapon = (enemyRig: THREE.Group) => {
      soundSynth.playShoot();

      const bGeo = new THREE.SphereGeometry(0.06, 6, 6);
      const bMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
      const bullet = new THREE.Mesh(bGeo, bMat);

      const spawnPos = enemyRig.position.clone().add(new THREE.Vector3(0, 1.3, 0));
      bullet.position.copy(spawnPos);

      const targetPos = playerGroup.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      const dir = new THREE.Vector3().subVectors(targetPos, spawnPos).normalize();

      scene.add(bullet);
      stateRef.current.bullets.push({
        mesh: bullet,
        dir,
        speed: 40,
        damage: 12,
        life: 1.2,
        isEnemy: true,
      });
    };

    // 13. Input Handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = true;
      stateRef.current.keys[e.key.toLowerCase()] = true;

      if (e.code === 'KeyR') {
        e.preventDefault();
        handleReload();
      }
      if (e.code === 'KeyV') {
        e.preventDefault();
        onToggleViewMode();
      }
      if (e.code === 'KeyC') {
        e.preventDefault();
        onToggleCrouch();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        executeJump();
      }
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        executeSlash();
      }
      if (e.key.toLowerCase() === 'e' || e.key.toLowerCase() === 'q') {
        e.preventDefault();
        executeRoar();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.code] = false;
      stateRef.current.keys[e.key.toLowerCase()] = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        stateRef.current.isMouseDown = true;
        playerShoot();
      } else if (e.button === 2) {
        e.preventDefault();
        onToggleAim(!stateRef.current.isAiming);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) stateRef.current.isMouseDown = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (stateRef.current.isRunning) {
        const sens = stateRef.current.isAiming ? 0.0013 : 0.0028;
        stateRef.current.player.rotationY -= e.movementX * sens;
        stateRef.current.player.pitchX = Math.max(
          -Math.PI / 2.8,
          Math.min(Math.PI / 2.8, stateRef.current.player.pitchX - e.movementY * sens)
        );
      }
    };

    // Touch Swipe View Controls
    const handleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('.joystick-base, .hud-panel, button, #scope-overlay')) return;
      stateRef.current.isDraggingView = true;
      stateRef.current.prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.isDraggingView) return;
      const dx = e.touches[0].clientX - stateRef.current.prevTouch.x;
      const dy = e.touches[0].clientY - stateRef.current.prevTouch.y;
      stateRef.current.prevTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const sens = stateRef.current.isAiming ? 0.002 : 0.004;
      stateRef.current.player.rotationY -= dx * sens;
      stateRef.current.player.pitchX = Math.max(
        -Math.PI / 2.8,
        Math.min(Math.PI / 2.8, stateRef.current.player.pitchX - dy * sens)
      );
    };

    const handleTouchEnd = () => {
      stateRef.current.isDraggingView = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    // 14. Responsive Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Register mobile touch camera rotation callback
    if (onRegisterCameraRotate) {
      onRegisterCameraRotate((dx: number, dy: number) => {
        const s = stateRef.current;
        if (!s.isRunning) return;
        const sens = s.isAiming ? 0.002 : 0.004;
        s.player.rotationY -= dx * sens;
        s.player.pitchX = Math.max(
          -Math.PI / 2.8,
          Math.min(Math.PI / 2.8, s.player.pitchX - dy * sens)
        );
      });
    }

    // 15. Continuous 60fps Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (timestamp: number) => {
      const rawDt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;
      const dt = Math.max(0.001, Math.min(rawDt, 0.05));

      const s = stateRef.current;

      if (s.isRunning) {
        // Battle Royale Zone Logic
        s.zoneShrinkTimer -= dt;
        if (s.zoneShrinkTimer <= 0) {
          s.zonePhase++;
          s.zoneTargetRadius = Math.max(20, s.zoneRadius * 0.6);
          s.zoneShrinkTimer = 45; // 45 seconds between shrinks
          onShowToast(`⚠️ احذر! المنطقة تتقلص إلى ${Math.round(s.zoneTargetRadius)}م`);
        }

        // Interpolate radius
        if (s.zoneRadius > s.zoneTargetRadius) {
          s.zoneRadius -= dt * 4.0;
        }

        if (s.zoneMesh) {
          s.zoneMesh.scale.set(s.zoneRadius, 1, s.zoneRadius);
        }

        // Zone Damage to Player
        const playerDist = Math.hypot(s.player.x, s.player.z);
        if (playerDist > s.zoneRadius) {
          s.player.health -= dt * 8.0; // 8 DPS outside zone
          if (Math.floor(timestamp / 500) % 2 === 0) {
            onPlayerDamaged();
          }
          if (s.player.health <= 0) {
            onGameOver(false, {
              score: s.score,
              kills: s.kills,
              relicsCollected: s.relicsCollected,
              totalDamageDealt: s.totalDamage,
              wavesSurvived: s.zonePhase,
              playtimeSeconds: Math.floor((Date.now() - s.startTime) / 1000),
              playersAlive: s.playersAlive,
              zoneRadius: s.zoneRadius,
            });
          }
        }

        if (s.hitstopTimer > 0) {
          s.hitstopTimer -= dt;
        } else {
          // Cooldowns
          if (s.player.dashCooldown > 0) s.player.dashCooldown -= dt;
          if (s.player.slashCooldown > 0) s.player.slashCooldown -= dt;
          if (s.player.invincibleTimer > 0) s.player.invincibleTimer -= dt;

          // Energy Regen
          s.player.energy = Math.min(s.player.maxEnergy, s.player.energy + dt * 10);

          // Aiming Scope FOV zoom transition
          const targetFov = s.isAiming ? 35 : 75;
          if (Math.abs(camera.fov - targetFov) > 0.5) {
            camera.fov += (targetFov - camera.fov) * dt * 14;
            camera.updateProjectionMatrix();
          }

          // Camera Height (Crouch stance transition)
          const targetCamY = s.isCrouching ? 1.05 : 1.65;
          camera.position.y += (targetCamY - camera.position.y) * dt * 10;

          // Movement Calculation
          let mx = 0;
          let mz = 0;

          if (s.keys['KeyW'] || s.keys['ArrowUp']) mz -= 1;
          if (s.keys['KeyS'] || s.keys['ArrowDown']) mz += 1;
          if (s.keys['KeyA'] || s.keys['ArrowLeft']) mx -= 1;
          if (s.keys['KeyD'] || s.keys['ArrowRight']) mx += 1;

          if (Math.abs(joystickVector.x) > 0.1 || Math.abs(joystickVector.y) > 0.1) {
            mx += joystickVector.x;
            mz += joystickVector.y;
          }

          const moveMag = Math.hypot(mx, mz);
          const isMoving = moveMag > 0.1;

          // Speed: Sprint (Shift) vs Crouch vs Normal
          const isSprinting = s.keys['ShiftLeft'] || s.keys['ShiftRight'];
          const moveSpeed = isSprinting ? 9.5 : s.isCrouching ? 3.5 : 6.0;

          if (isMoving) {
            const moveAngle = Math.atan2(mx, mz);
            const worldAngle = s.player.rotationY + moveAngle;
            const step = (s.player.isDashing ? 18.0 : moveSpeed) * dt;
            s.player.x += Math.sin(worldAngle) * step;
            s.player.z += Math.cos(worldAngle) * step;

            // Constrain player to world boundaries (large)
            const bound = 700;
            s.player.x = Math.max(-bound, Math.min(bound, s.player.x));
            s.player.z = Math.max(-bound, Math.min(bound, s.player.z));

            // Animate Player Skeleton Gait
            playerRig.userData.animTimer += dt * (isSprinting ? 12 : 8);
            animateSoldierGait(playerRig.userData, true, dt);

            // Footsteps Audio
            s.footstepTimer += dt;
            if (s.footstepTimer > (isSprinting ? 0.28 : 0.42)) {
              s.footstepTimer = 0;
              soundSynth.playFootstep();
            }
          } else {
            playerRig.userData.animTimer += dt * 3;
            animateSoldierGait(playerRig.userData, false, dt);
          }

          if (s.player.isDashing) {
            s.player.dashDuration -= dt;
            if (s.player.dashDuration <= 0) s.player.isDashing = false;
          }

          // Jump & Gravity Physics
          if (s.player.isJumping) {
            s.player.y += s.player.verticalVelocity;
            s.player.verticalVelocity -= 0.012;
            if (s.player.y <= 0) {
              s.player.y = 0;
              s.player.isJumping = false;
              s.player.verticalVelocity = 0;
            }
          }

          // Crouch model scale
          if (s.isCrouching && !s.player.isJumping) {
            playerGroup.scale.set(1, 0.72, 1);
          } else {
            playerGroup.scale.set(1, 1, 1);
          }

          // Update Player Group Transform
          playerGroup.position.set(s.player.x, s.player.y, s.player.z);
          playerGroup.rotation.y = s.player.rotationY;

          // Camera Placement (FPS vs TPS)
          const isFPS = s.viewMode === 'FPS';
          playerRig.visible = !isFPS;

          if (isFPS) {
            camera.position.set(0, (s.isCrouching ? 1.05 : 1.65) + s.player.y, 0);
            camera.rotation.set(s.player.pitchX, 0, 0);
          } else {
            const camDist = s.isAiming ? 2.5 : 4.0;
            const camHeight = (s.isCrouching ? 1.5 : 2.2) + s.player.y;
            const offset = new THREE.Vector3(0, camHeight, camDist);
            offset.applyAxisAngle(new THREE.Vector3(1, 0, 0), s.player.pitchX);
            camera.position.copy(offset);
            camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.4, playerGroup.position.z);
          }

          // Camera Shake Decay
          if (s.cameraShake > 0) {
            camera.position.x += (Math.random() - 0.5) * s.cameraShake * 0.2;
            camera.position.y += (Math.random() - 0.5) * s.cameraShake * 0.2;
            s.cameraShake = Math.max(0, s.cameraShake - dt * 2.5);
          }

          // Touch firing continuous check
          if (isTouchFiring) {
            playerShoot();
          }

          // Bullets Physics & Collisions
          for (let bIdx = s.bullets.length - 1; bIdx >= 0; bIdx--) {
            const b = s.bullets[bIdx];
            b.mesh.position.addScaledVector(b.dir, b.speed * dt);
            b.life -= dt;

            // Player hit check if enemy bullet
            if (b.isEnemy && b.mesh.position.distanceTo(playerGroup.position) < 1.3) {
              if (s.player.invincibleTimer <= 0) {
                s.player.health = Math.max(0, s.player.health - b.damage);
                s.player.invincibleTimer = 0.35;
                s.cameraShake = 0.7;
                soundSynth.playPlayerHurt();
                onPlayerDamaged();

                if (s.player.health <= 0) {
                  soundSynth.playGameOver();
                  onGameOver(false, {
                    score: s.score,
                    kills: s.kills,
                    relicsCollected: s.relicsCollected,
                    totalDamageDealt: s.totalDamage,
                    wavesSurvived: s.zonePhase,
                    playtimeSeconds: Math.floor((Date.now() - s.startTime) / 1000),
                    playersAlive: s.playersAlive,
                    zoneRadius: s.zoneRadius,
                  });
                }
              }
              b.life = 0;
            }

            if (b.life <= 0) {
              scene.remove(b.mesh);
              b.mesh.geometry.dispose();
              s.bullets.splice(bIdx, 1);
            }
          }

          // Enemy Squad Tactical AI & Animation
          const now = performance.now();
          const pPos = playerGroup.position;

          s.enemies.forEach((enemy) => {
            if (enemy.hp <= 0) return; // Dead / Ragdoll pose

            const rig = enemy.mesh;
            const uData = rig.userData;
            uData.animTimer += dt * 8;

            // Zone Damage to Bots
            const eDist = Math.hypot(rig.position.x, rig.position.z);
            if (eDist > s.zoneRadius) {
              enemy.hp -= dt * 10.0; // Bots take more zone damage to clear the outskirts
              enemy.hitFlashTimer = 0.1;
              if (enemy.hp <= 0) {
                collapseRagdoll(rig);
                s.playersAlive = Math.max(1, s.playersAlive - 1);
                onAddKillLog('خصم سقط خارج المنطقة');
              }
            }

            const distToPlayer = rig.position.distanceTo(pPos);
            const dirToPlayer = new THREE.Vector3().subVectors(pPos, rig.position).normalize();
            dirToPlayer.y = 0;

            // Simple Inter-Bot Combat: Occasionally look at other bots
            if (enemy.state === 'patrol' && Math.random() < 0.005) {
              const otherBots = s.enemies.filter((e) => e.hp > 0 && e.id !== enemy.id);
              if (otherBots.length > 0) {
                const targetBot = otherBots[Math.floor(Math.random() * otherBots.length)];
                const dToBot = rig.position.distanceTo(targetBot.mesh.position);
                if (dToBot < 30) {
                  rig.lookAt(targetBot.mesh.position.x, rig.position.y, targetBot.mesh.position.z);
                  if (Math.random() < 0.2) {
                    enemyShootWeapon(rig); // Target bot (fake shot, or can implement real hit detection)
                    // Randomly eliminate bots to simulate BR
                    if (Math.random() < 0.02) {
                      targetBot.hp -= 40;
                      if (targetBot.hp <= 0) {
                        collapseRagdoll(targetBot.mesh);
                        s.playersAlive = Math.max(1, s.playersAlive - 1);
                        onAddKillLog(`مواجهة بين الخصوم: تصفية لاعب`);
                      }
                    }
                  }
                }
              }
            }

            if (distToPlayer < 45) {
              enemy.state = 'attack';
            }

            if (enemy.state === 'attack') {
              rig.lookAt(pPos.x, rig.position.y, pPos.z);

              // Advance or take tactical stance
              if (distToPlayer > 12) {
                rig.position.addScaledVector(dirToPlayer, enemy.speed * dt);
                animateSoldierGait(uData, true, dt);
              } else {
                animateSoldierGait(uData, false, dt);
              }

              // Enemy Fire with Tactical Interval
              if (now - enemy.lastShot > 1600 + Math.random() * 800) {
                enemy.lastShot = now;
                enemyShootWeapon(rig);
              }
            } else {
              // Patrol State
              const dirPatrol = new THREE.Vector3().subVectors(enemy.patrolTarget, rig.position).normalize();
              dirPatrol.y = 0;
              rig.position.addScaledVector(dirPatrol, enemy.speed * 0.5 * dt);
              rig.lookAt(enemy.patrolTarget.x, rig.position.y, enemy.patrolTarget.z);
              animateSoldierGait(uData, true, dt);

              if (rig.position.distanceTo(enemy.patrolTarget) < 3.5) {
                enemy.patrolTarget.set((Math.random() - 0.5) * 80, 0, (Math.random() - 0.5) * 80);
              }
            }

            // Bot Scaling based on Zone Phase
            enemy.speed = (3.2 + Math.random() * 1.2) * (1 + s.zonePhase * 0.15);
            enemy.damage = 12 * (1 + s.zonePhase * 0.1);

            // Hit Flash visual
            if (enemy.hitFlashTimer > 0) {
              enemy.hitFlashTimer -= dt;
              if (uData.suitMat) uData.suitMat.color.setHex(0xffffff);
            } else {
              if (uData.suitMat) uData.suitMat.color.setHex(0xffffff);
            }
          });

          // Loot Crate Pickup logic
          for (let cIdx = s.lootCrates.length - 1; cIdx >= 0; cIdx--) {
            const crate = s.lootCrates[cIdx];
            crate.mesh.rotation.y += dt * 1.5;
            const dist = crate.mesh.position.distanceTo(playerGroup.position);

            if (dist < 2.5) {
              soundSynth.playLoot();
              if (crate.type === 'weapon') {
                s.ammoReserve += 60;
                onShowToast('📦 تم العثور على ذخيرة إضافية (+60)!');
              } else if (crate.type === 'health') {
                s.player.health = Math.min(s.player.maxHealth, s.player.health + 40);
                onShowToast('📦 تم العثور على حزمة طبية (+40)!');
              } else if (crate.type === 'armor') {
                s.player.energy = Math.min(s.player.maxEnergy, s.player.energy + 50);
                onShowToast('📦 تم شحن الطاقة القتالية (+50)!');
              }
              scene.remove(crate.mesh);
              s.lootCrates.splice(cIdx, 1);
              triggerHaptic('medium');
            }
          }

          // Relic Items Pickup & Bobbing
          for (let rIdx = s.relicItems.length - 1; rIdx >= 0; rIdx--) {
            const item = s.relicItems[rIdx];
            item.group.rotation.y += dt * 2.0;
            item.group.position.y = Math.sin(timestamp * 0.004 + item.bobOffset) * 0.25 + 0.35;

            const dist = item.group.position.distanceTo(playerGroup.position);

            if (dist < 8) {
              const pull = new THREE.Vector3().subVectors(playerGroup.position, item.group.position).normalize();
              item.group.position.add(pull.multiplyScalar(dt * 12));
            }

            if (dist < 2.0) {
              soundSynth.playLoot();
              s.relicsCollected++;
              s.score += 150;
              onRelicFound(item.relicInfo.nameAr, item.relicInfo.nameEn, item.relicInfo.icon, s.relicsCollected);
              onShowToast(`تم استعادة الغنيمة: ${item.relicInfo.nameAr}!`);

              scene.remove(item.group);
              s.relicItems.splice(rIdx, 1);
            }
          }

          // Particles Update
          for (let pIdx = s.particles.length - 1; pIdx >= 0; pIdx--) {
            const p = s.particles[pIdx];
            p.mesh.position.addScaledVector(p.velocity, dt);
            p.life -= dt;
            if (p.life <= 0) {
              scene.remove(p.mesh);
              p.mesh.geometry.dispose();
              s.particles.splice(pIdx, 1);
            }
          }

          // Update Radar Blips every 80ms
          s.radarTimer += dt;
          if (s.radarTimer >= 0.08) {
            s.radarTimer = 0;
            const blips: RadarBlip[] = [];
            const radRange = 60;

            s.enemies.forEach((enemy) => {
              if (enemy.hp <= 0) return;
              const dx = enemy.mesh.position.x - s.player.x;
              const dz = enemy.mesh.position.z - s.player.z;
              if (Math.hypot(dx, dz) < radRange) {
                blips.push({
                  id: enemy.id,
                  relX: dx,
                  relZ: dz,
                  isEnemy: true,
                });
              }
            });

            s.relicItems.forEach((relic, idx) => {
              const dx = relic.group.position.x - s.player.x;
              const dz = relic.group.position.z - s.player.z;
              if (Math.hypot(dx, dz) < radRange) {
                blips.push({
                  id: 3000 + idx,
                  relX: dx,
                  relZ: dz,
                  isEnemy: false,
                });
              }
            });

            onUpdateRadar(blips);
          }

          // Report Stats to React HUD
          const aliveCount = s.enemies.filter((e) => e.hp > 0).length;
          onUpdateStats(
            Math.max(0, Math.round(s.player.health)),
            s.player.maxHealth,
            Math.round(s.player.energy),
            s.player.maxEnergy,
            s.score,
            s.relicsCollected,
            s.kills,
            s.ammoClip,
            s.ammoReserve,
            aliveCount,
            s.playersAlive,
            s.zoneRadius
          );
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);

      pmremGen?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [regionId]);

  return <div ref={mountRef} className="w-full h-full relative cursor-crosshair overflow-hidden" />;
};
