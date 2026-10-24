import { describe, expect, it } from 'vitest';
import { parseRoomHash, type NewSeat } from '@/hook/useTurnRoom';
import { seatIndex, seatKey } from '@/types/turnRoom';

const parseNew = (p: URLSearchParams): NewSeat | null => {
  const side = p.get('new');
  if (side === 'black') return { seats: 2, seat: 0, setup: '', turn: 0 };
  if (side === 'white') return { seats: 2, seat: 1, setup: '', turn: 0 };
  return null;
};

describe('parseRoomHash', () => {
  it('開房交給各款的 parseNew', () => {
    expect(parseRoomHash('#new=white', parseNew)).toEqual({ create: { seats: 2, seat: 1, setup: '', turn: 0 } });
  });
  it('parseNew 看不懂就是壞掉的連結', () => {
    expect(parseRoomHash('#new=purple', parseNew)).toEqual({ invalid: true });
  });
  it('進房', () => {
    expect(parseRoomHash('#roomId=-Oabc123XYZ_def', parseNew)).toEqual({ roomId: '-Oabc123XYZ_def' });
  });
  it('房號格式不對、沒有 hash 都是壞掉的連結', () => {
    expect(parseRoomHash('#roomId=../x', parseNew)).toEqual({ invalid: true });
    expect(parseRoomHash('', parseNew)).toEqual({ invalid: true });
  });
});

describe('座位鍵', () => {
  it('s0..s7 跟座位編號互換', () => {
    for (let i = 0; i < 8; i++) expect(seatIndex(seatKey(i))).toBe(i);
  });
});
