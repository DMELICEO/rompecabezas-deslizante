export type ShuffleDepth = 'soft' | 'medium' | 'full';
export type SlideDirection = 'up' | 'down' | 'left' | 'right';

export interface SlideResult {
  nextBoard: number[];
  movedCount: number;
}

export const MIN_GRID_DIM = 2;
export const MAX_GRID_DIM = 8;

export function clampGridDimension(value: number): number {
  if (!Number.isFinite(value)) return 4;
  return Math.max(MIN_GRID_DIM, Math.min(MAX_GRID_DIM, Math.round(value)));
}

export function createSolvedBoard(rows: number, cols: number): number[] {
  const total = rows * cols;
  const board: number[] = new Array(total);
  for (let i = 0; i < total - 1; i++) {
    board[i] = i + 1;
  }
  board[total - 1] = 0;
  return board;
}

export function isSolved(board: readonly number[]): boolean {
  const total = board.length;
  if (total === 0) return false;
  for (let i = 0; i < total - 1; i++) {
    if (board[i] !== i + 1) return false;
  }
  return board[total - 1] === 0;
}

export function countCorrectTiles(board: readonly number[]): number {
  let count = 0;
  for (let i = 0; i < board.length - 1; i++) {
    if (board[i] === i + 1) {
      count++;
    }
  }
  return count;
}

export function countInversions(board: readonly number[]): number {
  let inversions = 0;
  for (let i = 0; i < board.length; i++) {
    const a = board[i];
    if (a === 0) continue;
    for (let j = i + 1; j < board.length; j++) {
      const b = board[j];
      if (b !== 0 && a > b) {
        inversions++;
      }
    }
  }
  return inversions;
}

/**
 * Generalized solvability check for any rows x cols sliding puzzle
 * where solved state has 0 at the bottom-right corner.
 * - Odd number of columns: solvable iff inversion count is even.
 * - Even number of columns: solvable iff (inversions + blankRowFromBottom) is odd,
 *   where blankRowFromBottom is 1-indexed from the bottom row.
 */
export function isSolvable(
  board: readonly number[],
  rows: number,
  cols: number,
): boolean {
  if (board.length !== rows * cols) return false;
  const blankIndex = board.indexOf(0);
  if (blankIndex === -1) return false;

  const inversions = countInversions(board);
  if (cols % 2 === 1) {
    return inversions % 2 === 0;
  }

  const blankRowFromTop = Math.floor(blankIndex / cols);
  const blankRowFromBottom = rows - blankRowFromTop;
  return (inversions + blankRowFromBottom) % 2 === 1;
}

/**
 * Returns a solvable copy of the board by swapping two non-zero tiles if needed.
 */
export function makeSolvable(
  board: readonly number[],
  rows: number,
  cols: number,
): number[] {
  const copy = [...board];
  if (isSolvable(copy, rows, cols)) {
    return copy;
  }

  let firstNonZero = -1;
  let secondNonZero = -1;
  for (let i = 0; i < copy.length; i++) {
    if (copy[i] !== 0) {
      if (firstNonZero === -1) {
        firstNonZero = i;
      } else {
        secondNonZero = i;
        break;
      }
    }
  }

  if (firstNonZero !== -1 && secondNonZero !== -1) {
    const temp = copy[firstNonZero];
    copy[firstNonZero] = copy[secondNonZero];
    copy[secondNonZero] = temp;
  }

  return copy;
}

export function canSlideTile(
  board: readonly number[],
  tileIndex: number,
  rows: number,
  cols: number,
): boolean {
  if (tileIndex < 0 || tileIndex >= board.length) return false;
  if (board[tileIndex] === 0) return false;
  const blankIndex = board.indexOf(0);
  if (blankIndex === -1) return false;

  const tileRow = Math.floor(tileIndex / cols);
  const tileCol = tileIndex % cols;
  const blankRow = Math.floor(blankIndex / cols);
  const blankCol = blankIndex % cols;

  if (tileRow < 0 || tileRow >= rows) return false;
  return tileRow === blankRow || tileCol === blankCol;
}

/**
 * Slides either a single adjacent tile or an entire row/column line of tiles
 * toward the empty space.
 */
export function slideTile(
  board: readonly number[],
  tileIndex: number,
  rows: number,
  cols: number,
): SlideResult | null {
  if (!canSlideTile(board, tileIndex, rows, cols)) return null;

  const blankIndex = board.indexOf(0);
  const tileRow = Math.floor(tileIndex / cols);
  const tileCol = tileIndex % cols;
  const blankRow = Math.floor(blankIndex / cols);
  const blankCol = blankIndex % cols;

  const nextBoard = [...board];
  let movedCount = 0;

  if (tileRow === blankRow) {
    const step = tileCol > blankCol ? 1 : -1;
    for (let c = blankCol; c !== tileCol; c += step) {
      const targetIdx = blankRow * cols + c;
      const sourceIdx = blankRow * cols + (c + step);
      nextBoard[targetIdx] = nextBoard[sourceIdx];
      movedCount++;
    }
    nextBoard[tileIndex] = 0;
  } else {
    const step = tileRow > blankRow ? 1 : -1;
    for (let r = blankRow; r !== tileRow; r += step) {
      const targetIdx = r * cols + blankCol;
      const sourceIdx = (r + step) * cols + blankCol;
      nextBoard[targetIdx] = nextBoard[sourceIdx];
      movedCount++;
    }
    nextBoard[tileIndex] = 0;
  }

  return { nextBoard, movedCount };
}

