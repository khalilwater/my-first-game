import React from 'react';
import { Volume2, VolumeX, Pause, Play, RotateCcw, Settings, Bot, Users } from 'lucide-react';
import { GameMode, PlayerState, SplitOrientation } from '../types';

interface ScoreBoardProps {
  player1: PlayerState;
  player2: PlayerState;
  gameMode: GameMode;
  isPaused: boolean;
  isMuted: boolean;
  tabletopFlipped: boolean;
  orientation: SplitOrientation;
  isAiEnabled: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onResetRound: () => void;
  onOpenSettings: () => void;
  onToggleAi: () => void;
  targetsP1Remaining?: number;
  targetsP2Remaining?: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  player1,
  player2,
  gameMode,
  isPaused,
  isMuted,
  tabletopFlipped,
  orientation,
  isAiEnabled,
  onTogglePause,
  onToggleMute,
  onResetRound,
  onOpenSettings,
  onToggleAi,
  targetsP1Remaining = 5,
  targetsP2Remaining = 5,
}) => {
  const isVertical = orientation === 'vertical';

  return (
    <>
      {/* Player 2 HUD (Top or Right) */}
      <div
        className={`absolute z-10 pointer-events-none transition-transform duration-300 ${
          isVertical
            ? `top-2 left-0 right-0 px-4 flex justify-between items-center ${tabletopFlipped ? 'rotate-180' : ''}`
            : 'top-2 right-2 flex flex-col items-end gap-1'
        }`}
      >
        <div className="bg-slate-900/85 backdrop-blur-md border border-orange-500/40 rounded-xl px-3.5 py-1.5 shadow-lg flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse" />
            <span className="font-bold text-sm tracking-wide text-orange-400">
              {player2.name}
            </span>
            {isAiEnabled && (
              <span className="text-[10px] uppercase font-semibold bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded border border-orange-500/30">
                AI
              </span>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Mode-specific status */}
          {gameMode === 'targets' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">Pins:</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i < targetsP2Remaining
                        ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)]'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {gameMode === 'dodgeball' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">HP:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${i < player2.hp ? 'text-red-500' : 'text-slate-600'}`}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          )}

          {gameMode === 'goalrush' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Goals:</span>
              <span className="font-mono font-black text-orange-400 text-base">{player2.score}</span>
            </div>
          )}

          {/* Ammo indicator */}
          <div className="flex items-center gap-1 pl-1">
            <div className="flex gap-1">
              {Array.from({ length: player2.maxAmmo }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    i < player2.ammo ? 'bg-orange-400 scale-100' : 'bg-slate-700 scale-75'
                  }`}
                  title="Ammo"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Center Control Bar */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-full px-3 py-1.5 shadow-2xl">
        <button
          id="btn-toggle-pause"
          onClick={onTogglePause}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          title={isPaused ? 'Resume Game' : 'Pause Game'}
          aria-label={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? <Play size={16} className="text-emerald-400" /> : <Pause size={16} />}
        </button>

        <button
          id="btn-reset-round"
          onClick={onResetRound}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          title="Restart Round"
          aria-label="Restart Round"
        >
          <RotateCcw size={16} />
        </button>

        <button
          id="btn-toggle-mute"
          onClick={onToggleMute}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Toggle Mute"
        >
          {isMuted ? <VolumeX size={16} className="text-rose-400" /> : <Volume2 size={16} />}
        </button>

        <button
          id="btn-toggle-ai"
          onClick={onToggleAi}
          className={`p-1.5 rounded-full transition-colors active:scale-95 ${
            isAiEnabled
              ? 'text-orange-400 bg-orange-500/20 border border-orange-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={isAiEnabled ? '2-Player Touch Mode' : 'Practice vs AI Bot'}
          aria-label="Toggle AI Mode"
        >
          {isAiEnabled ? <Bot size={16} /> : <Users size={16} />}
        </button>

        <button
          id="btn-open-settings"
          onClick={onOpenSettings}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors active:scale-95"
          title="Game Settings"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Player 1 HUD (Bottom or Left) */}
      <div
        className={`absolute z-10 pointer-events-none ${
          isVertical
            ? 'bottom-2 left-0 right-0 px-4 flex justify-between items-center'
            : 'bottom-2 left-2 flex flex-col items-start gap-1'
        }`}
      >
        <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3.5 py-1.5 shadow-lg flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
            <span className="font-bold text-sm tracking-wide text-cyan-300">
              {player1.name}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Mode-specific status */}
          {gameMode === 'targets' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">Pins:</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i < targetsP1Remaining
                        ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {gameMode === 'dodgeball' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">HP:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${i < player1.hp ? 'text-red-500' : 'text-slate-600'}`}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          )}

          {gameMode === 'goalrush' && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Goals:</span>
              <span className="font-mono font-black text-cyan-400 text-base">{player1.score}</span>
            </div>
          )}

          {/* Ammo indicator */}
          <div className="flex items-center gap-1 pl-1">
            <div className="flex gap-1">
              {Array.from({ length: player1.maxAmmo }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    i < player1.ammo ? 'bg-cyan-400 scale-100' : 'bg-slate-700 scale-75'
                  }`}
                  title="Ammo"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
