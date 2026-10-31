import { describe, expect, it } from 'vitest';
import { readSoloHash, soloHash } from '@/components/bagh-chal/soloHash';

describe('Bagh Chal 單人網址的 hash', () => {
  it('寫出去再讀回來是同一組', () => {
    expect(readSoloHash(soloHash('goat', 'hard'))).toEqual({ side: 'goat', difficulty: 'hard' });
    expect(readSoloHash(soloHash('tiger', 'easy'))).toEqual({ side: 'tiger', difficulty: 'easy' });
  });

  it('不完整或亂寫的 hash 一律當作沒有（顯示選單），不猜', () => {
    for (const h of ['', '#', '#tiger', '#hard', '#lion-easy', '#tiger-impossible', '#tiger-easy-x']) {
      expect(readSoloHash(h)).toBeNull();
    }
  });
});
