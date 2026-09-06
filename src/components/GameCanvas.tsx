import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Ball,
  GameMode,
  Obstacle,
  Particle,
  PlayerState,
  SplitOrientation,
  TargetItem,
} from '../types';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  gameMode: GameMode;
  orientation: SplitOrientation;
  tabletopFlipped: boolean;
  ballSpeedMultiplier: number;
  hasObstacles: boolean;
  isPaused: boolean;
  isAiEnabled: boolean;
  player1: PlayerState;
  player2: PlayerState;
  onUpdatePlayer1: (updater: (prev: PlayerState) => PlayerState) => void;
  onUpdatePlayer2: (updater: (prev: PlayerState) => PlayerState) => void;
  onRoundWin: (winner: 1 | 2) => void;
  roundResetKey: number;
}

interface ActiveDrag {
  pointerId: number;
  playerId: 1 | 2;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
}

interface BumperShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameMode,
  orientation,
  tabletopFlipped,
  ballSpeedMultiplier,
  hasObstacles,
  isPaused,
  isAiEnabled,
  player1,
  player2,
  onUpdatePlayer1,
  onUpdatePlayer2,
  onRoundWin,
  roundResetKey,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active touch drags tracked by pointerId
  const activeDragsRef = useRef<Map<number, ActiveDrag>>(new Map());

  // Game physics state kept in refs for optimal 60fps canvas loop
  const ballsRef = useRef<Ball[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shockwavesRef = useRef<BumperShockwave[]>([]);
  const targetsP1Ref = useRef<TargetItem[]>([]);
  const targetsP2Ref = useRef<TargetItem[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);

  // Avatar / Defender positions for Dodgeball & Goalrush
  const p1AvatarRef = useRef({ x: 0, y: 0, vx: 2, radius: 24, dragging: false, pointerId: -1 });
  const p2AvatarRef = useRef({ x: 0, y: 0, vx: -2, radius: 24, dragging: false, pointerId: -1 });

  // AI bot timing
  const aiLastThrowTimeRef = useRef<number>(Date.now());

  // Screen Shake effect
  const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });

  // Canvas dimensions
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });

  // Ammo recharge timer
  const lastAmmoRechargeRef = useRef<number>(Date.now());

  // Initialize targets and obstacles
  const initRoundEntities = useCallback(() => {
    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) return;

    const isVertical = orientation === 'vertical';

    // Clear balls and effects
    ballsRef.current = [];
    particlesRef.current = [];
    shockwavesRef.current = [];

    // Targets setup
    const p1Targets: TargetItem[] = [];
    const p2Targets: TargetItem[] = [];

    if (gameMode === 'targets') {
      const targetCount = 5;
      if (isVertical) {
        // Horizontal line of targets at top and bottom
        const spacing = width / (targetCount + 1);
        for (let i = 1; i <= targetCount; i++) {
          p2Targets.push({
            id: `p2-t-${i}`,
            x: spacing * i,
            y: 42,
            width: 32,
            height: 24,
            ownerId: 2,
            hp: 1,
            maxHp: 1,
            color: '#f97316',
            active: true,
            hitFlash: 0,
          });
          p1Targets.push({
            id: `p1-t-${i}`,
            x: spacing * i,
            y: height - 42,
            width: 32,
            height: 24,
            ownerId: 1,
            hp: 1,
            maxHp: 1,
            color: '#22d3ee',
            active: true,
            hitFlash: 0,
          });
        }
      } else {
        // Vertical line of targets at left and right
        const spacing = height / (targetCount + 1);
        for (let i = 1; i <= targetCount; i++) {
          p1Targets.push({
            id: `p1-t-${i}`,
            x: 42,
            y: spacing * i,
            width: 24,
            height: 32,
            ownerId: 1,
            hp: 1,
            maxHp: 1,
            color: '#22d3ee',
            active: true,
            hitFlash: 0,
          });
          p2Targets.push({
            id: `p2-t-${i}`,
            x: width - 42,
            y: spacing * i,
            width: 24,
            height: 32,
            ownerId: 2,
            hp: 1,
            maxHp: 1,
            color: '#f97316',
            active: true,
            hitFlash: 0,
          });
        }
      }
    }
    targetsP1Ref.current = p1Targets;
    targetsP2Ref.current = p2Targets;

    // Reset avatars for dodgeball / goal rush
    if (isVertical) {
      p1AvatarRef.current = { x: width / 2, y: height - 70, vx: 2.2, radius: 24, dragging: false, pointerId: -1 };
      p2AvatarRef.current = { x: width / 2, y: 70, vx: -2.2, radius: 24, dragging: false, pointerId: -1 };
    } else {
      p1AvatarRef.current = { x: 70, y: height / 2, vx: 2.2, radius: 24, dragging: false, pointerId: -1 };
      p2AvatarRef.current = { x: width - 70, y: height / 2, vx: -2.2, radius: 24, dragging: false, pointerId: -1 };
    }

    // Obstacles (Bumpers) in center line
    const obstacles: Obstacle[] = [];
    if (hasObstacles) {
      if (isVertical) {
        const midY = height / 2;
        obstacles.push(
          { x: width * 0.25, y: midY, radius: 22, type: 'bumper' },
          { x: width * 0.5, y: midY, radius: 26, type: 'bumper' },
          { x: width * 0.75, y: midY, radius: 22, type: 'bumper' }
        );
      } else {
        const midX = width / 2;
        obstacles.push(
          { x: midX, y: height * 0.25, radius: 22, type: 'bumper' },
          { x: midX, y: height * 0.5, radius: 26, type: 'bumper' },
          { x: midX, y: height * 0.75, radius: 22, type: 'bumper' }
        );
      }
    }
    obstaclesRef.current = obstacles;
  }, [dimensions, gameMode, orientation, hasObstacles]);

  // Handle Container Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 50 && height > 50) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Reinitialize round when key or dimensions change
  useEffect(() => {
    initRoundEntities();
  }, [initRoundEntities, roundResetKey]);

  // Spawn particle burst
  const spawnParticles = (x: number, y: number, color: string, count = 12, speed = 4) => {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const vel = (Math.random() * 0.6 + 0.5) * speed;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * vel,
        vy: Math.sin(angle) * vel,
        radius: Math.random() * 3 + 2,
        color,
        alpha: 1,
        life: 0,
        maxLife: Math.floor(Math.random() * 18 + 14),
      });
    }
  };

  // Helper: check which player territory a coordinate belongs to
  const getPlayerTerritory = (x: number, y: number): 1 | 2 => {
    const { width, height } = dimensions;
    if (orientation === 'vertical') {
      return y >= height / 2 ? 1 : 2;
    } else {
      return x <= width / 2 ? 1 : 2;
    }
  };

  // Throw ball function
  const throwBall = (
    playerId: 1 | 2,
    startX: number,
    startY: number,
    vx: number,
    vy: number,
    powerRatio = 1
  ) => {
    // Check ammo
    const currentAmmo = playerId === 1 ? player1.ammo : player2.ammo;
    if (currentAmmo <= 0) {
      sound.playBounce(0.5);
      return;
    }

    // Decrement ammo
    if (playerId === 1) {
      onUpdatePlayer1((p) => ({ ...p, ammo: Math.max(0, p.ammo - 1) }));
    } else {
      onUpdatePlayer2((p) => ({ ...p, ammo: Math.max(0, p.ammo - 1) }));
    }

    // Apply speed multiplier
    const speed = Math.hypot(vx, vy);
    const targetSpeed = Math.max(4.5, Math.min(speed, 18)) * ballSpeedMultiplier;
    const angle = Math.atan2(vy, vx);

    const finalVx = Math.cos(angle) * targetSpeed;
    const finalVy = Math.sin(angle) * targetSpeed;

    const ballColor = playerId === 1 ? '#22d3ee' : '#f97316';
    const ballRadius = 14;

    ballsRef.current.push({
      id: `b-${Date.now()}-${Math.random()}`,
      x: startX,
      y: startY,
      vx: finalVx,
      vy: finalVy,
      radius: ballRadius,
      ownerId: playerId,
      color: ballColor,
      active: true,
      bouncesRemaining: 6,
      trail: [],
    });

    // Sound and haptic
    sound.playThrow(powerRatio);
    sound.triggerHaptic(20);

    // Blast particle effect
    spawnParticles(startX, startY, ballColor, 8, 2.5);
  };

  // AI Throw Logic
  const handleAiBot = () => {
    if (!isAiEnabled || isPaused) return;
    const now = Date.now();
    if (now - aiLastThrowTimeRef.current < 1600 + Math.random() * 800) return;
    if (player2.ammo <= 0) return;

    aiLastThrowTimeRef.current = now;
    const { width, height } = dimensions;
    const isVertical = orientation === 'vertical';

    // AI launches from top territory
    let startX: number;
    let startY: number;
    let targetX: number;
    let targetY: number;

    if (isVertical) {
      startX = width * (0.2 + Math.random() * 0.6);
      startY = 80 + Math.random() * 50;

      // Target player 1 targets or avatar
      if (gameMode === 'targets') {
        const activeTargets = targetsP1Ref.current.filter((t) => t.active);
        if (activeTargets.length > 0) {
          const target = activeTargets[Math.floor(Math.random() * activeTargets.length)];
          targetX = target.x + (Math.random() - 0.5) * 20;
          targetY = target.y;
        } else {
          targetX = width / 2;
          targetY = height - 50;
        }
      } else {
        targetX = p1AvatarRef.current.x + (Math.random() - 0.5) * 35;
        targetY = p1AvatarRef.current.y;
      }
    } else {
      startX = width - 80 - Math.random() * 50;
      startY = height * (0.2 + Math.random() * 0.6);

      if (gameMode === 'targets') {
        const activeTargets = targetsP1Ref.current.filter((t) => t.active);
        if (activeTargets.length > 0) {
          const target = activeTargets[Math.floor(Math.random() * activeTargets.length)];
          targetX = target.x;
          targetY = target.y + (Math.random() - 0.5) * 20;
        } else {
          targetX = 50;
          targetY = height / 2;
        }
      } else {
        targetX = p1AvatarRef.current.x;
        targetY = p1AvatarRef.current.y + (Math.random() - 0.5) * 35;
      }
    }

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy);
    const speed = (9 + Math.random() * 4) * ballSpeedMultiplier;

    throwBall(2, startX, startY, (dx / dist) * speed, (dy / dist) * speed, 0.9);
  };

  // Pointer Event Handlers (Multi-Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isPaused) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const playerId = getPlayerTerritory(x, y);

    // If AI is enabled, ignore touches on Player 2's side
    if (isAiEnabled && playerId === 2) return;

    // Check if touch is directly on avatar in dodgeball/goalrush
    const avatar = playerId === 1 ? p1AvatarRef.current : p2AvatarRef.current;
    const distToAvatar = Math.hypot(x - avatar.x, y - avatar.y);
    if ((gameMode === 'dodgeball' || gameMode === 'goalrush') && distToAvatar < avatar.radius + 15) {
      avatar.dragging = true;
      avatar.pointerId = e.pointerId;
    }

    activeDragsRef.current.set(e.pointerId, {
      pointerId: e.pointerId,
      playerId,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      startTime: performance.now(),
    });

    // Capture pointer
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const drag = activeDragsRef.current.get(e.pointerId);
    if (!drag) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drag.currentX = x;
    drag.currentY = y;

    // If dragging avatar in dodgeball mode
    const avatar = drag.playerId === 1 ? p1AvatarRef.current : p2AvatarRef.current;
    if (avatar.dragging && avatar.pointerId === e.pointerId) {
      if (orientation === 'vertical') {
        avatar.x = Math.max(avatar.radius + 10, Math.min(x, dimensions.width - avatar.radius - 10));
      } else {
        avatar.y = Math.max(avatar.radius + 10, Math.min(y, dimensions.height - avatar.radius - 10));
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const drag = activeDragsRef.current.get(e.pointerId);
    if (!drag) return;

    activeDragsRef.current.delete(e.pointerId);

    // Release avatar drag
    const avatar = drag.playerId === 1 ? p1AvatarRef.current : p2AvatarRef.current;
    if (avatar.dragging && avatar.pointerId === e.pointerId) {
      avatar.dragging = false;
      avatar.pointerId = -1;
      return;
    }

    const { startX, startY, currentX, currentY, playerId, startTime } = drag;
    const dragDx = currentX - startX;
    const dragDy = currentY - startY;
    const dragDist = Math.hypot(dragDx, dragDy);
    const dragTime = Math.max(16, performance.now() - startTime);

    const isVertical = orientation === 'vertical';

    // Calculate throw velocity
    let vx = 0;
    let vy = 0;
    let powerRatio = 1;

    if (dragDist < 10) {
      // Direct tap throw (tap to shoot straight toward opponent)
      if (isVertical) {
        vy = playerId === 1 ? -9 : 9;
        vx = (Math.random() - 0.5) * 2;
      } else {
        vx = playerId === 1 ? 9 : -9;
        vy = (Math.random() - 0.5) * 2;
      }
      powerRatio = 0.7;
    } else {
      // Distinguish Slingshot (pull back) vs Swipe/Flick (fling forward)
      let isSlingshot = false;

      if (isVertical) {
        // Player 1 throws UP (-y). Pulling down (+y) is slingshot pull-back!
        if (playerId === 1 && dragDy > 10) isSlingshot = true;
        // Player 2 throws DOWN (+y). Pulling up (-y) is slingshot pull-back!
        if (playerId === 2 && dragDy < -10) isSlingshot = true;
      } else {
        // Player 1 throws RIGHT (+x). Pulling left (-x) is slingshot pull-back!
        if (playerId === 1 && dragDx < -10) isSlingshot = true;
        // Player 2 throws LEFT (-x). Pulling right (+x) is slingshot pull-back!
        if (playerId === 2 && dragDx > 10) isSlingshot = true;
      }

      if (isSlingshot) {
        // Slingshot: ball flies opposite of the drag vector!
        const slingPower = Math.min(dragDist, 180) / 10;
        vx = -dragDx * 0.12;
        vy = -dragDy * 0.12;
        powerRatio = Math.min(1.5, Math.max(0.6, slingPower / 8));
      } else {
        // Swipe/Flick: fling ball in the swipe direction with velocity!
        const swipeSpeed = (dragDist / dragTime) * 16;
        const normalizedVx = dragDx / dragDist;
        const normalizedVy = dragDy / dragDist;
        const finalSpeed = Math.min(Math.max(swipeSpeed, 6), 16);

        vx = normalizedVx * finalSpeed;
        vy = normalizedVy * finalSpeed;
        powerRatio = Math.min(1.5, finalSpeed / 10);
      }
    }

    throwBall(playerId, startX, startY, vx, vy, powerRatio);

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    activeDragsRef.current.delete(e.pointerId);
    if (p1AvatarRef.current.pointerId === e.pointerId) p1AvatarRef.current.dragging = false;
    if (p2AvatarRef.current.pointerId === e.pointerId) p2AvatarRef.current.dragging = false;
  };

  // Main Canvas Rendering and Physics Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const { width, height } = dimensions;
      if (width <= 0 || height <= 0) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      // Handle HiDPI
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Screen shake decay
      if (screenShakeRef.current.intensity > 0) {
        screenShakeRef.current.x = (Math.random() - 0.5) * screenShakeRef.current.intensity * 8;
        screenShakeRef.current.y = (Math.random() - 0.5) * screenShakeRef.current.intensity * 8;
        screenShakeRef.current.intensity = Math.max(0, screenShakeRef.current.intensity - dt * 3);
      } else {
        screenShakeRef.current.x = 0;
        screenShakeRef.current.y = 0;
      }

      ctx.save();
      ctx.translate(screenShakeRef.current.x, screenShakeRef.current.y);

      // 1. Draw Arena Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const isVertical = orientation === 'vertical';

      // Half-court background glow
      if (isVertical) {
        // Player 2 half (top, orange)
        const gradP2 = ctx.createLinearGradient(0, 0, 0, height / 2);
        gradP2.addColorStop(0, 'rgba(249, 115, 22, 0.08)');
        gradP2.addColorStop(1, 'rgba(249, 115, 22, 0.01)');
        ctx.fillStyle = gradP2;
        ctx.fillRect(0, 0, width, height / 2);

        // Player 1 half (bottom, cyan)
        const gradP1 = ctx.createLinearGradient(0, height, 0, height / 2);
        gradP1.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
        gradP1.addColorStop(1, 'rgba(34, 211, 238, 0.01)');
        ctx.fillStyle = gradP1;
        ctx.fillRect(0, height / 2, width, height / 2);

        // Center line & center circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center circle
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Horizontal: P1 left (cyan), P2 right (orange)
        const gradP1 = ctx.createLinearGradient(0, 0, width / 2, 0);
        gradP1.addColorStop(0, 'rgba(34, 211, 238, 0.08)');
        gradP1.addColorStop(1, 'rgba(34, 211, 238, 0.01)');
        ctx.fillStyle = gradP1;
        ctx.fillRect(0, 0, width / 2, height);

        const gradP2 = ctx.createLinearGradient(width, 0, width / 2, 0);
        gradP2.addColorStop(0, 'rgba(249, 115, 22, 0.08)');
        gradP2.addColorStop(1, 'rgba(249, 115, 22, 0.01)');
        ctx.fillStyle = gradP2;
        ctx.fillRect(width / 2, 0, width / 2, height);

        // Center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 45, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw goal zones in Goal Rush mode
      if (gameMode === 'goalrush') {
        const goalWidth = isVertical ? width * 0.45 : height * 0.45;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 3;

        if (isVertical) {
          // Top goal (P2)
          const startX = (width - goalWidth) / 2;
          ctx.strokeRect(startX, 0, goalWidth, 24);
          // Bottom goal (P1)
          ctx.strokeRect(startX, height - 24, goalWidth, 24);
        } else {
          // Left goal (P1)
          const startY = (height - goalWidth) / 2;
          ctx.strokeRect(0, startY, 24, goalWidth);
          // Right goal (P2)
          ctx.strokeRect(width - 24, startY, 24, goalWidth);
        }
      }

      // 2. Ammo passive recharge
      if (!isPaused && currentTime - lastAmmoRechargeRef.current > 1200) {
        lastAmmoRechargeRef.current = currentTime;
        onUpdatePlayer1((p) => (p.ammo < p.maxAmmo ? { ...p, ammo: p.ammo + 1 } : p));
        onUpdatePlayer2((p) => (p.ammo < p.maxAmmo ? { ...p, ammo: p.ammo + 1 } : p));
      }

      // 3. AI Bot Update
      handleAiBot();

      // 4. Update & Draw Avatars (Dodgeball / Goal Rush)
      if (gameMode === 'dodgeball' || gameMode === 'goalrush') {
        const p1 = p1AvatarRef.current;
        const p2 = p2AvatarRef.current;

        // Auto patrol if not dragging
        if (!isPaused) {
          if (!p1.dragging) {
            if (isVertical) {
              p1.x += p1.vx;
              if (p1.x < p1.radius + 15 || p1.x > width - p1.radius - 15) p1.vx = -p1.vx;
            } else {
              p1.y += p1.vx;
              if (p1.y < p1.radius + 15 || p1.y > height - p1.radius - 15) p1.vx = -p1.vx;
            }
          }
          if (!p2.dragging && !isAiEnabled) {
            if (isVertical) {
              p2.x += p2.vx;
              if (p2.x < p2.radius + 15 || p2.x > width - p2.radius - 15) p2.vx = -p2.vx;
            } else {
              p2.y += p2.vx;
              if (p2.y < p2.radius + 15 || p2.y > height - p2.radius - 15) p2.vx = -p2.vx;
            }
          } else if (isAiEnabled && !isPaused) {
            // Simple AI dodging
            p2.x += p2.vx;
            if (p2.x < p2.radius + 15 || p2.x > width - p2.radius - 15) p2.vx = -p2.vx;
          }
        }

        // Draw Player 1 Avatar
        ctx.save();
        ctx.shadowColor = 'rgba(34, 211, 238, 0.6)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#67e8f9';
        ctx.stroke();

        // Inner icon
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gameMode === 'goalrush' ? 'GK' : 'P1', p1.x, p1.y);
        ctx.restore();

        // Draw Player 2 Avatar
        ctx.save();
        ctx.shadowColor = 'rgba(249, 115, 22, 0.6)';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, p2.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ea580c';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fdba74';
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(gameMode === 'goalrush' ? 'GK' : 'P2', p2.x, p2.y);
        ctx.restore();
      }

      // 5. Draw Obstacles (Center Bumpers)
      obstaclesRef.current.forEach((obs) => {
        ctx.save();
        ctx.shadowColor = 'rgba(168, 85, 247, 0.7)';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#6b21a8';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#c084fc';
        ctx.stroke();

        // Inner glowing core
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#f3e8ff';
        ctx.fill();
        ctx.restore();
      });

      // 6. Draw Targets (Pins in Knockout Mode)
      if (gameMode === 'targets') {
        [...targetsP1Ref.current, ...targetsP2Ref.current].forEach((t) => {
          if (!t.active) return;
          if (t.hitFlash > 0) t.hitFlash -= dt * 4;

          ctx.save();
          const isP1Target = t.ownerId === 1;
          const targetColor = t.hitFlash > 0 ? '#ffffff' : isP1Target ? '#06b6d4' : '#f97316';
          ctx.shadowColor = isP1Target ? 'rgba(6, 182, 212, 0.8)' : 'rgba(249, 115, 22, 0.8)';
          ctx.shadowBlur = 14;

          ctx.fillStyle = targetColor;
          ctx.beginPath();
          // Rounded rect pin shape
          const r = 6;
          const x = t.x - t.width / 2;
          const y = t.y - t.height / 2;
          ctx.roundRect(x, y, t.width, t.height, r);
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Target center eye
          ctx.beginPath();
          ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();

          ctx.restore();
        });
      }

      // 7. Update & Draw Balls
      const balls = ballsRef.current;
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        if (!b.active) continue;

        if (!isPaused) {
          b.x += b.vx * dt * 60;
          b.y += b.vy * dt * 60;

          // Trail points
          b.trail.unshift({ x: b.x, y: b.y, alpha: 1 });
          if (b.trail.length > 10) b.trail.pop();
          b.trail.forEach((p) => (p.alpha -= 0.09));

          // Bounce off side walls
          if (b.x - b.radius <= 0) {
            b.x = b.radius;
            b.vx = -b.vx * 0.95;
            b.bouncesRemaining--;
            sound.playBounce(1.1);
            spawnParticles(b.x, b.y, b.color, 4, 2);
          } else if (b.x + b.radius >= width) {
            b.x = width - b.radius;
            b.vx = -b.vx * 0.95;
            b.bouncesRemaining--;
            sound.playBounce(1.1);
            spawnParticles(b.x, b.y, b.color, 4, 2);
          }

          // Top and Bottom wall logic
          if (isVertical) {
            if (gameMode === 'goalrush') {
              const goalWidth = width * 0.45;
              const goalLeft = (width - goalWidth) / 2;
              const goalRight = goalLeft + goalWidth;

              // Check if scored in top goal (Player 1 scores!)
              if (b.y - b.radius <= 10 && b.x >= goalLeft && b.x <= goalRight) {
                b.active = false;
                sound.playScore();
                sound.triggerHaptic(50);
                screenShakeRef.current.intensity = 1.2;
                spawnParticles(b.x, 15, '#22d3ee', 24, 6);
                onUpdatePlayer1((p) => {
                  const newScore = p.score + 1;
                  if (newScore >= 5) setTimeout(() => onRoundWin(1), 300);
                  return { ...p, score: newScore };
                });
                continue;
              }

              // Check if scored in bottom goal (Player 2 scores!)
              if (b.y + b.radius >= height - 10 && b.x >= goalLeft && b.x <= goalRight) {
                b.active = false;
                sound.playScore();
                sound.triggerHaptic(50);
                screenShakeRef.current.intensity = 1.2;
                spawnParticles(b.x, height - 15, '#f97316', 24, 6);
                onUpdatePlayer2((p) => {
                  const newScore = p.score + 1;
                  if (newScore >= 5) setTimeout(() => onRoundWin(2), 300);
                  return { ...p, score: newScore };
                });
                continue;
              }
            }

            // Normal vertical wall bounce
            if (b.y - b.radius <= 0) {
              b.y = b.radius;
              b.vy = -b.vy * 0.95;
              b.bouncesRemaining--;
              sound.playBounce(0.9);
              spawnParticles(b.x, b.y, b.color, 4, 2);
            } else if (b.y + b.radius >= height) {
              b.y = height - b.radius;
              b.vy = -b.vy * 0.95;
              b.bouncesRemaining--;
              sound.playBounce(0.9);
              spawnParticles(b.x, b.y, b.color, 4, 2);
            }
          } else {
            // Horizontal layout top/bottom bounces
            if (b.y - b.radius <= 0) {
              b.y = b.radius;
              b.vy = -b.vy * 0.95;
              b.bouncesRemaining--;
              sound.playBounce(0.9);
            } else if (b.y + b.radius >= height) {
              b.y = height - b.radius;
              b.vy = -b.vy * 0.95;
              b.bouncesRemaining--;
              sound.playBounce(0.9);
            }

            if (b.x - b.radius <= 0) {
              b.x = b.radius;
              b.vx = -b.vx * 0.95;
              b.bouncesRemaining--;
            } else if (b.x + b.radius >= width) {
              b.x = width - b.radius;
              b.vx = -b.vx * 0.95;
              b.bouncesRemaining--;
            }
          }

          // Bounces depletion
          if (b.bouncesRemaining <= 0) {
            b.active = false;
            spawnParticles(b.x, b.y, b.color, 6, 1.5);
            continue;
          }

          // Bumper Obstacle Collisions
          obstaclesRef.current.forEach((obs) => {
            const dx = b.x - obs.x;
            const dy = b.y - obs.y;
            const dist = Math.hypot(dx, dy);
            if (dist < b.radius + obs.radius) {
              // Elastic rebound
              const normalX = dx / dist;
              const normalY = dy / dist;
              const dot = b.vx * normalX + b.vy * normalY;

              b.vx = (b.vx - 2 * dot * normalX) * 1.1;
              b.vy = (b.vy - 2 * dot * normalY) * 1.1;

              // Prevent overlap
              b.x = obs.x + normalX * (b.radius + obs.radius + 2);
              b.y = obs.y + normalY * (b.radius + obs.radius + 2);

              sound.playBounce(1.4);
              sound.triggerHaptic(25);
              shockwavesRef.current.push({
                x: obs.x,
                y: obs.y,
                radius: obs.radius,
                maxRadius: obs.radius * 2.2,
                color: '#c084fc',
                alpha: 1,
              });
              spawnParticles(b.x, b.y, '#d8b4fe', 8, 3);
            }
          });

          // Target Collisions (Mode: Knockout)
          if (gameMode === 'targets') {
            const opponentTargets = b.ownerId === 1 ? targetsP2Ref.current : targetsP1Ref.current;
            for (const t of opponentTargets) {
              if (!t.active) continue;
              if (
                b.x + b.radius >= t.x - t.width / 2 &&
                b.x - b.radius <= t.x + t.width / 2 &&
                b.y + b.radius >= t.y - t.height / 2 &&
                b.y - b.radius <= t.y + t.height / 2
              ) {
                // Hit target!
                t.active = false;
                b.active = false;
                sound.playHit(true);
                sound.triggerHaptic(40);
                screenShakeRef.current.intensity = 0.8;
                spawnParticles(t.x, t.y, t.color, 18, 5);

                // Update score / check win
                const remaining = opponentTargets.filter((tg) => tg.active).length;
                if (b.ownerId === 1) {
                  onUpdatePlayer1((p) => ({ ...p, score: p.score + 10 }));
                  if (remaining === 0) {
                    setTimeout(() => onRoundWin(1), 300);
                  }
                } else {
                  onUpdatePlayer2((p) => ({ ...p, score: p.score + 10 }));
                  if (remaining === 0) {
                    setTimeout(() => onRoundWin(2), 300);
                  }
                }
                break;
              }
            }
          }

          // Avatar Collisions (Mode: Dodgeball)
          if (gameMode === 'dodgeball') {
            const targetAvatar = b.ownerId === 1 ? p2AvatarRef.current : p1AvatarRef.current;
            const distToAvatar = Math.hypot(b.x - targetAvatar.x, b.y - targetAvatar.y);
            if (distToAvatar < b.radius + targetAvatar.radius) {
              b.active = false;
              sound.playHit(true);
              sound.triggerHaptic(50);
              screenShakeRef.current.intensity = 1.0;
              spawnParticles(targetAvatar.x, targetAvatar.y, b.color, 20, 5);

              if (b.ownerId === 1) {
                // P2 takes damage
                onUpdatePlayer2((p) => {
                  const newHp = Math.max(0, p.hp - 1);
                  if (newHp === 0) setTimeout(() => onRoundWin(1), 300);
                  return { ...p, hp: newHp };
                });
              } else {
                // P1 takes damage
                onUpdatePlayer1((p) => {
                  const newHp = Math.max(0, p.hp - 1);
                  if (newHp === 0) setTimeout(() => onRoundWin(2), 300);
                  return { ...p, hp: newHp };
                });
              }
            }
          }

          // Ball-on-Ball collisions
          for (let j = i - 1; j >= 0; j--) {
            const b2 = balls[j];
            if (!b2.active) continue;

            const dx = b2.x - b.x;
            const dy = b2.y - b.y;
            const dist = Math.hypot(dx, dy);
            const minDist = b.radius + b2.radius;

            if (dist < minDist && dist > 0.001) {
              // Elastic 2D Circle Collision
              const nx = dx / dist;
              const ny = dy / dist;

              // Relative velocity
              const kx = b.vx - b2.vx;
              const ky = b.vy - b2.vy;
              const p = 2 * (nx * kx + ny * ky) / 2;

              b.vx -= p * nx * 0.95;
              b.vy -= p * ny * 0.95;
              b2.vx += p * nx * 0.95;
              b2.vy += p * ny * 0.95;

              // Prevent sticking
              const overlap = (minDist - dist) / 2;
              b.x -= nx * overlap;
              b.y -= ny * overlap;
              b2.x += nx * overlap;
              b2.y += ny * overlap;

              sound.playClash();
              sound.triggerHaptic(15);
              spawnParticles((b.x + b2.x) / 2, (b.y + b2.y) / 2, '#ffffff', 6, 2.5);
            }
          }
        }

        // Draw Ball Trail
        b.trail.forEach((point) => {
          if (point.alpha <= 0) return;
          ctx.save();
          ctx.beginPath();
          ctx.arc(point.x, point.y, b.radius * (0.3 + point.alpha * 0.5), 0, Math.PI * 2);
          ctx.fillStyle = b.color;
          ctx.globalAlpha = point.alpha * 0.45;
          ctx.fill();
          ctx.restore();
        });

        // Draw Ball Body
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();

        // Shiny sphere highlight
        ctx.beginPath();
        ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        ctx.restore();
      }

      // Filter inactive balls
      ballsRef.current = balls.filter((b) => b.active);

      // 8. Update & Draw Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 9. Update & Draw Shockwaves
      const shockwaves = shockwavesRef.current;
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.radius += dt * 80;
        s.alpha = 1 - s.radius / s.maxRadius;

        if (s.radius >= s.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 10. Draw Active Touch Trajectory & Slingshot Elastic Bands
      activeDragsRef.current.forEach((drag) => {
        const { startX, startY, currentX, currentY, playerId } = drag;
        const dragDx = currentX - startX;
        const dragDy = currentY - startY;
        const dist = Math.hypot(dragDx, dragDy);

        const playerColor = playerId === 1 ? '#22d3ee' : '#f97316';

        // Draw Touch Anchor Indicator
        ctx.save();
        ctx.beginPath();
        ctx.arc(startX, startY, 20, 0, Math.PI * 2);
        ctx.strokeStyle = playerColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Slingshot Elastic Line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = playerColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Finger grip point
        ctx.beginPath();
        ctx.arc(currentX, currentY, 12, 0, Math.PI * 2);
        ctx.fillStyle = playerColor;
        ctx.shadowColor = playerColor;
        ctx.shadowBlur = 10;
        ctx.fill();

        // Trajectory Prediction Arc (Dotted line in opposite direction for slingshot or swipe direction)
        if (dist > 12) {
          let aimVx = -dragDx * 0.12;
          let aimVy = -dragDy * 0.12;

          // If swiping forward rather than pulling back, aim with swipe
          let isSlingshot = false;
          if (isVertical) {
            if ((playerId === 1 && dragDy > 10) || (playerId === 2 && dragDy < -10)) isSlingshot = true;
          } else {
            if ((playerId === 1 && dragDx < -10) || (playerId === 2 && dragDx > 10)) isSlingshot = true;
          }

          if (!isSlingshot) {
            aimVx = dragDx * 0.12;
            aimVy = dragDy * 0.12;
          }

          let px = startX;
          let py = startY;
          for (let step = 1; step <= 8; step++) {
            px += aimVx * 2.8;
            py += aimVy * 2.8;

            // Bounce simulation on side walls
            if (px <= 14) px = 14 + (14 - px);
            if (px >= width - 14) px = (width - 14) - (px - (width - 14));

            ctx.beginPath();
            ctx.arc(px, py, Math.max(2, 6 - step * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, ' + (1 - step * 0.1) + ')';
            ctx.shadowColor = playerColor;
            ctx.shadowBlur = 6;
            ctx.fill();
          }
        }
        ctx.restore();
      });

      // 11. Subtle On-Screen Touch Instructions (Initial guidance)
      if (balls.length === 0 && activeDragsRef.current.size === 0) {
        ctx.save();
        ctx.font = '500 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (isVertical) {
          // Bottom Player hint
          ctx.fillStyle = 'rgba(34, 211, 238, 0.45)';
          ctx.fillText('Touch & pull back or swipe up to throw', width / 2, height - 110);

          // Top Player hint
          if (!isAiEnabled) {
            ctx.save();
            if (tabletopFlipped) {
              ctx.translate(width / 2, 110);
              ctx.rotate(Math.PI);
              ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
              ctx.fillText('Touch & pull back or swipe down to throw', 0, 0);
            } else {
              ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
              ctx.fillText('Touch & pull back or swipe down to throw', width / 2, 110);
            }
            ctx.restore();
          }
        } else {
          ctx.fillStyle = 'rgba(34, 211, 238, 0.45)';
          ctx.fillText('Touch & throw right', width * 0.25, height / 2);

          if (!isAiEnabled) {
            ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
            ctx.fillText('Touch & throw left', width * 0.75, height / 2);
          }
        }
        ctx.restore();
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    dimensions,
    gameMode,
    orientation,
    tabletopFlipped,
    ballSpeedMultiplier,
    isPaused,
    isAiEnabled,
    onUpdatePlayer1,
    onUpdatePlayer2,
    onRoundWin,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex-1 overflow-hidden select-none touch-none cursor-crosshair"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        className="block"
      />
    </div>
  );
};
