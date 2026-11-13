import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canSlideTile,
  countCorrectTiles,
  createSolvedBoard,
  isSolved,
  isSolvable,
  makeSolvable,
  shuffleBoard,
  slideByDirection,
  slideTile,
  swapTilesArbitrary,
} from './puzzleLogic';

test('createSolvedBoard builds valid square and rectangular solved grids', () => {
  assert.deepEqual(createSolvedBoard(3, 3), [1, 2, 3, 4, 5, 6, 7, 8, 0]);
  assert.deepEqual(createSolvedBoard(2, 4), [1, 2, 3, 4, 5, 6, 7, 0]);
  assert.equal(isSolved(createSolvedBoard(4, 3)), true);
  assert.equal(countCorrectTiles(createSolvedBoard(3, 4)), 11);
});

test('isSolvable distinguishes solvable vs unsolvable parity for odd & even columns', () => {
  // 3x3 (odd cols): swap 1 and 2 -> 1 inversion -> unsolvable
  const solved3x3 = createSolvedBoard(3, 3);
  assert.equal(isSolvable(solved3x3, 3, 3), true);
  assert.equal(isSolvable([2, 1, 3, 4, 5, 6, 7, 8, 0], 3, 3), false);

  // 4x4 (even cols): swap 14 and 15 -> 1 inversion with blank on bottom row -> unsolvable
  const solved4x4 = createSolvedBoard(4, 4);
  assert.equal(isSolvable(solved4x4, 4, 4), true);
  const unsolvable4x4 = [...solved4x4];
  [unsolvable4x4[13], unsolvable4x4[14]] = [unsolvable4x4[14], unsolvable4x4[13]];
  assert.equal(isSolvable(unsolvable4x4, 4, 4), false);

  // 3x4 rectangular (even cols)
  const solved3x4 = createSolvedBoard(3, 4);
  assert.equal(isSolvable(solved3x4, 3, 4), true);
  const unsolvable3x4 = swapTilesArbitrary(solved3x4, 0, 1);
  assert.equal(isSolvable(unsolvable3x4, 3, 4), false);

  // 4x3 rectangular (odd cols)
  const solved4x3 = createSolvedBoard(4, 3);
  assert.equal(isSolvable(solved4x3, 4, 3), true);
  const unsolvable4x3 = swapTilesArbitrary(solved4x3, 0, 1);
  assert.equal(isSolvable(unsolvable4x3, 4, 3), false);
});

test('makeSolvable repairs any unsolvable board', () => {
  const dimensions: Array<[number, number]> = [
    [2, 2],
    [3, 3],
    [4, 4],
    [3, 4],
    [4, 3],
    [5, 6],
  ];

  for (const [r, c] of dimensions) {
    const solved = createSolvedBoard(r, c);
    const broken = swapTilesArbitrary(solved, 0, 1);
    assert.equal(isSolvable(broken, r, c), false);
    const fixed = makeSolvable(broken, r, c);
    assert.equal(isSolvable(fixed, r, c), true);
  }
});

test('slideTile supports single and multi-tile row/column slides', () => {
  // 3x3 solved: blank is at index 8 (row 2, col 2)
  const board = createSolvedBoard(3, 3);
  assert.equal(canSlideTile(board, 0, 3, 3), false);
  assert.equal(canSlideTile(board, 6, 3, 3), true); // same row (row 2)
  assert.equal(canSlideTile(board, 2, 3, 3), true); // same col (col 2)

  // Slide entire bottom row right-to-left by clicking index 6 (value 7)
  const rowSlide = slideTile(board, 6, 3, 3);
  assert.ok(rowSlide);
  assert.equal(rowSlide.movedCount, 2);
  assert.deepEqual(rowSlide.nextBoard, [1, 2, 3, 4, 5, 6, 0, 7, 8]);
  assert.equal(isSolvable(rowSlide.nextBoard, 3, 3), true);

  // Slide entire col 0 downward by clicking index 0 (value 1)
  const colSlide = slideTile(rowSlide.nextBoard, 0, 3, 3);
  assert.ok(colSlide);
  assert.equal(colSlide.movedCount, 2);
  assert.deepEqual(colSlide.nextBoard, [0, 2, 3, 1, 5, 6, 4, 7, 8]);
  assert.equal(isSolvable(colSlide.nextBoard, 3, 3), true);
});

test('slideByDirection moves adjacent tile cleanly into the blank', () => {
  const solved = createSolvedBoard(3, 3);
  // Slide 'right' moves tile left of blank (index 7, value 8) right into blank
  const r1 = slideByDirection(solved, 'right', 3, 3);
  assert.ok(r1);
  assert.deepEqual(r1.nextBoard, [1, 2, 3, 4, 5, 6, 7, 0, 8]);

  // Reverse via 'left' returns to solved
  const r2 = slideByDirection(r1.nextBoard, 'left', 3, 3);
  assert.ok(r2);
  assert.equal(isSolved(r2.nextBoard), true);

  // Moving 'up' when blank is on bottom row is invalid
  assert.equal(slideByDirection(solved, 'up', 3, 3), null);
});

test('shuffleBoard always generates valid, non-solved, solvable boards across dimensions', () => {
  const sizes: Array<[number, number]> = [
    [2, 3],
    [3, 3],
    [3, 4],
    [4, 4],
    [5, 4],
    [6, 6],
  ];
  const depths = ['soft', 'medium', 'full'] as const;

  for (const [r, c] of sizes) {
    for (const depth of depths) {
      const shuffled = shuffleBoard(r, c, depth);
      assert.equal(shuffled.length, r * c);
      assert.equal(isSolved(shuffled), false);
      assert.equal(isSolvable(shuffled, r, c), true);
      // Verify exact set of tile numbers 0..r*c-1
      const sorted = [...shuffled].sort((a, b) => a - b);
      assert.deepEqual(
        sorted,
        Array.from({ length: r * c }, (_, i) => i),
      );
    }
  }
});
