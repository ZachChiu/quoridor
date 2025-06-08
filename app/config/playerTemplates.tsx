import { Player } from "@/types/chessboard"

export const openingStepTwo: Player[] = ['A', 'B', 'B', 'A'];

export const openingStepThree: Player[] = ['A', 'B', 'C', 'C', 'B', 'A'];

export const turnOrderTwo: Player[] = ['A', 'B'];

export const turnOrderThree: Player[] = ['A', 'B', 'C'];

export const templateBoardTwo: Player[][] = [
  [null, null, null, null, null, null, null],
  [null, 'A', null, null, null, 'B', null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, 'B', null, null, null, 'A', null],
  [null, null, null, null, null, null, null],
];

export const templateBoardThree: Player[][] = [
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
];

export const templateVerticalWalls: (Player | null)[][] = [
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
];

export const templateHorizontalWalls: (Player | null)[][] = [
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null],
];

const playerTemplates = {
  openingStepTwo,
  openingStepThree,
  templateBoardTwo,
  templateBoardThree,
  templateVerticalWalls,
  templateHorizontalWalls,
  turnOrderTwo,
  turnOrderThree
};

export default playerTemplates;