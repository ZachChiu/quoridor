import { GOLD, INK } from './theme';

/**
 * 時間拍賣的動作（Zach 10/24：學 Wall Go 補上「棋子之間的互動」，但要各自設計）。
 *
 * 這款沒有棋盤上的棋子，場上的「棋子」是大螢幕（拍賣官的鐘）、競買人名片與得標的金幣，所以互動是：
 * - 成交：木槌落下的那一下，大螢幕往下一沉；一枚金幣從大螢幕拋到得標者的名片上，落下時名片上的數字才加一、成交章跟著蓋下去。
 *   流標就只有大螢幕左右晃一下，沒有金幣。
 * - 等待：你已經放手、在等最後一個人的時候，電腦的名片偶爾動一下 —— 互相瞄一眼（一張往旁邊那張探過去、那張往後縮）、
 *   調整一下坐姿（微微歪一下）。**跟誰還按著無關**（全是亂數），不洩漏任何資訊；你按著或還沒開始時一律不動（不打擾正在決定的人）。
 *
 * 全部是 WAAPI、只動 translate／scale／rotate 這幾個獨立屬性（不蓋掉元素本來的 transform）與 opacity，顏色只有 theme.ts 的金與墨。
 * 減少動態效果時呼叫端不呼叫這裡（reducedMotion）。
 */

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const busy = (el: Element) => el.getAnimations().length > 0;

/** 木槌落下：大螢幕往下一沉、微微壓扁再彈回 */
export function thud(el: HTMLElement) {
  el.animate([
    { translate: '0 0', scale: '1' },
    { translate: '0 4px', scale: '1.02 0.96', offset: 0.22 },
    { translate: '0 -1px', scale: '0.995 1.01', offset: 0.6 },
    { translate: '0 0', scale: '1' },
  ], { duration: 320, easing: 'ease-out' });
}

/** 流標：大螢幕左右晃一下（像拍賣官搖頭） */
export function shake(el: HTMLElement) {
  el.animate([
    { translate: '0 0' }, { translate: '-5px 0', offset: 0.2 }, { translate: '4px 0', offset: 0.45 },
    { translate: '-2px 0', offset: 0.7 }, { translate: '0 0' },
  ], { duration: 380, easing: 'ease-in-out' });
}

/** 放手：按鈕彈起來一點再落定 */
export function springUp(el: HTMLElement) {
  el.animate([{ scale: '0.985' }, { scale: '1.015', offset: 0.45 }, { scale: '1' }], { duration: 240, easing: 'ease-out' });
}

/** 時間用完、按鈕自己彈起：左右震幾下（節目裡按鈕會震動） */
export function buzzShake(el: HTMLElement) {
  el.animate([
    { translate: '0 0' }, { translate: '-4px 0', offset: 0.12 }, { translate: '4px 0', offset: 0.25 }, { translate: '-4px 0', offset: 0.38 },
    { translate: '4px 0', offset: 0.5 }, { translate: '-2px 0', offset: 0.7 }, { translate: '0 0' },
  ], { duration: 420, easing: 'linear' });
}

/** 金幣飛的時間（毫秒）。音效的金幣聲（sounds.ts 的 soldYou）也在這一下響 */
export const COIN_MS = 440;

/**
 * 一枚得標的金幣從 from（大螢幕）拋到 to（得標者名片上的數字）。金色圓片、墨色雙線的邊（跟拍品票同一種線）。
 * 掛在 body 上、fixed 定位，飛完自己移除；落下時呼叫 onLand（名片上的數字加一、跳一下）。
 */
export function flyCoin(from: HTMLElement, to: HTMLElement, onLand: () => void) {
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const size = 22;
  const x0 = a.left + a.width / 2 - size / 2, y0 = a.top + a.height * 0.35 - size / 2;
  const dx = b.left + b.width / 2 - size / 2 - x0, dy = b.top + b.height / 2 - size / 2 - y0;
  const coin = document.createElement('span');
  coin.setAttribute('aria-hidden', 'true');
  Object.assign(coin.style, {
    position: 'fixed', left: `${x0}px`, top: `${y0}px`, width: `${size}px`, height: `${size}px`, zIndex: '50',
    borderRadius: '50%', background: GOLD, pointerEvents: 'none',
    boxShadow: `inset 0 0 0 1.5px ${INK}, inset 0 0 0 4px ${GOLD}, inset 0 0 0 5px rgb(53 51 28 / 0.5)`,
  });
  document.body.appendChild(coin);
  // 拋物線：先往上拋（最高點在中間、比兩端高 70px），落下時縮小一點點
  const lift = Math.min(70, Math.abs(dy) * 0.5 + 30);
  const anim = coin.animate([
    { translate: '0 0', scale: '0.6', opacity: 0 },
    { translate: `${dx * 0.12}px ${dy * 0.12 - lift * 0.45}px`, scale: '1.1', opacity: 1, offset: 0.12 },
    { translate: `${dx * 0.5}px ${dy * 0.5 - lift}px`, scale: '1.25', opacity: 1, offset: 0.5 },
    { translate: `${dx}px ${dy}px`, scale: '0.8', opacity: 1, offset: 0.92 },
    { translate: `${dx}px ${dy}px`, scale: '0.6', opacity: 0 },
  ], { duration: COIN_MS, easing: 'cubic-bezier(0.3, 0, 0.6, 1)' });
  const done = () => { coin.remove(); onLand(); };
  anim.onfinish = done;
  anim.oncancel = done;
}

/** 名片上的數字收到金幣：跳一下 */
export function pop(el: HTMLElement) {
  el.animate([{ scale: '1' }, { scale: '1.45', offset: 0.35 }, { scale: '1' }], { duration: 300, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.3)' });
}

/**
 * 等待中的電腦名片（只在你已經放手、還在跑秒時由呼叫端定時呼叫）。cards 是電腦那幾張名片，照座位排好。
 * 六成是兩張相鄰的互相瞄一眼，其餘是一張自己調整坐姿。
 */
export function idleBidders(cards: HTMLElement[]) {
  const free = cards.filter((el) => !busy(el));
  if (!free.length) return;
  const i = cards.indexOf(pick(free));
  const j = i + (Math.random() < 0.5 ? -1 : 1);
  const other = cards[j];
  if (other && !busy(other) && Math.random() < 0.6) {
    // 互相瞄一眼：一張往對方探過去、歪一點；對方慢半拍往後縮一下又回來
    const dir = j > i ? 1 : -1;
    cards[i].animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: `${dir * 4}px -1px`, rotate: `${dir * 1.5}deg`, offset: 0.3 },
      { translate: `${dir * 4}px -1px`, rotate: `${dir * 1.5}deg`, offset: 0.65 },
      { translate: '0 0', rotate: '0deg' },
    ], { duration: 1100, easing: 'ease-in-out' });
    other.animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: `${dir * 3}px 0`, rotate: `${dir * -1}deg`, offset: 0.4 },
      { translate: '0 0', rotate: '0deg' },
    ], { duration: 700, delay: 280, easing: 'ease-in-out' });
    return;
  }
  // 自己調整坐姿：左右各歪一下
  cards[i].animate([
    { rotate: '0deg' }, { rotate: '-1.4deg', offset: 0.3 }, { rotate: '1deg', offset: 0.65 }, { rotate: '0deg' },
  ], { duration: 900, easing: 'ease-in-out' });
}