/**
 * Slides the tile adjacent to the blank space in the given movement direction.
 * For example, 'up' moves the tile BELOW the blank upward into the blank.
 */
export function slideByDirection(
  board: readonly number[],
  direction: SlideDirection,
  rows: number,
  cols: number,
): SlideResult | null {
  const blankIndex = board.indexOf(0);
  if (blankIndex === -1) return null;

  const blankRow = Math.floor(blankIndex / cols);
  const blankCol = blankIndex % cols;

  let sourceRow = blankRow;
  let sourceCol = blankCol;

  switch (direction) {
    case 'up':
      sourceRow = blankRow + 1;
      break;
    case 'down':
      sourceRow = blankRow - 1;
      break;
    case 'left':
      sourceCol = blankCol + 1;
      break;
    case 'right':
      sourceCol = blankCol - 1;
      break;
  }

  if (
    sourceRow < 0 ||
    sourceRow >= rows ||
    sourceCol < 0 ||
    sourceCol >= cols
  ) {
    return null;
  }

  const sourceIndex = sourceRow * cols + sourceCol;
  return slideTile(board, sourceIndex, rows, cols);
}

/**
 * Swaps any two positions on the board (used in custom practice arrangement mode).
 */
export function swapTilesArbitrary(
  board: readonly number[],
  indexA: number,
  indexB: number,
): number[] {
  if (
    indexA === indexB ||
    indexA < 0 ||
    indexB < 0 ||
    indexA >= board.length ||
    indexB >= board.length
  ) {
    return [...board];
  }
  const next = [...board];
  const temp = next[indexA];
  next[indexA] = next[indexB];
  next[indexB] = temp;
  return next;
}

export function getAdjacentIndices(
  index: number,
  rows: number,
  cols: number,
): number[] {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push((row - 1) * cols + col);
  if (row < rows - 1) neighbors.push((row + 1) * cols + col);
  if (col > 0) neighbors.push(row * cols + (col - 1));
  if (col < cols - 1) neighbors.push(row * cols + (col + 1));
  return neighbors;
}

/**
 * Generates a guaranteed-solvable, non-solved board configuration.
 * - 'soft': short random walk from solved state (ideal for quick practice).
 * - 'medium': moderate random walk from solved state.
 * - 'full': uniform Fisher-Yates permutation adjusted for solvability parity.
 */
export function shuffleBoard(
  rows: number,
  cols: number,
  depth: ShuffleDepth = 'full',
  rng: () => number = Math.random,
): number[] {
  const total = rows * cols;
  if (total < 4) return createSolvedBoard(rows, cols);

  if (depth === 'full') {
    const arr = createSolvedBoard(rows, cols);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }

    let solvable = makeSolvable(arr, rows, cols);
    if (isSolved(solvable)) {
      // Perform 2 non-trivial valid moves so we stay solvable and non-solved
      const blankIdx = solvable.indexOf(0);
      const adj = getAdjacentIndices(blankIdx, rows, cols);
      const firstSlide = slideTile(solvable, adj[0], rows, cols);
      if (firstSlide) {
        solvable = firstSlide.nextBoard;
      }
    }
    return solvable;
  }

  const stepCount =
    depth === 'soft'
      ? Math.max(6, Math.round(total * 0.75))
      : Math.max(16, total * 3);

  let board = createSolvedBoard(rows, cols);
  let blankIndex = board.indexOf(0);
  let prevBlankIndex = -1;

  for (let step = 0; step < stepCount; step++) {
    const neighbors = getAdjacentIndices(blankIndex, rows, cols).filter(
      (n) => n !== prevBlankIndex,
    );
    const pool =
      neighbors.length > 0
        ? neighbors
        : getAdjacentIndices(blankIndex, rows, cols);
    const pick = pool[Math.floor(rng() * pool.length)];

    const next = [...board];
    next[blankIndex] = next[pick];
    next[pick] = 0;

    prevBlankIndex = blankIndex;
    blankIndex = pick;
    board = next;
  }

  if (isSolved(board)) {
    const neighbors = getAdjacentIndices(blankIndex, rows, cols);
    const pick = neighbors[0];
    const next = [...board];
    next[blankIndex] = next[pick];
    next[pick] = 0;
    board = next;
  }

  return board;
}
