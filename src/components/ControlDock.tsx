import React, { useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Eye,
  Hash,
  Image as ImageIcon,
  Minus,
  Plus,
  RotateCcw,
  Shuffle,
  Sliders,
  Undo2,
  Upload,
  Wrench,
  Play,
  ArrowLeftRight,
  Move,
} from 'lucide-react';
import type { GalleryImageItem } from '../game/galleryPresets';
import {
  MAX_GRID_DIM,
  MIN_GRID_DIM,
  type ShuffleDepth,
} from '../game/puzzleLogic';
import type { PuzzleMode } from './TitleScreen';

interface ControlDockProps {
  rows: number;
  cols: number;
  mode: PuzzleMode;
  galleryItems: GalleryImageItem[];
  selectedPhotoId: string;
  showPhotoNumbers: boolean;
  showReferenceOverlay: boolean;
  canUndo: boolean;
  historyCount: number;
  shuffleDepth: ShuffleDepth;
  isCustomSetup: boolean;
  customInteraction: 'swap' | 'slide';
  customSolvable: boolean;
  hasPracticeCheckpoint: boolean;
  uploadError: string | null;
  onChangeDimensions: (newRows: number, newCols: number) => void;
  onChangeMode: (mode: PuzzleMode) => void;
  onSelectPhoto: (id: string) => void;
  onUploadPhoto: (file: File) => void;
  onTogglePhotoNumbers: () => void;
  onToggleReferenceOverlay: (active: boolean) => void;
  onUndo: () => void;
  onChangeShuffleDepth: (depth: ShuffleDepth) => void;
  onShuffle: (depth?: ShuffleDepth) => void;
  onEnterCustomSetup: () => void;
  onExitCustomSetup: (applyPractice: boolean) => void;
  onChangeCustomInteraction: (mode: 'swap' | 'slide') => void;
  onResetSolvedInSetup: () => void;
  onFixSolvability: () => void;
  onSoftPracticeScramble: () => void;
  onReplayPracticeCheckpoint: () => void;
}

const PRESET_GRIDS = [
  { label: '3×3', cols: 3, rows: 3 },
  { label: '4×4', cols: 4, rows: 4 },
  { label: '5×5', cols: 5, rows: 5 },
  { label: '4×3', cols: 4, rows: 3 },
  { label: '3×5', cols: 3, rows: 5 },
];

