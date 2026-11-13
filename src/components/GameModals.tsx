import React from 'react';
import { Award, Play, RotateCcw, Home, Shuffle } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onTitle: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onTitle,
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="space-y-1">
          <h2
            id="pause-modal-title"
            className="font-display text-2xl font-bold text-slate-900"
          >
            Juego en pausa
          </h2>
          <p className="text-sm text-slate-600">
            El cronómetro está detenido. Puedes continuar cuando quieras.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Continuar</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Barajar de nuevo</span>
          </button>

          <button
            type="button"
            onClick={onTitle}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-sm transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Menú inicial</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface VictoryModalProps {
  moves: number;
  elapsedSeconds: number;
  rows: number;
  cols: number;
  bestMoves: number | null;
  hasPracticeCheckpoint: boolean;
  onPlayAgain: () => void;
  onReplayPractice: () => void;
  onEditPractice: () => void;
}

export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  moves,
  elapsedSeconds,
  rows,
  cols,
  bestMoves,
  hasPracticeCheckpoint,
  onPlayAgain,
  onReplayPractice,
  onEditPractice,
}) => {
  const isNewRecord = bestMoves !== null && moves <= bestMoves;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="victory-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2
              id="victory-modal-title"
              className="font-display text-2xl font-bold text-slate-900"
            >
              ¡Rompecabezas completado!
            </h2>
            <p className="text-sm text-slate-600">
              {isNewRecord
                ? 'Nuevo mejor puntaje en este tamaño.'
                : 'Todas las piezas están en su lugar.'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* 3 tabular-nums mastery stat tiles */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Movimientos
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {moves}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Tiempo
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {formatTime(elapsedSeconds)}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Tablero
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {cols}×{rows}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>Jugar otra vez</span>
          </button>

          {hasPracticeCheckpoint && (
            <button
              type="button"
              onClick={onReplayPractice}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Repetir misma práctica</span>
            </button>
          )}

          <button
            type="button"
            onClick={onEditPractice}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            <span>Armar nueva mezcla personalizada</span>
          </button>
        </div>
      </div>
    </div>
  );
};
