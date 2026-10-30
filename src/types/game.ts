export type GameState = 'TITLE_SCREEN' | 'PLAYING' | 'PAUSED' | 'VICTORY' | 'GAME_OVER';

export type CameraViewMode = 'FPS' | 'TPS';

export type RegionId = 'sanaa' | 'marib' | 'hadramout' | 'socotra';

export interface RelicInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  icon: string;
}

export interface RegionConfig {
  id: RegionId;
  nameAr: string;
  nameEn: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  bgGradStart: string;
  bgGradEnd: string;
  arenaGroundColor: string;
  accentColor: string;
  enemyBaseColor: string;
  enemySpeedMult: number;
  enemySpawnInterval: number;
  relicsNeeded: number;
  relics: RelicInfo[];
  landmarks: string[];
  coordinates: { lat: number; lng: number };
  mapZoom: number;
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  angle: number;
  dashCooldown: number;
  dashDuration: number;
  isDashing: boolean;
  slashCooldown: number;
  invincibleTimer: number;
}

export type EnemyType = 'raider' | 'archer' | 'brute';

export interface Enemy {
  id: number;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  telegraphTimer: number; // for wind-up animations
  attackCooldown: number;
  hitFlashTimer: number;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isEnemy: boolean;
  damage: number;
  pierce: number;
  life: number;
}

export interface CollectibleItem {
  id: number;
  type: 'relic' | 'health' | 'energy';
  relicIndex?: number;
  x: number;
  y: number;
  radius: number;
  bobOffset: number;
  color: string;
  nameAr: string;
  nameEn: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  shape?: 'circle' | 'spark' | 'smoke';
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface GameStats {
  score: number;
  kills: number;
  relicsCollected: number;
  totalDamageDealt: number;
  wavesSurvived: number;
  playtimeSeconds: number;
  playersAlive: number;
  zoneRadius: number;
}

export interface RadarBlip {
  id: number;
  relX: number;
  relZ: number;
  isEnemy: boolean;
}

export interface KillLogItem {
  id: number;
  text: string;
  time: number;
}
