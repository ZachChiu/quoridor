import { describe, expect, it } from 'vitest';
import { counterScale, inOutCubic, MAX_COUNTER, outCubic, scaleKeyframes } from '@/components/wipeKeyframes';

const num = (t: string | number | null | undefined) => Number(String(t).match(/scale\(([^)]+)\)/)![1]);

describe('wipeKeyframes', () => {
  it('緩動曲線頭尾正確（跟 anime.js 的 inOut(3)／out(3) 一樣）', () => {
    for (const e of [inOutCubic, outCubic]) {
      expect(e(0)).toBe(0);
      expect(e(1)).toBe(1);
    }
    expect(inOutCubic(0.5)).toBeCloseTo(0.5);
    expect(outCubic(0.5)).toBeCloseTo(0.875);
  });

  it('色塊與圖示的 offset 完全一致，頭尾是指定的起訖值', () => {
    const { shape, face } = scaleKeyframes(1, 40, inOutCubic);
    expect(shape.map((k) => k.offset)).toEqual(face.map((k) => k.offset));
    expect(num(shape[0].transform as string)).toBe(1);
    expect(num(shape.at(-1)!.transform as string)).toBe(40);
  });

  it('取樣點之間的線性內插，色塊 × 圖示仍在 1 的 1% 以內（色塊還看得見的範圍）', () => {
    for (const [from, to, ease] of [[1, 40, inOutCubic], [40, 0, outCubic]] as const) {
      const { shape, face } = scaleKeyframes(from, to, ease);
      for (let i = 0; i < shape.length - 1; i++) {
        const [a, b] = [num(shape[i].transform as string), num(shape[i + 1].transform as string)];
        const [fa, fb] = [num(face[i].transform as string), num(face[i + 1].transform as string)];
        if (Math.min(a, b) < 0.2) continue; // 色塊只剩 20% 以下時圖示幾乎被吃光
        const mid = ((a + b) / 2) * ((fa + fb) / 2);
        expect(Math.abs(mid - 1)).toBeLessThan(0.01);
      }
    }
  });

  it('反向縮放有上限，s 趨近 0 不會爆', () => {
    expect(counterScale(0)).toBe(MAX_COUNTER);
    expect(counterScale(2)).toBe(0.5);
  });
});