export const ControlDock: React.FC<ControlDockProps> = ({
  rows,
  cols,
  mode,
  galleryItems,
  selectedPhotoId,
  showPhotoNumbers,
  showReferenceOverlay,
  canUndo,
  historyCount,
  shuffleDepth,
  isCustomSetup,
  customInteraction,
  customSolvable,
  hasPracticeCheckpoint,
  uploadError,
  onChangeDimensions,
  onChangeMode,
  onSelectPhoto,
  onUploadPhoto,
  onTogglePhotoNumbers,
  onToggleReferenceOverlay,
  onUndo,
  onChangeShuffleDepth,
  onShuffle,
  onEnterCustomSetup,
  onExitCustomSetup,
  onChangeCustomInteraction,
  onResetSolvedInSetup,
  onFixSolvability,
  onSoftPracticeScramble,
  onReplayPracticeCheckpoint,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadPhoto(file);
    }
    e.target.value = '';
  };

  return (
    <aside
      aria-label="Controles del rompecabezas"
      className="w-full bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-5 shadow-xs"
    >
      {/* Section 1: Play Actions (Undo, Shuffle, Custom Practice) */}
      {!isCustomSetup ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              <span>Retroceder</span>
              {historyCount > 0 && (
                <span className="text-xs font-mono text-slate-500 tabular-nums">
                  ({historyCount})
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onShuffle()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="w-4 h-4" />
              <span>Barajar</span>
            </button>
          </div>

          {/* Shuffle depth selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-slate-500">
              Nivel de mezcla
            </span>
            <div
              className="inline-flex p-0.5 bg-slate-100 rounded-lg"
              role="group"
              aria-label="Nivel de mezcla"
            >
              {(
                [
                  { id: 'soft', label: 'Suave' },
                  { id: 'medium', label: 'Normal' },
                  { id: 'full', label: 'Completo' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onChangeShuffleDepth(item.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    shuffleDepth === item.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onEnterCustomSetup}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Barajar a tu gusto</span>
            </button>

            {hasPracticeCheckpoint && (
              <button
                type="button"
                onClick={onReplayPracticeCheckpoint}
                title="Volver a la posición inicial de práctica"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Repetir</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Custom Practice / Arrange Mode Dock */
        <div
          data-testid="custom-setup-panel"
          className="space-y-3.5 bg-blue-50/60 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-sm font-bold text-slate-900">
              Barajar a tu gusto
            </h2>
            <button
              type="button"
              onClick={() => onExitCustomSetup(false)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {customInteraction === 'swap'
              ? 'Toca dos piezas cualesquiera para intercambiarlas y armar la posición que quieras practicar.'
              : 'Desliza piezas libremente sin contar movimientos para preparar tu práctica.'}
          </p>

          {/* Interaction toggle: Swap vs Free Slide */}
          <div
            className="grid grid-cols-2 p-1 bg-white border border-slate-200 rounded-lg gap-1"
            role="group"
            aria-label="Forma de organizar"
          >
            <button
              type="button"
              onClick={() => onChangeCustomInteraction('swap')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                customInteraction === 'swap'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Intercambiar</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeCustomInteraction('slide')}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                customInteraction === 'slide'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>Deslizar libre</span>
            </button>
          </div>

          {/* Solvability feedback (Non-hue-only: icon + text) */}
          <div
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${
              customSolvable
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-1.5">
              {customSolvable ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                {customSolvable
                  ? 'Posición resoluble'
                  : 'Irresoluble (paridad)'}
              </span>
            </div>
            {!customSolvable && (
              <button
                type="button"
                onClick={onFixSolvability}
                className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ajustar
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onResetSolvedInSetup}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ordenar</span>
            </button>
            <button
              type="button"
              onClick={onSoftPracticeScramble}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Mezcla corta</span>
            </button>
          </div>

          <button
            type="button"
            disabled={!customSolvable}
            onClick={() => onExitCustomSetup(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Practicar desde aquí</span>
          </button>
        </div>
      )}

      <div className="h-px bg-slate-100" />

      {/* Section 2: Dimensions (Ancho x Alto) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Tamaño (Ancho × Alto)</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600 tabular-nums">
            {cols} × {rows}
          </span>
        </div>

        {/* Independent Cols (Ancho) & Rows (Alto) Steppers */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2">
            <span className="text-xs font-medium text-slate-600">Ancho</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Disminuir ancho"
                disabled={cols <= MIN_GRID_DIM}
                onClick={() => onChangeDimensions(rows, cols - 1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-mono font-semibold text-slate-900 tabular-nums">
                {cols}
              </span>
              <button
                type="button"
                aria-label="Aumentar ancho"
                disabled={cols >= MAX_GRID_DIM}
                onClick={() => onChangeDimensions(rows, cols + 1)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2">
            <span className="text-xs font-medium text-slate-600">Alto</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Disminuir alto"
                disabled={rows <= MIN_GRID_DIM}
                onClick={() => onChangeDimensions(rows - 1, cols)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center text-sm font-mono font-semibold text-slate-900 tabular-nums">
                {rows}
              </span>
              <button
                type="button"
                aria-label="Aumentar alto"
                disabled={rows >= MAX_GRID_DIM}
                onClick={() => onChangeDimensions(rows + 1, cols)}
                className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-35 cursor-pointer disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESET_GRIDS.map((p) => {
            const active = rows === p.rows && cols === p.cols;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => onChangeDimensions(p.rows, p.cols)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-100" />

      {/* Section 3: Mode (Numbers / Gallery Photos) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800">Piezas</span>
          <div
            className="inline-flex p-0.5 bg-slate-100 rounded-lg"
            role="group"
            aria-label="Tipo de piezas"
          >
            <button
              type="button"
              onClick={() => onChangeMode('numbers')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'numbers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              Números
            </button>
            <button
              type="button"
              onClick={() => onChangeMode('photo')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'photo'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Foto
            </button>
          </div>
        </div>

        {mode === 'photo' && (
          <div className="space-y-3 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Seleccionar foto de tu galería"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-50 text-blue-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Subir foto de tu galería</span>
            </button>

            {uploadError && (
              <p className="text-xs text-red-600 font-medium">{uploadError}</p>
            )}

            {/* Gallery Thumbnails */}
            <div
              className={`grid gap-2 ${
                galleryItems.length <= 3 ? 'grid-cols-3' : 'grid-cols-4'
              }`}
            >
              {galleryItems.map((item) => {
                const active = item.id === selectedPhotoId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectPhoto(item.id)}
                    aria-label={`Elegir imagen ${item.title}`}
                    title={item.title}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      active
                        ? 'border-blue-600 ring-2 ring-blue-600/20'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={item.src}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Imagen activa:{' '}
              <span className="font-medium text-slate-700">
                {galleryItems.find((g) => g.id === selectedPhotoId)?.title ?? ''}
              </span>
            </p>

            {/* Photo helpers: Number guide & Original image peek */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={onTogglePhotoNumbers}
                aria-pressed={showPhotoNumbers}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showPhotoNumbers
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Guía numérica</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleReferenceOverlay(!showReferenceOverlay)}
                aria-pressed={showReferenceOverlay}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  showReferenceOverlay
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Ver original</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
