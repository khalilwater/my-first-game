import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ScoreBoard } from './components/ScoreBoard';
import { GameSettingsModal } from './components/GameSettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { GameMode, PlayerState, SplitOrientation } from './types';
import { sound } from './utils/audio';

export default function App() {
  // Screen orientation setup (defaults to vertical tabletop for phone/tablet)
  const [orientation, setOrientation] = useState<SplitOrientation>('vertical');
  const [tabletopFlipped, setTabletopFlipped] = useState<boolean>(true);

  // Auto-detect initial screen orientation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth > window.innerHeight * 1.25) {
        setOrientation('horizontal');
      }
    }
  }, []);

  // Game Settings & States
  const [gameMode, setGameMode] = useState<GameMode>('targets');
  const [ballSpeedMultiplier, setBallSpeedMultiplier] = useState<number>(1.0);
  const [hasObstacles, setHasObstacles] = useState<boolean>(true);
  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Round key to trigger canvas entity resets
  const [roundResetKey, setRoundResetKey] = useState<number>(0);
  const [winner, setWinner] = useState<1 | 2 | null>(null);

  // Players State
  const [player1, setPlayer1] = useState<PlayerState>({
    id: 1,
    name: 'Player 1',
    color: '#22d3ee',
    accentColor: '#06b6d4',
    score: 0,
    hp: 5,
    ammo: 3,
    maxAmmo: 3,
    lastThrowTime: 0,
  });

  const [player2, setPlayer2] = useState<PlayerState>({
    id: 2,
    name: 'Player 2',
    color: '#f97316',
    accentColor: '#ea580c',
    score: 0,
    hp: 5,
    ammo: 3,
    maxAmmo: 3,
    lastThrowTime: 0,
    isBot: false,
  });

  // Handle Round Reset
  const handleResetRound = useCallback(() => {
    setWinner(null);
    setIsPaused(false);
    setPlayer1((prev) => ({ ...prev, hp: 5, ammo: prev.maxAmmo }));
    setPlayer2((prev) => ({ ...prev, hp: 5, ammo: prev.maxAmmo }));
    setRoundResetKey((k) => k + 1);
  }, []);

  // Handle Round Win
  const handleRoundWin = useCallback((winningPlayerId: 1 | 2) => {
    setWinner(winningPlayerId);
    sound.playVictory();
    sound.triggerHaptic(80);
  }, []);

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMute = sound.toggleMute();
    setIsMuted(nextMute);
  };

  // Toggle AI Bot
  const handleToggleAi = () => {
    setIsAiEnabled((prev) => {
      const next = !prev;
      setPlayer2((p) => ({
        ...p,
        name: next ? 'AI Bot' : 'Player 2',
        isBot: next,
      }));
      return next;
    });
  };

  // Change Game Mode
  const handleSelectGameMode = (mode: GameMode) => {
    setGameMode(mode);
    handleResetRound();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col font-sans">
      {/* Game Canvas Arena */}
      <GameCanvas
        gameMode={gameMode}
        orientation={orientation}
        tabletopFlipped={tabletopFlipped}
        ballSpeedMultiplier={ballSpeedMultiplier}
        hasObstacles={hasObstacles}
        isPaused={isPaused || !!winner}
        isAiEnabled={isAiEnabled}
        player1={player1}
        player2={player2}
        onUpdatePlayer1={setPlayer1}
        onUpdatePlayer2={setPlayer2}
        onRoundWin={handleRoundWin}
        roundResetKey={roundResetKey}
      />

      {/* Dynamic HUD / Score Display */}
      <ScoreBoard
        player1={player1}
        player2={player2}
        gameMode={gameMode}
        isPaused={isPaused}
        isMuted={isMuted}
        tabletopFlipped={tabletopFlipped}
        orientation={orientation}
        isAiEnabled={isAiEnabled}
        onTogglePause={() => setIsPaused((p) => !p)}
        onToggleMute={handleToggleMute}
        onResetRound={handleResetRound}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleAi={handleToggleAi}
      />

      {/* Settings Modal */}
      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gameMode={gameMode}
        onSelectGameMode={handleSelectGameMode}
        orientation={orientation}
        onToggleOrientation={() =>
          setOrientation((o) => (o === 'vertical' ? 'horizontal' : 'vertical'))
        }
        tabletopFlipped={tabletopFlipped}
        onToggleTabletopFlipped={() => setTabletopFlipped((f) => !f)}
        isAiEnabled={isAiEnabled}
        onToggleAi={handleToggleAi}
        ballSpeedMultiplier={ballSpeedMultiplier}
        onChangeBallSpeed={setBallSpeedMultiplier}
        hasObstacles={hasObstacles}
        onToggleObstacles={() => setHasObstacles((o) => !o)}
      />

      {/* Game Over / Victory Modal */}
      <GameOverModal
        winner={winner}
        player1={player1}
        player2={player2}
        onRematch={handleResetRound}
        onOpenSettings={() => {
          setWinner(null);
          setIsSettingsOpen(true);
        }}
      />
    </main>
  );
}
