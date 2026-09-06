import React from 'react';
import { X, Smartphone, Target, Shield, Trophy, Zap, Bot, Users } from 'lucide-react';
import { GameMode, SplitOrientation } from '../types';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode) => void;
  orientation: SplitOrientation;
  onToggleOrientation: () => void;
  tabletopFlipped: boolean;
  onToggleTabletopFlipped: () => void;
  isAiEnabled: boolean;
  onToggleAi: () => void;
  ballSpeedMultiplier: number;
  onChangeBallSpeed: (speed: number) => void;
  hasObstacles: boolean;
  onToggleObstacles: () => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  gameMode,
  onSelectGameMode,
  orientation,
  onToggleOrientation,
  tabletopFlipped,
  onToggleTabletopFlipped,
  isAiEnabled,
  onToggleAi,
  ballSpeedMultiplier,
  onChangeBallSpeed,
  hasObstacles,
  onToggleObstacles,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="settings-modal-card"
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Zap size={18} />
            </div>
            <h2 className="text-base font-bold text-slate-100">Game Setup & Rules</h2>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Game Modes */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Game Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="btn-mode-targets"
                onClick={() => onSelectGameMode('targets')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  gameMode === 'targets'
                    ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Target size={20} className="mb-1" />
                <span className="text-xs font-bold">Knockout</span>
                <span className="text-[10px] text-slate-500 leading-tight mt-0.5">Smash 5 pins</span>
              </button>

              <button
                id="btn-mode-dodgeball"
                onClick={() => onSelectGameMode('dodgeball')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  gameMode === 'dodgeball'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Shield size={20} className="mb-1" />
                <span className="text-xs font-bold">Dodgeball</span>
                <span className="text-[10px] text-slate-500 leading-tight mt-0.5">5 HP Duel</span>
              </button>

              <button
                id="btn-mode-goalrush"
                onClick={() => onSelectGameMode('goalrush')}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  gameMode === 'goalrush'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Trophy size={20} className="mb-1" />
                <span className="text-xs font-bold">Goal Rush</span>
                <span className="text-[10px] text-slate-500 leading-tight mt-0.5">First to 5</span>
              </button>
            </div>
          </div>

          {/* Opponent Type: 2-Player Local vs Solo AI */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Opponent
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-opp-twoplayer"
                onClick={() => isAiEnabled && onToggleAi()}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  !isAiEnabled
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Users size={16} />
                <span>Two Players (Local)</span>
              </button>

              <button
                id="btn-opp-ai"
                onClick={() => !isAiEnabled && onToggleAi()}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  isAiEnabled
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Bot size={16} />
                <span>Practice vs AI Bot</span>
              </button>
            </div>
          </div>

          {/* Screen Layout / Tabletop Options */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Orientation & Tabletop Mode
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl border border-slate-750">
                <div className="flex items-center gap-2.5">
                  <Smartphone size={16} className="text-cyan-400" />
                  <div>
                    <div className="text-xs font-medium text-slate-200">Layout Split</div>
                    <div className="text-[11px] text-slate-500">
                      {orientation === 'vertical' ? 'Top vs Bottom (Tabletop)' : 'Left vs Right (Side-by-Side)'}
                    </div>
                  </div>
                </div>
                <button
                  id="btn-toggle-layout"
                  onClick={onToggleOrientation}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                >
                  Switch
                </button>
              </div>

              {orientation === 'vertical' && (
                <div className="flex items-center justify-between p-2.5 bg-slate-800/50 rounded-xl border border-slate-750">
                  <div>
                    <div className="text-xs font-medium text-slate-200">Flip Player 2's Side 180°</div>
                    <div className="text-[11px] text-slate-500">
                      Rotates top player HUD for face-to-face table play
                    </div>
                  </div>
                  <button
                    id="btn-toggle-flip"
                    onClick={onToggleTabletopFlipped}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                      tabletopFlipped ? 'bg-orange-500 justify-end' : 'bg-slate-750 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ball Speed & Obstacles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Ball Velocity
              </label>
              <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
                {[
                  { label: 'Normal', val: 1.0 },
                  { label: 'Fast', val: 1.35 },
                  { label: 'Turbo', val: 1.65 },
                ].map((s) => (
                  <button
                    key={s.label}
                    onClick={() => onChangeBallSpeed(s.val)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
                      ballSpeedMultiplier === s.val
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Center Bumpers
              </label>
              <button
                id="btn-toggle-bumpers"
                onClick={onToggleObstacles}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-medium transition-colors flex items-center justify-between ${
                  hasObstacles
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <span>Bouncy Bumpers</span>
                <span className="font-bold text-[11px]">{hasObstacles ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* Quick How to Play Hint */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>🎯</span>
              <span>How to Throw:</span>
            </div>
            <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-0.5">
              <li>
                <strong className="text-slate-300">Slingshot:</strong> Touch and drag backward to aim, then release to launch!
              </li>
              <li>
                <strong className="text-slate-300">Direct Swipe:</strong> Flick finger quickly toward opponent to throw with velocity!
              </li>
              <li>
                <strong className="text-slate-300">Multi-Touch:</strong> Both players can throw balls simultaneously!
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            id="btn-save-settings"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all active:scale-98 shadow-lg shadow-cyan-500/20"
          >
            Play Now
          </button>
        </div>
      </div>
    </div>
  );
};
