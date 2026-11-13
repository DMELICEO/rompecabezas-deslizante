import React, { useState } from 'react';
import { ArrowRight, Image as ImageIcon, Hash, SlidersHorizontal } from 'lucide-react';
import { BUILTIN_GALLERY_IMAGES } from '../game/galleryPresets';
import { createSolvedBoard, slideTile } from '../game/puzzleLogic';

export type PuzzleMode = 'numbers' | 'photo';

interface TitleScreenProps {
  initialRows: number;
  initialCols: number;
  initialMode: PuzzleMode;
  onStart: (rows: number, cols: number, mode: PuzzleMode) => void;
}

const QUICK_SIZES: Array<{ label: string; cols: number; rows: number }> = [
  { label: '3 × 3', cols: 3, rows: 3 },
  { label: '4 × 4', cols: 4, rows: 4 },
  { label: '5 × 5', cols: 5, rows: 5 },
  { label: '4 × 3', cols: 4, rows: 3 },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  initialRows,
  initialCols,
  initialMode,
  onStart,
}) => {
  const [rows, setRows] = useState(initialRows);
  const [cols, setCols] = useState(initialCols);
  const [mode, setMode] = useState<PuzzleMode>(initialMode);
  const [previewBoard, setPreviewBoard] = useState<number[]>(() => {
    const b = createSolvedBoard(3, 3);
    const s1 = slideTile(b, 7, 3, 3);
    const s2 = s1 ? slideTile(s1.nextBoard, 4, 3, 3) : null;
    return s2 ? s2.nextBoard : b;
  });

  const handlePreviewSlide = (index: number) => {
    const res = slideTile(previewBoard, index, 3, 3);
    if (res) setPreviewBoard(res.nextBoard);
  };

  const previewImage = BUILTIN_GALLERY_IMAGES[0].src;

  return (
    <main className="min-h-screen w-full bg-[#F3F5F8] text-slate-900 flex flex-col justify-between px-6 py-8 md:px-12 md:py-10">
      <div className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left: Emblem, Title & Setup */}
        <section className="lg:col-span-7 flex flex-col gap-7">
          <div className="flex items-center gap-3.5">
            <svg
              viewBox="0 0 44 44"
              className="w-11 h-11 shrink-0"
              aria-hidden="true"
            >
              <rect
                x="2"
                y="2"
                width="40"
                height="40"
                rx="10"
                fill="#1E293B"
              />
              <rect x="7" y="7" width="13" height="13" rx="3" fill="#FFFFFF" />
              <rect x="24" y="7" width="13" height="13" rx="3" fill="#2563EB" />
              <rect x="7" y="24" width="13" height="13" rx="3" fill="#CBD5E1" />
              <rect
                x="24"
                y="24"
                width="13"
                height="13"
                rx="3"
                fill="#334155"
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </svg>
            <span className="font-display text-lg font-semibold tracking-tight text-slate-700">
              Cuadro
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.08] text-balance">
              Rompecabezas deslizante a tu medida
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Elige el ancho y alto del tablero, juega con números clásicos o con
              fotos de tu galería, retrocede jugadas y arma tus propias mezclas
              para practicar movimientos.
            </p>
          </div>

          {/* Mode & Size Quick Configuration */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800">
                Modo de juego
              </span>
              <div
                className="inline-flex p-1 bg-slate-100 rounded-xl"
                role="group"
                aria-label="Modo de juego"
              >
                <button
                  type="button"
                  onClick={() => setMode('numbers')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mode === 'numbers'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  Números
                </button>
                <button
                  type="button"
                  onClick={() => setMode('photo')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    mode === 'photo'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  Fotos de galería
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span>Tamaño inicial</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_SIZES.map((preset) => {
                  const active = rows === preset.rows && cols === preset.cols;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setRows(preset.rows);
                        setCols(preset.cols);
                      }}
                      className={`px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              data-start="true"
              onClick={() => onStart(rows, cols, mode)}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-display font-semibold text-base shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <span>Jugar ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-sm text-slate-500 tabular-nums">
              Tablero {cols} columnas × {rows} filas ·{' '}
              {rows * cols - 1} piezas
            </span>
          </div>
        </section>

        {/* Right: Interactive Centerpiece Preview */}
        <section
          className="lg:col-span-5 flex flex-col items-center justify-center"
          aria-label="Vista previa interactiva"
        >
          <div className="w-full max-w-[340px] bg-[#1E293B] p-3.5 rounded-3xl shadow-lg border border-slate-800">
            <div className="relative w-full aspect-square bg-[#0F172A] rounded-2xl overflow-hidden">
              {previewBoard.map((val, idx) => {
                if (val === 0) return null;
                const r = Math.floor(idx / 3);
                const c = idx % 3;
                const origR = Math.floor((val - 1) / 3);
                const origC = (val - 1) % 3;

                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePreviewSlide(idx)}
                    aria-label={`Deslizar pieza ${val} en vista previa`}
                    style={{
                      width: '33.3333%',
                      height: '33.3333%',
                      transform: `translate3d(${c * 100}%, ${r * 100}%, 0)`,
                    }}
                    className="puzzle-tile-motion absolute top-0 left-0 p-1 transition-transform duration-150 ease-out cursor-pointer focus-visible:outline-none"
                  >
                    {mode === 'numbers' ? (
                      <div
                        className={`w-full h-full rounded-xl flex items-center justify-center font-display text-2xl font-bold select-none shadow-xs border ${
                          val === idx + 1
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {val}
                      </div>
                    ) : (
                      <div
                        className="w-full h-full rounded-xl overflow-hidden border border-white/25 relative shadow-xs"
                        style={{
                          backgroundImage: `url(${previewImage})`,
                          backgroundSize: '300% 300%',
                          backgroundPosition: `${(origC / 2) * 100}% ${(origR / 2) * 100}%`,
                        }}
                      >
                        <span className="absolute top-1.5 left-1.5 text-[11px] font-mono font-semibold text-white bg-slate-900/65 px-1.5 py-0.5 rounded">
                          {val}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 text-center">
            Toca una pieza de muestra para deslizarla
          </p>
        </section>
      </div>

      <footer className="max-w-5xl w-full mx-auto pt-6 text-center text-xs text-slate-500">
        Clic o flechas para deslizar · Z retroceder · B barajar · P pausa
      </footer>
    </main>
  );
};
