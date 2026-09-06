export type GameMode = 'targets' | 'dodgeball' | 'goalrush' | 'rally';

export type SplitOrientation = 'vertical' | 'horizontal'; // vertical = top vs bottom (tabletop), horizontal = left vs right

export interface PlayerState {
  id: 1 | 2;
  name: string;
  color: string;
  accentColor: string;
  score: number;
  hp: number; // For dodgeball
  ammo: number; // Available balls (e.g. max 3)
  maxAmmo: number;
  lastThrowTime: number;
  isBot?: boolean;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  ownerId: 1 | 2;
  color: string;
  active: boolean;
  bouncesRemaining: number;
  trail: { x: number; y: number; alpha: number }[];
  power?: 'normal' | 'fire' | 'heavy' | 'speed';
}

export interface TargetItem {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  ownerId: 1 | 2; // Whose side it belongs to (target to be hit by opponent)
  hp: number;
  maxHp: number;
  color: string;
  active: boolean;
  hitFlash: number;
}

export interface Obstacle {
  x: number;
  y: number;
  radius: number;
  type: 'bumper' | 'portal' | 'spinner';
  angle?: number;
  speed?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ActiveTouchDrag {
  pointerId: number;
  playerId: 1 | 2;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

export interface GameStats {
  winner: 1 | 2 | null;
  round: number;
  player1Hits: number;
  player2Hits: number;
  rallyCount: number;
}
