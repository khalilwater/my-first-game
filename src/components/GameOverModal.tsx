import React from 'react';
import { Trophy, RotateCcw, Settings } from 'lucide-react';
import { PlayerState } from '../types';

interface GameOverModalProps {
  winner: 1 | 2 | null;
  player1: PlayerState;
  player2: PlayerState;
  onRematch: () => void;
  onOpenSettings: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  player1,
  player2,
  onRematch,
  onOpenSettings,
}) => {
  if (!winner) return null;

  const winningPlayer = winner === 1 ? player1 : player2;
  const isP1 = winner === 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="game-over-card"
        className={`w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl border ${
          isP1 ? 'bg-slate-900 border-cyan-500/50 shadow-cyan-500/10' : 'bg-slate-900 border-orange-500/50 shadow-orange-500/10'
        }`}
      >
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border shadow-xl ${
            isP1
              ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400/40 shadow-cyan-500/30'
              : 'bg-orange-500/20 text-orange-400 border-orange-400/40 shadow-orange-500/30'
          }`}
        >
          <Trophy size={32} />
        </div>

        <div className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-1">
          Victory!
        </div>

        <h2
          className={`text-2xl font-black mb-3 ${
            isP1 ? 'text-cyan-300' : 'text-orange-400'
          }`}
        >
          {winningPlayer.name} Wins!
        </h2>

        {/* Score comparison pill */}
        <div className="flex items-center justify-center gap-4 bg-slate-800/80 rounded-xl py-3 px-4 mb-6 border border-slate-700/60">
          <div className="text-center">
            <div className="text-[11px] font-semibold text-cyan-400">{player1.name}</div>
            <div className="text-xl font-mono font-bold text-slate-100">{player1.score}</div>
          </div>
          <div className="text-slate-500 font-bold text-sm">:</div>
          <div className="text-center">
            <div className="text-[11px] font-semibold text-orange-400">{player2.name}</div>
            <div className="text-xl font-mono font-bold text-slate-100">{player2.score}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            id="btn-modal-rematch"
            onClick={onRematch}
            className={`w-full py-3 px-4 font-bold rounded-xl text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 ${
              isP1
                ? 'bg-cyan-400 hover:bg-cyan-300 shadow-cyan-500/30'
                : 'bg-orange-400 hover:bg-orange-300 shadow-orange-500/30'
            }`}
          >
            <RotateCcw size={18} />
            <span>Play Next Round</span>
          </button>

          <button
            id="btn-modal-change-mode"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-4 font-medium rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 border border-slate-700"
          >
            <Settings size={16} />
            <span>Game Settings / Modes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
