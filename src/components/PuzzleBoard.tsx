import React, { useRef } from 'react';
import { Eye } from 'lucide-react';
import { canSlideTile } from '../game/puzzleLogic';
import type { PuzzleMode } from './TitleScreen';

interface PuzzleBoardProps {
  board: number[];
  rows: number;
  cols: number;
  mode: PuzzleMode;
  photoSrc: string;
  showPhotoNumbers: boolean;
  showReferenceOverlay: boolean;
  isCustomSetup: boolean;
  customInteraction: 'swap' | 'slide';
  selectedSwapIndex: number | null;
  onTileClick: (index: number) => void;
  onSwipeDirection: (dir: 'up' | 'down' | 'left' | 'right') => void;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  board,
  rows,
  cols,
  mode,
  photoSrc,
  showPhotoNumbers,
  showReferenceOverlay,
  isCustomSetup,
  customInteraction,
  selectedSwapIndex,
  onTileClick,
  onSwipeDirection,
}) => {
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeHandledRef = useRef(false);

  // Scale board width proportionally so tall grids don't overflow vertically
  // and 2x2 grids stay pleasantly compact.
  const maxDim = Math.max(rows, cols);
  const idealBase = Math.min(540, Math.max(310, maxDim * 92));
  const boardMaxWidth = Math.round(
    cols >= rows ? idealBase : idealBase * (cols / rows),
  );

  // Tile typography scale adapts smoothly from 2x2 up to 8x8
  const tileFontClass =
    maxDim <= 3
      ? 'text-3xl sm:text-4xl'
      : maxDim === 4
        ? 'text-2xl sm:text-3xl'
        : maxDim === 5
          ? 'text-xl sm:text-2xl'
          : maxDim === 6
            ? 'text-lg sm:text-xl'
            : 'text-sm sm:text-base';

  const gapPaddingClass = maxDim >= 6 ? 'p-[2px]' : 'p-[3px]';
  const tileRadiusClass = maxDim >= 6 ? 'rounded-md' : 'rounded-xl';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isCustomSetup && customInteraction === 'swap') return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    swipeHandledRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerStartRef.current || swipeHandledRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const threshold = 26;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      swipeHandledRef.current = true;
      pointerStartRef.current = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        onSwipeDirection(dx > 0 ? 'right' : 'left');
      } else {
        onSwipeDirection(dy > 0 ? 'down' : 'up');
      }
    }
  };

  const handlePointerUp = () => {
    pointerStartRef.current = null;
  };

  const blankIndex = board.indexOf(0);
  const blankRow = Math.floor(blankIndex / cols);
  const blankCol = blankIndex % cols;

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div
        className={`w-full bg-[#1E293B] p-2.5 sm:p-3.5 rounded-2xl sm:rounded-3xl shadow-md border transition-colors ${
          isCustomSetup
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-800'
        }`}
        style={{ maxWidth: `${boardMaxWidth}px` }}
      >
        <div
          data-testid="puzzle-grid"
          data-rows={rows}
          data-cols={cols}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ aspectRatio: `${cols} / ${rows}` }}
          className="relative w-full bg-[#0F172A] rounded-xl overflow-hidden touch-none select-none"
        >
          {/* In custom swap mode, render clickable blank slot so user can place empty spot anywhere */}
          {isCustomSetup && customInteraction === 'swap' && blankIndex !== -1 && (
            <button
              type="button"
              onClick={() => onTileClick(blankIndex)}
              aria-label="Espacio vacío (tocar para intercambiar)"
              style={{
                width: `${100 / cols}%`,
                height: `${100 / rows}%`,
                transform: `translate3d(${blankCol * 100}%, ${blankRow * 100}%, 0)`,
              }}
              className={`absolute top-0 left-0 ${gapPaddingClass} cursor-pointer focus-visible:outline-none`}
            >
              <div
                className={`w-full h-full ${tileRadiusClass} border-2 border-dashed flex items-center justify-center text-xs font-medium transition-colors ${
                  selectedSwapIndex === blankIndex
                    ? 'border-blue-400 bg-blue-500/25 text-blue-100'
                    : 'border-slate-600/80 bg-slate-800/40 text-slate-400 hover:border-slate-400'
                }`}
              >
                Vacío
              </div>
            </button>
          )}

          {/* Render tiles keyed by their stable numeric ID so CSS transform glides smoothly */}
          {Array.from({ length: rows * cols - 1 }, (_, i) => i + 1).map(
            (tileValue) => {
              const currentIndex = board.indexOf(tileValue);
              if (currentIndex === -1) return null;

              const row = Math.floor(currentIndex / cols);
              const col = currentIndex % cols;

              const origIndex = tileValue - 1;
              const origRow = Math.floor(origIndex / cols);
              const origCol = origIndex % cols;

              const isHome = currentIndex === origIndex;
              const isMovable = canSlideTile(board, currentIndex, rows, cols);
              const isSwapSelected =
                isCustomSetup &&
                customInteraction === 'swap' &&
                selectedSwapIndex === currentIndex;

              const canClick =
                isCustomSetup && customInteraction === 'swap' ? true : isMovable;

              const bgPosX = cols > 1 ? (origCol / (cols - 1)) * 100 : 0;
              const bgPosY = rows > 1 ? (origRow / (rows - 1)) * 100 : 0;

              return (
                <button
                  key={tileValue}
                  type="button"
                  data-tile-value={tileValue}
                  data-tile-index={currentIndex}
                  disabled={!canClick}
                  onClick={() => {
                    if (swipeHandledRef.current) {
                      swipeHandledRef.current = false;
                      return;
                    }
                    onTileClick(currentIndex);
                  }}
                  aria-label={
                    isCustomSetup && customInteraction === 'swap'
                      ? `Seleccionar pieza ${tileValue} para intercambiar`
                      : `Deslizar pieza ${tileValue}`
                  }
                  style={{
                    width: `${100 / cols}%`,
                    height: `${100 / rows}%`,
                    transform: `translate3d(${col * 100}%, ${row * 100}%, 0)`,
                  }}
                  className={`puzzle-tile-motion absolute top-0 left-0 ${gapPaddingClass} transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:z-20 ${
                    canClick ? 'cursor-pointer' : 'cursor-default'
                  } ${isSwapSelected ? 'z-20' : 'z-10'}`}
                >
                  {mode === 'numbers' ? (
                    <div
                      className={`w-full h-full ${tileRadiusClass} flex items-center justify-center font-display font-bold tabular-nums select-none border transition-colors ${tileFontClass} ${
                        isSwapSelected
                          ? 'bg-blue-600 text-white border-blue-300 ring-2 ring-blue-300 scale-[0.96]'
                          : isHome
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-white text-slate-900 border-slate-200/90 hover:bg-slate-50'
                      }`}
                    >
                      {tileValue}
                    </div>
                  ) : (
                    <div
                      className={`w-full h-full ${tileRadiusClass} relative overflow-hidden border transition-all ${
                        isSwapSelected
                          ? 'ring-3 ring-blue-400 border-blue-300 scale-[0.95]'
                          : isHome
                            ? 'border-emerald-300/70'
                            : 'border-white/25'
                      }`}
                      style={{
                        backgroundImage: `url(${photoSrc})`,
                        backgroundSize: `${cols * 100}% ${rows * 100}%`,
                        backgroundPosition: `${bgPosX}% ${bgPosY}%`,
                        backgroundRepeat: 'no-repeat',
                      }}
                    >
                      {showPhotoNumbers && (
                        <span
                          className={`absolute top-1 left-1 leading-none font-mono font-semibold text-white bg-slate-950/70 rounded px-1.5 py-0.5 ${
                            maxDim >= 6 ? 'text-[10px]' : 'text-xs'
                          }`}
                        >
                          {tileValue}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            },
          )}

          {/* Reference Image Overlay (Photo Mode) */}
          {mode === 'photo' && showReferenceOverlay && (
            <div className="absolute inset-0 z-30 bg-slate-950/90 flex items-center justify-center p-1">
              <img
                src={photoSrc}
                alt="Vista de imagen completa"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-slate-900/85 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                <Eye className="w-3.5 h-3.5" />
                <span>Imagen original</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
