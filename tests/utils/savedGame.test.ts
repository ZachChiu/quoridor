import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearSavedGame, loadSavedGame, saveGame, savedGameKey } from '@/utils/savedGame';

describe('savedGame（重整後接回棋局的暫存）', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  it('本機與各難度、人數各自一把鑰匙，不會互相覆蓋', () => {
    const keys = [savedGameKey(2, null), savedGameKey(3, null), savedGameKey(2, 'easy'), savedGameKey(2, 'hard')];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('存、讀、清', () => {
    const m = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v), removeItem: (k: string) => m.delete(k) });
    const k = savedGameKey(2, null);
    saveGame(k, '2|x|y|z');
    expect(loadSavedGame(k)).toBe('2|x|y|z');
    clearSavedGame(k);
    expect(loadSavedGame(k)).toBeNull();
  });

  it('無痕模式或封鎖網站資料時存取會丟錯 —— 當作沒有暫存，不讓遊戲壞掉', () => {
    const boom = () => { throw new Error('SecurityError'); };
    vi.stubGlobal('sessionStorage', { getItem: boom, setItem: boom, removeItem: boom });
    const k = savedGameKey(2, null);
    expect(() => saveGame(k, 'x')).not.toThrow();
    expect(loadSavedGame(k)).toBeNull();
    expect(() => clearSavedGame(k)).not.toThrow();
  });
});
