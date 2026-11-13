import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { ControlDock } from './components/ControlDock';
import {
  PauseModal,
  VictoryModal,
  formatTime,
} from './components/GameModals';
import { PuzzleBoard } from './components/PuzzleBoard';
import { TitleScreen, type PuzzleMode } from './components/TitleScreen';
import {
  BUILTIN_GALLERY_IMAGES,
  cropImageToBoardAspect,
  readGalleryFileAsDataUrl,
  type GalleryImageItem,
} from './game/galleryPresets';
import {
  clampGridDimension,
  countCorrectTiles,
  createSolvedBoard,
  isSolved,
  isSolvable,
  makeSolvable,
  shuffleBoard,
  slideByDirection,
  slideTile,
  swapTilesArbitrary,
  type ShuffleDepth,
  type SlideDirection,
} from './game/puzzleLogic';
import {
  playShuffleSound,
  playSlideSound,
  playSwapSound,
  playUndoSound,
  playVictoryFanfare,
} from './game/soundEffects';

type GameState = 'title' | 'playing' | 'paused' | 'gameover';

const BEST_STORAGE_KEY = 'cuadro_best_moves_v1';

function loadBestRecords(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BEST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveBestRecord(key: string, moves: number): Record<string, number> {
  const current = loadBestRecords();
  const prev = current[key];
  if (prev === undefined || moves < prev) {
    const updated = { ...current, [key]: moves };
    try {
      localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors
    }
    return updated;
  }
  return current;
}

export default function App() {
  const initialAutostart = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  }, []);

  const [gameState, setGameState] = useState<GameState>(
    initialAutostart ? 'playing' : 'title',
  );
  const [rows, setRows] = useState<number>(4);
  const [cols, setCols] = useState<number>(4);
  const [mode, setMode] = useState<PuzzleMode>('numbers');

  const [board, setBoard] = useState<number[]>(() =>
    shuffleBoard(4, 4, 'medium'),
  );
  const [history, setHistory] = useState<number[][]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [shuffleDepth, setShuffleDepth] = useState<ShuffleDepth>('medium');
  const [muted, setMuted] = useState<boolean>(false);

  // Gallery / Photo state
  const [galleryItems, setGalleryItems] = useState<GalleryImageItem[]>(
    BUILTIN_GALLERY_IMAGES,
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState<string>(
    BUILTIN_GALLERY_IMAGES[0].id,
  );
  const [croppedPhotoSrc, setCroppedPhotoSrc] = useState<string>(
    BUILTIN_GALLERY_IMAGES[0].src,
  );
  const [showPhotoNumbers, setShowPhotoNumbers] = useState<boolean>(true);
  const [showReferenceOverlay, setShowReferenceOverlay] =
    useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Custom Practice / "Barajar a tu gusto" state
  const [isCustomSetup, setIsCustomSetup] = useState<boolean>(false);
  const [customInteraction, setCustomInteraction] = useState<'swap' | 'slide'>(
    'swap',
  );
  const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(
    null,
  );
  const [practiceCheckpoint, setPracticeCheckpoint] = useState<number[] | null>(
    null,
  );
  const [preSetupSnapshot, setPreSetupSnapshot] = useState<{
    board: number[];
    history: number[][];
    moves: number;
    elapsedSeconds: number;
  } | null>(null);

  // Best records & Victory frozen stats
  const [bestRecords, setBestRecords] = useState<Record<string, number>>(() =>
    loadBestRecords(),
  );
  const [victorySnapshot, setVictorySnapshot] = useState<{
    moves: number;
    elapsedSeconds: number;
    rows: number;
    cols: number;
  } | null>(null);

  // Sync game state to body attribute for testability and shell coherence
  useEffect(() => {
    document.body.dataset.state = gameState;
  }, [gameState]);

  // Crop selected photo whenever photo or grid dimensions change
  const activePhotoItem = useMemo(
    () =>
      galleryItems.find((g) => g.id === selectedPhotoId) ?? galleryItems[0],
    [galleryItems, selectedPhotoId],
  );

  useEffect(() => {
    let cancelled = false;
    cropImageToBoardAspect(activePhotoItem.src, cols, rows).then((cropped) => {
      if (!cancelled) {
        setCroppedPhotoSrc(cropped);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activePhotoItem.src, cols, rows]);

  // Gameplay timer
  useEffect(() => {
    if (gameState !== 'playing' || !timerRunning || isCustomSetup) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [gameState, timerRunning, isCustomSetup]);

  const recordKey = `${rows}x${cols}`;
  const bestMoves = bestRecords[recordKey] ?? null;

  const triggerVictory = useCallback(
    (finalMoves: number) => {
      setTimerRunning(false);
      setVictorySnapshot({
        moves: finalMoves,
        elapsedSeconds,
        rows,
        cols,
      });
      setBestRecords(saveBestRecord(`${rows}x${cols}`, finalMoves));
      setGameState('gameover');
      playVictoryFanfare(muted);
    },
    [cols, elapsedSeconds, muted, rows],
  );

  const startFromTitle = useCallback(
    (nextRows: number, nextCols: number, nextMode: PuzzleMode) => {
      const r = clampGridDimension(nextRows);
      const c = clampGridDimension(nextCols);
      setRows(r);
      setCols(c);
      setMode(nextMode);
      setBoard(shuffleBoard(r, c, shuffleDepth));
      setHistory([]);
      setMoves(0);
      setElapsedSeconds(0);
      setTimerRunning(false);
      setIsCustomSetup(false);
      setSelectedSwapIndex(null);
      setPracticeCheckpoint(null);
      setShowReferenceOverlay(false);
      setVictorySnapshot(null);
      setGameState('playing');
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      playShuffleSound(muted);
    },
    [muted, shuffleDepth],
  );

  const handleShuffle = useCallback(
    (depthOverride?: ShuffleDepth) => {
      const targetDepth = depthOverride ?? shuffleDepth;
      setBoard(shuffleBoard(rows, cols, targetDepth));
      setHistory([]);
      setMoves(0);
      setElapsedSeconds(0);
      setTimerRunning(false);
      setIsCustomSetup(false);
      setSelectedSwapIndex(null);
      setShowReferenceOverlay(false);
      setVictorySnapshot(null);
      setGameState('playing');
      playShuffleSound(muted);
    },
    [cols, muted, rows, shuffleDepth],
  );

  const handleChangeDimensions = useCallback(
    (newRows: number, newCols: number) => {
      const r = clampGridDimension(newRows);
      const c = clampGridDimension(newCols);
      if (r === rows && c === cols) return;
      setRows(r);
      setCols(c);
      setBoard(shuffleBoard(r, c, shuffleDepth));
      setHistory([]);
      setMoves(0);
      setElapsedSeconds(0);
      setTimerRunning(false);
      setIsCustomSetup(false);
      setSelectedSwapIndex(null);
      setPracticeCheckpoint(null);
      setShowReferenceOverlay(false);
      playShuffleSound(muted);
    },
    [cols, muted, rows, shuffleDepth],
  );

  const handleTileClick = useCallback(
    (index: number) => {
      if (gameState !== 'playing' || showReferenceOverlay) return;

      if (isCustomSetup) {
        if (customInteraction === 'swap') {
          if (selectedSwapIndex === null) {
            setSelectedSwapIndex(index);
          } else if (selectedSwapIndex === index) {
            setSelectedSwapIndex(null);
          } else {
            setBoard((prev) => swapTilesArbitrary(prev, selectedSwapIndex, index));
            setSelectedSwapIndex(null);
            playSwapSound(muted);
          }
          return;
        }

        // Free slide inside custom setup
        const res = slideTile(board, index, rows, cols);
        if (res) {
          setBoard(res.nextBoard);
          playSlideSound(muted, res.movedCount);
        }
        return;
      }

      const result = slideTile(board, index, rows, cols);
      if (!result) return;

      const nextMoves = moves + 1;
      setHistory((prev) => [...prev, board]);
      setBoard(result.nextBoard);
      setMoves(nextMoves);
      if (!timerRunning) setTimerRunning(true);
      playSlideSound(muted, result.movedCount);

      if (isSolved(result.nextBoard)) {
        triggerVictory(nextMoves);
      }
    },
    [
      board,
      cols,
      customInteraction,
      gameState,
      isCustomSetup,
      moves,
      muted,
      rows,
      selectedSwapIndex,
      showReferenceOverlay,
      timerRunning,
      triggerVictory,
    ],
  );

  const handleSwipeOrKeyDirection = useCallback(
    (dir: SlideDirection) => {
      if (gameState !== 'playing' || showReferenceOverlay) return;
      if (isCustomSetup && customInteraction === 'swap') return;

      const result = slideByDirection(board, dir, rows, cols);
      if (!result) return;

      if (isCustomSetup) {
        setBoard(result.nextBoard);
        playSlideSound(muted, 1);
        return;
      }

      const nextMoves = moves + 1;
      setHistory((prev) => [...prev, board]);
      setBoard(result.nextBoard);
      setMoves(nextMoves);
      if (!timerRunning) setTimerRunning(true);
      playSlideSound(muted, 1);

      if (isSolved(result.nextBoard)) {
        triggerVictory(nextMoves);
      }
    },
    [
      board,
      cols,
      customInteraction,
      gameState,
      isCustomSetup,
      moves,
      muted,
      rows,
      showReferenceOverlay,
      timerRunning,
      triggerVictory,
    ],
  );

  const handleUndo = useCallback(() => {
    if (gameState !== 'playing' || isCustomSetup || history.length === 0) {
      return;
    }
    const previousBoard = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBoard(previousBoard);
    setMoves((prev) => Math.max(0, prev - 1));
    playUndoSound(muted);
  }, [gameState, history, isCustomSetup, muted]);

  const handleEnterCustomSetup = useCallback(() => {
    setPreSetupSnapshot({
      board,
      history,
      moves,
      elapsedSeconds,
    });
    setTimerRunning(false);
    setSelectedSwapIndex(null);
    setShowReferenceOverlay(false);
    setIsCustomSetup(true);
  }, [board, elapsedSeconds, history, moves]);

  const handleExitCustomSetup = useCallback(
    (applyPractice: boolean) => {
      if (!applyPractice) {
        if (preSetupSnapshot) {
          setBoard(preSetupSnapshot.board);
          setHistory(preSetupSnapshot.history);
          setMoves(preSetupSnapshot.moves);
          setElapsedSeconds(preSetupSnapshot.elapsedSeconds);
        }
        setIsCustomSetup(false);
        setSelectedSwapIndex(null);
        setPreSetupSnapshot(null);
        return;
      }

      if (!isSolvable(board, rows, cols)) return;

      // If user left the board completely solved, nudge one soft shuffle step or allow?
      // Better: if solved, keep it playable by making 1 quick valid move? No, let's check:
      // Actually if solved, warn or gently slide once so they have at least 1 move to practice.
      let practiceStart = [...board];
      if (isSolved(practiceStart)) {
        const res = slideByDirection(practiceStart, 'right', rows, cols);
        if (res) practiceStart = res.nextBoard;
      }

      setBoard(practiceStart);
      setPracticeCheckpoint(practiceStart);
      setHistory([]);
      setMoves(0);
      setElapsedSeconds(0);
      setTimerRunning(false);
      setIsCustomSetup(false);
      setSelectedSwapIndex(null);
      setPreSetupSnapshot(null);
      playShuffleSound(muted);
    },
    [board, cols, muted, preSetupSnapshot, rows],
  );

  const handleReplayPracticeCheckpoint = useCallback(() => {
    if (!practiceCheckpoint) return;
    setBoard([...practiceCheckpoint]);
    setHistory([]);
    setMoves(0);
    setElapsedSeconds(0);
    setTimerRunning(false);
    setIsCustomSetup(false);
    setSelectedSwapIndex(null);
    setVictorySnapshot(null);
    setGameState('playing');
    playShuffleSound(muted);
  }, [muted, practiceCheckpoint]);

  const handleUploadPhoto = useCallback(async (file: File) => {
    setUploadError(null);
    try {
      const dataUrl = await readGalleryFileAsDataUrl(file);
      const id = `upload_${Date.now()}`;
      const title = file.name.replace(/\.[^/.]+$/, '') || 'Foto propia';
      setGalleryItems((prev) => [
        { id, title, src: dataUrl, isUserUpload: true },
        ...prev,
      ]);
      setSelectedPhotoId(id);
      setMode('photo');
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'No se pudo cargar la foto.',
      );
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (gameState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startFromTitle(rows, cols, mode);
        }
        return;
      }

      if (gameState === 'paused') {
        if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          setGameState('playing');
        }
        return;
      }

      if (gameState === 'gameover') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleShuffle();
        }
        return;
      }

      // Active playing shortcuts
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setGameState('paused');
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMuted((prev) => !prev);
        return;
      }

      if ((e.key === 'z' || e.key === 'Z') && !isCustomSetup) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((e.key === 'b' || e.key === 'B') && !isCustomSetup) {
        e.preventDefault();
        handleShuffle();
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleSwipeOrKeyDirection('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleSwipeOrKeyDirection('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleSwipeOrKeyDirection('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleSwipeOrKeyDirection('right');
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    cols,
    gameState,
    handleShuffle,
    handleSwipeOrKeyDirection,
    handleUndo,
    isCustomSetup,
    mode,
    rows,
    startFromTitle,
  ]);

  if (gameState === 'title') {
    return (
      <TitleScreen
        initialRows={rows}
        initialCols={cols}
        initialMode={mode}
        onStart={startFromTitle}
      />
    );
  }

  const totalTiles = rows * cols - 1;
  const correctCount = countCorrectTiles(board);
  const customSolvable = isSolvable(board, rows, cols);

  return (
    <div className="min-h-screen w-full bg-[#F3F5F8] text-slate-900 flex flex-col">
      {/* Compact Game Shell HUD Strip */}
      <header className="w-full border-b border-slate-200/90 bg-white/90 px-3 sm:px-8 py-2.5 sm:py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setGameState('title');
              }}
              aria-label="Volver al menú principal"
              className="inline-flex items-center gap-2 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 rounded-lg"
            >
              <svg
                viewBox="0 0 36 36"
                className="w-8 h-8 shrink-0"
                aria-hidden="true"
              >
                <rect
                  x="1"
                  y="1"
                  width="34"
                  height="34"
                  rx="8"
                  fill="#1E293B"
                />
                <rect x="6" y="6" width="10" height="10" rx="2" fill="#FFFFFF" />
                <rect
                  x="20"
                  y="6"
                  width="10"
                  height="10"
                  rx="2"
                  fill="#2563EB"
                />
                <rect
                  x="6"
                  y="20"
                  width="10"
                  height="10"
                  rx="2"
                  fill="#CBD5E1"
                />
              </svg>
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                Cuadro
              </span>
            </button>

            <span className="hidden sm:inline text-slate-300" aria-hidden="true">
              ·
            </span>
            <span className="hidden sm:inline text-xs font-medium text-slate-500 tabular-nums">
              {cols} × {rows}
              {isCustomSetup
                ? ' · Editando mezcla'
                : practiceCheckpoint
                  ? ' · Práctica'
                  : ''}
            </span>
          </div>

          {/* Primary Tabular Readouts */}
          <div className="flex items-center gap-3.5 sm:gap-7">
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Movs
              </div>
              <div
                data-testid="hud-moves"
                className="font-mono text-base sm:text-xl font-semibold text-slate-900 tabular-nums leading-tight"
              >
                {moves}
              </div>
            </div>

            <div className="text-center sm:text-left">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Tiempo
              </div>
              <div
                data-testid="hud-time"
                className="font-mono text-base sm:text-xl font-semibold text-slate-900 tabular-nums leading-tight"
              >
                {formatTime(elapsedSeconds)}
              </div>
            </div>

            <div className="hidden sm:block text-left">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                En sitio
              </div>
              <div
                data-testid="hud-correct"
                className="font-mono text-lg sm:text-xl font-semibold text-blue-700 tabular-nums leading-tight"
              >
                {correctCount}/{totalTiles}
              </div>
            </div>

            {bestMoves !== null && (
              <div className="hidden md:block text-left">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Récord ({cols}×{rows})
                </div>
                <div className="font-mono text-lg sm:text-xl font-semibold text-emerald-700 tabular-nums leading-tight">
                  {bestMoves}
                </div>
              </div>
            )}
          </div>

          {/* Utility Icon Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setMuted((prev) => !prev);
              }}
              aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
              title={muted ? 'Activar sonido (M)' : 'Silenciar (M)'}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.currentTarget.blur();
                setGameState('paused');
              }}
              aria-label="Pausar partida"
              title="Pausa (P)"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Play Workspace */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 lg:gap-10 items-start">
        {/* Dominant Centerpiece Board */}
        <section
          aria-label="Tablero del rompecabezas"
          className="w-full flex flex-col items-center justify-center lg:pt-2"
        >
          <PuzzleBoard
            board={board}
            rows={rows}
            cols={cols}
            mode={mode}
            photoSrc={croppedPhotoSrc}
            showPhotoNumbers={showPhotoNumbers}
            showReferenceOverlay={showReferenceOverlay}
            isCustomSetup={isCustomSetup}
            customInteraction={customInteraction}
            selectedSwapIndex={selectedSwapIndex}
            onTileClick={handleTileClick}
            onSwipeDirection={handleSwipeOrKeyDirection}
          />
          <p className="mt-3.5 text-xs text-slate-500 text-center">
            {isCustomSetup
              ? 'Modo mezcla libre activo · Los movimientos de preparación no suman al contador'
              : 'Toca o desliza una pieza hacia el hueco · Usa las flechas o Z para retroceder'}
          </p>
        </section>

        {/* Unified Control Dock */}
        <ControlDock
          rows={rows}
          cols={cols}
          mode={mode}
          galleryItems={galleryItems}
          selectedPhotoId={selectedPhotoId}
          showPhotoNumbers={showPhotoNumbers}
          showReferenceOverlay={showReferenceOverlay}
          canUndo={history.length > 0 && !isCustomSetup}
          historyCount={history.length}
          shuffleDepth={shuffleDepth}
          isCustomSetup={isCustomSetup}
          customInteraction={customInteraction}
          customSolvable={customSolvable}
          hasPracticeCheckpoint={practiceCheckpoint !== null}
          uploadError={uploadError}
          onChangeDimensions={handleChangeDimensions}
          onChangeMode={(nextMode) => {
            setMode(nextMode);
            setShowReferenceOverlay(false);
          }}
          onSelectPhoto={(id) => {
            setSelectedPhotoId(id);
            setShowReferenceOverlay(false);
          }}
          onUploadPhoto={handleUploadPhoto}
          onTogglePhotoNumbers={() => setShowPhotoNumbers((prev) => !prev)}
          onToggleReferenceOverlay={(active) => setShowReferenceOverlay(active)}
          onUndo={handleUndo}
          onChangeShuffleDepth={(d) => setShuffleDepth(d)}
          onShuffle={handleShuffle}
          onEnterCustomSetup={handleEnterCustomSetup}
          onExitCustomSetup={handleExitCustomSetup}
          onChangeCustomInteraction={(modeVal) => {
            setCustomInteraction(modeVal);
            setSelectedSwapIndex(null);
          }}
          onResetSolvedInSetup={() => {
            setBoard(createSolvedBoard(rows, cols));
            setSelectedSwapIndex(null);
            playShuffleSound(muted);
          }}
          onFixSolvability={() => {
            setBoard((prev) => makeSolvable(prev, rows, cols));
            setSelectedSwapIndex(null);
            playSwapSound(muted);
          }}
          onSoftPracticeScramble={() => {
            setBoard(shuffleBoard(rows, cols, 'soft'));
            setSelectedSwapIndex(null);
            playShuffleSound(muted);
          }}
          onReplayPracticeCheckpoint={handleReplayPracticeCheckpoint}
        />
      </main>

      {gameState === 'paused' && (
        <PauseModal
          onResume={() => setGameState('playing')}
          onRestart={() => handleShuffle()}
          onTitle={() => {
            setTimerRunning(false);
            setGameState('title');
          }}
        />
      )}

      {gameState === 'gameover' && victorySnapshot && (
        <VictoryModal
          moves={victorySnapshot.moves}
          elapsedSeconds={victorySnapshot.elapsedSeconds}
          rows={victorySnapshot.rows}
          cols={victorySnapshot.cols}
          bestMoves={bestMoves}
          hasPracticeCheckpoint={practiceCheckpoint !== null}
          onPlayAgain={() => handleShuffle()}
          onReplayPractice={handleReplayPracticeCheckpoint}
          onEditPractice={() => {
            setVictorySnapshot(null);
            setGameState('playing');
            handleEnterCustomSetup();
          }}
        />
      )}
    </div>
  );
}
