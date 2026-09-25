/**
 * 轉場色塊的關鍵影格。
 *
 * 轉場原本用 anime.js 每一格在主執行緒上算縮放、寫進 style。換頁那一刻 React
 * 也在主執行緒上渲染新頁面，兩者搶同一條執行緒，手機上就會掉格（Zach 回報從
 * 大改版起就卡，模擬器量不出來 —— 它用的是 Mac 的 GPU）。
 *
 * 改用瀏覽器原生的 Web Animations API：transform 的動畫交給合成執行緒（GPU）跑，
 * 主執行緒再忙也不影響。代價是不能每格用 JS 算「圖示反向縮放 1/s」，
 * 所以這裡事先把整段曲線取樣成關鍵影格，色塊與圖示用同一組 offset。
 * 取樣點之間是線性內插：色塊線性、圖示的 1/s 也線性，兩者相乘不會剛好是 1，
 * 但取樣夠密時誤差在 1% 以內（測試鎖著）。
 */

export type Ease = (t: number) => number;

/** anime.js 的 inOut(3)：三次方緩入緩出 */
export const inOutCubic: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** anime.js 的 out(3)：三次方緩出 */
export const outCubic: Ease = (t) => 1 - (1 - t) ** 3;

/** 同樣兩條曲線的 CSS 版本，給只需要一條緩動的屬性（圓角、透明度） */
export const CSS_IN_OUT_CUBIC = 'cubic-bezier(0.65, 0, 0.35, 1)';

/**
 * 圖示反向縮放的上限。s 趨近 0 時 1/s 會爆掉；那時色塊只剩原本的 5%，
 * 圖示本來就幾乎看不見了。
 */
export const MAX_COUNTER = 20;

export const counterScale = (s: number) => Math.min(1 / Math.max(s, 1e-4), MAX_COUNTER);

/**
 * 色塊從 from 縮放到 to 的關鍵影格，以及圖示同步的反向縮放。
 * 兩組的 offset 完全一致，瀏覽器在同一個時間點內插，才對得上。
 *
 * 取樣點不是均勻的：誤差取決於相鄰兩點「縮放的比例」，而色塊縮到很小時
 * （例如從 0.26 到 0.2）比例很大，均勻取樣再密也壓不下來。所以先均勻取樣，
 * 再把比例超過 MAX_RATIO 的區間對半切，直到夠細為止。
 */
const MAX_RATIO = 1.08;
/** 小於這個縮放就不再細分：色塊只剩這麼小時圖示早就被吃光了 */
const MIN_REFINE = 0.05;

export function scaleKeyframes(from: number, to: number, ease: Ease, samples = 48) {
  const at = (t: number) => from + (to - from) * ease(t);
  const offsets: number[] = [];
  const push = (t0: number, t1: number, depth: number) => {
    const [a, b] = [at(t0), at(t1)];
    const lo = Math.min(a, b);
    if (depth < 8 && lo > MIN_REFINE && Math.max(a, b) / lo > MAX_RATIO) {
      const mid = (t0 + t1) / 2;
      push(t0, mid, depth + 1);
      push(mid, t1, depth + 1);
    } else {
      offsets.push(t1);
    }
  };
  offsets.push(0);
  for (let i = 0; i < samples; i++) push(i / samples, (i + 1) / samples, 0);

  const shape: Keyframe[] = [];
  const face: Keyframe[] = [];
  for (const offset of offsets) {
    const s = at(offset);
    shape.push({ offset, transform: `scale(${s})` });
    face.push({ offset, transform: `scale(${counterScale(s)})` });
  }
  return { shape, face };
}
