import { colOf, rowOf, type Square } from '@/games/knights-tour/engine';

/**
 * 騎士巡遊的棋盤動作（Zach 10/24：學 Wall Go 補上棋子的互動，但各自設計）。這款只有一顆騎士，所以互動是騎士跟棋盤：
 *
 * - 跳（10/25 Zach：「也許可以有跳過去的動畫」—— 先前那版只在棋盤平面上滑一道弧，看起來不像跳）：
 *   蹲一下蓄力 → 離地，沿著往 L 轉角彎的弧線（先走兩格那一邊、再拐一格）過去，同時往上拋起一個拋物線的高度，
 *   上升時鼻子朝上、下降時朝下、在最高點最大；腳下一團斜線排線的影子（銅版畫的投影）留在棋盤上跟著走，
 *   騎士越高影子越小越淡 → 落地壓扁、彈一下站好。同時紅粉筆從上一格畫到這一格，上一格的步數在騎士離開時才寫上去，
 *   新的落點在騎士落地那一刻才一顆顆冒出來。
 *   **不擋操作**：狀態在點下去那一下就換好了，動畫只是把騎士從上一格「送」過去；騎士與影子不吃點擊（pointer-events-none），
 *   飛過別的格子時點擊照樣落在底下那一格。還在空中就點下一步，新的這一跳從剛剛那一格起跳（上一跳直接收掉）。
 *   落地在 LAND × JUMP_MS ≈ 220ms，節目挑戰在計時，不能讓玩家等騎士。
 * - 放下騎士：從上面落下來、影子跟著變大，落地壓扁再彈一下。
 * - 走完：步數照 1、2、3… 的順序一格一格跳一下（像歐拉那張表從頭念一遍），最後騎士揚起前腳；
 *   封閉巡遊接回起點的那段虛線這時才淡淡浮出來。
 * - 走錯（節目挑戰踩到走過的格子）：騎士往那一格探過去、縮回來搖頭；卡住沒路可走就原地左右張望。
 * - 閒著：玩家一陣子（3.5–6.5 秒）沒動，騎士轉頭望向一個跳得到的格子、那個圓點跟著輕輕脹一下；有時候用前蹄刨地。
 *   只是隨機挑一個合法的格子，不是提示。
 *
 * 騎士面向前進的方向（往左跳就整隻翻過來，TourBoard 的 data-face）：揚蹄、刨地、鼻子朝上朝下這些有方向的轉動都乘上它。
 * 全部是 WAAPI、只動 translate／rotate／scale／opacity（紅粉筆的線是 stroke-dashoffset），不加顏色；關鍵影格事先算好，
 * 不每格用 JS 寫 style。開了「減少動態效果」就一個都不播，騎士直接出現在新的格子。
 * translate 的百分比是相對騎士自己（knightArt.ts 的 KNIGHT_SIZE）；縮放與轉動的中心在騎士腳下（壓扁時腳不離地）。
 */

/** 跳一步要多久（含落地壓扁、回彈）；走完的琶音、結算的時間都從這裡算 */
export const JUMP_MS = 320;
/** 蹲下蓄力結束、離地的那一刻（整段的比例） */
const TAKEOFF = 0.08;
/** 落地的那一刻（整段的比例）：紅粉筆在這時畫到、新的落點從這時冒出來 */
const LAND = 0.7;
/** 空中取樣幾點（關鍵影格之間是直線內插，取樣夠密就看不出折角） */
const AIR_SAMPLES = 12;
/** 走完之後的整段（步數念一遍、騎士揚蹄）要多久：結算的分享圖等它播完才出來 */
export const finaleMs = (squares: number) => (reducedMotion() ? 450 : JUMP_MS + Math.min(640, squares * 16) + 520);

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cellEl = (root: HTMLElement, sq: Square) => root.querySelector<HTMLElement>(`[data-cell="${sq}"]`);
const knightEl = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-knight]');
const shadowEl = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-knight-shadow]');
/** 騎士面向哪邊：1 是右、-1 是左（TourBoard 依最後一步的方向設定） */
const faceOf = (knight: HTMLElement) => (knight.dataset.face === '-1' ? -1 : 1);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const px = (x: number, y: number) => `${x.toFixed(1)}px ${y.toFixed(1)}px`;
/** 從 a 指向 b 的單位向量（格子座標） */
const toward = (n: number, a: Square, b: Square) => {
  const x = colOf(n, b) - colOf(n, a), y = rowOf(n, b) - rowOf(n, a);
  const len = Math.hypot(x, y) || 1;
  return { x: x / len, y: y / len };
};

/** 剛走了一步（path 的最後一格是新的）。走完的話接著播 finale */
export function animateStep(root: HTMLElement, n: number, path: readonly Square[], closed: boolean) {
  if (reducedMotion()) return;
  const cur = path[path.length - 1];
  const knight = knightEl(root);
  const shadow = shadowEl(root);
  if (knight) {
    if (path.length === 1) {
      // 放下騎士：從上面掉下來（越掉越快），影子從小、淡變大、變深，落地壓扁再彈一下
      knight.animate([
        { opacity: 0, translate: '0 -45%', scale: '1.2', easing: 'cubic-bezier(0.5, 0, 1, 1)' },
        { opacity: 1, translate: '0 0', scale: '1.16 0.8', offset: 0.55, easing: 'ease-out' },
        { translate: '0 0', scale: '0.95 1.06', offset: 0.78, easing: 'ease-in-out' },
        { translate: '0 0', scale: '1' },
      ], { duration: JUMP_MS });
      shadow?.animate([
        { opacity: 0, scale: '0.45' },
        { opacity: 1, scale: '1', offset: 0.55, easing: 'ease-out' },
        { opacity: 0, scale: '1.15' },
      ], { duration: JUMP_MS });
    } else {
      const prev = path[path.length - 2];
      jump(root, knight, shadow, n, prev, cur);
      // 上一格的步數在騎士離開時才寫上
      cellEl(root, prev)?.querySelector('[data-num]')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: TAKEOFF * JUMP_MS + 30, fill: 'backwards' });
    }
  }
  // 新的落點在落地那一刻才冒出來
  root.querySelectorAll('[data-dot]').forEach((dot, i) => {
    dot.animate([{ opacity: 0, scale: '0.3' }, { opacity: 1, scale: '1' }], { duration: 180, delay: LAND * JUMP_MS + i * 25, easing: 'ease-out', fill: 'backwards' });
  });
  if (path.length === n * n) finale(root, n, path, closed);
}

/**
 * 從 prev 跳到 cur。騎士已經畫在 cur 那一格了，所以影格是「從 prev 的位置（相對位移）回到 0」。
 * 影格事先算好交給 WAAPI，播放時不用 JS 逐格寫 style。
 */
function jump(root: HTMLElement, knight: HTMLElement, shadow: HTMLElement | null, n: number, prev: Square, cur: Square) {
  const size = root.clientWidth / n;
  const dx = (colOf(n, prev) - colOf(n, cur)) * size;
  const dy = (rowOf(n, prev) - rowOf(n, cur)) * size;
  // L 的轉角（相對終點）：先走兩格的那一邊，再拐一格。棋盤上的軌跡是以轉角為控制點的二次貝茲曲線，騎士就沿著「日」字彎過去
  const vertical = Math.abs(dy) > Math.abs(dx);
  const kx = vertical ? dx : 0, ky = vertical ? 0 : dy;
  const ground = (s: number) => ({
    x: (1 - s) ** 2 * dx + 2 * (1 - s) * s * kx,
    y: (1 - s) ** 2 * dy + 2 * (1 - s) * s * ky,
  });
  /** 跳多高：半格 */
  const height = size * 0.5;
  const f = faceOf(knight);

  // 騎士：蹲 → 空中（水平等速、高度是拋物線） → 落地壓扁 → 回彈
  const frames: Keyframe[] = [
    { offset: 0, translate: px(dx, dy), scale: '1', rotate: '0deg' },
    { offset: TAKEOFF, translate: px(dx, dy), scale: '1.12 0.84', rotate: `${-3 * f}deg` },
  ];
  // 影子：留在棋盤上跟著軌跡走，騎士越高越小越淡
  const shade: Keyframe[] = [
    { offset: 0, translate: px(dx, dy), scale: '0.9', opacity: 0 },
    { offset: TAKEOFF, translate: px(dx, dy), scale: '1', opacity: 1 },
  ];
  for (let i = 1; i <= AIR_SAMPLES; i++) {
    const s = i / AIR_SAMPLES;
    const g = ground(s);
    const arc = Math.sin(Math.PI * s);
    const lift = 4 * height * s * (1 - s);
    // 離地與落地前速度最快：順著上下拉長一點；越高越大（離眼睛越近）
    const stretch = 1 + 0.1 * Math.abs(1 - 2 * s);
    const grow = 1 + 0.14 * arc;
    const offset = TAKEOFF + s * (LAND - TAKEOFF);
    frames.push({
      offset,
      translate: px(g.x, g.y - lift),
      scale: `${(grow / stretch).toFixed(3)} ${(grow * stretch).toFixed(3)}`,
      // 上升時鼻子朝上、下降時朝下
      rotate: `${(f * 10 * (2 * s - 1)).toFixed(1)}deg`,
    });
    shade.push({ offset, translate: px(g.x, g.y), scale: (1 - 0.35 * arc).toFixed(3), opacity: +(1 - 0.5 * arc).toFixed(3) });
  }
  frames.push(
    { offset: LAND + 0.1, translate: '0px 0px', scale: '1.16 0.8', rotate: '0deg' },
    { offset: LAND + 0.2, translate: '0px 0px', scale: '0.96 1.05', rotate: '0deg' },
    { offset: 1, translate: '0px 0px', scale: '1', rotate: '0deg' },
  );
  shade.push(
    { offset: LAND + 0.12, translate: '0px 0px', scale: '1.15', opacity: 0 },
    { offset: 1, translate: '0px 0px', scale: '1', opacity: 0 },
  );
  knight.animate(frames, { duration: JUMP_MS, easing: 'linear' });
  shadow?.animate(shade, { duration: JUMP_MS, easing: 'linear' });

  // 紅粉筆跟著畫過去：離地開始畫、落地畫到
  const line = root.querySelector<SVGElement>('[data-last]');
  const len = line?.getAttribute('stroke-dasharray')?.split(' ')[0];
  if (line && len) {
    line.animate([{ strokeDashoffset: len }, { strokeDashoffset: '0' }],
      { duration: (LAND - TAKEOFF) * JUMP_MS, delay: TAKEOFF * JUMP_MS, easing: 'ease-in-out', fill: 'backwards' });
  }
}

/** 走完：步數照順序一格一格跳一下，騎士揚起前腳，封閉巡遊的虛線淡入 */
function finale(root: HTMLElement, n: number, path: readonly Square[], closed: boolean) {
  const step = Math.min(16, 640 / path.length);
  path.forEach((sq, i) => {
    cellEl(root, sq)?.querySelector('[data-num]')?.animate(
      [{ scale: '1' }, { scale: '1.35', offset: 0.35 }, { scale: '1' }],
      { duration: 320, delay: JUMP_MS + i * step, easing: 'ease-out' },
    );
  });
  const end = JUMP_MS + path.length * step;
  const knight = knightEl(root);
  // 揚起前腳：以腳下為軸往後仰（面向右是逆時針）
  const f = knight ? faceOf(knight) : 1;
  knight?.animate([
    { translate: '0 0', rotate: '0deg' },
    { translate: '0 -14%', rotate: `${-14 * f}deg`, offset: 0.35, easing: 'ease-out' },
    { translate: '0 -14%', rotate: `${-10 * f}deg`, offset: 0.55 },
    { translate: '0 0', rotate: `${3 * f}deg`, offset: 0.8 },
    { translate: '0 0', rotate: '0deg' },
  ], { duration: 620, delay: end, easing: 'ease-in-out' });
  if (closed) root.querySelector('[data-close]')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: end, fill: 'backwards' });
}

/** 走錯了：failed 是騎士所在的格子（卡住）就原地張望；是別的格子（踩到走過的格子）就探過去、縮回來搖頭 */
export function animateFail(root: HTMLElement, n: number, knightAt: Square, failed: Square, delay = 0) {
  if (reducedMotion()) return;
  const knight = knightEl(root);
  if (!knight) return;
  const shake: Keyframe[] = [
    { rotate: '0deg' }, { rotate: '-13deg', offset: 0.2 }, { rotate: '11deg', offset: 0.45 }, { rotate: '-7deg', offset: 0.7 }, { rotate: '0deg' },
  ];
  if (failed === knightAt) {
    knight.animate(shake, { duration: 760, delay, easing: 'ease-in-out' });
    return;
  }
  const v = toward(n, knightAt, failed);
  knight.animate([
    { translate: '0 0', scale: '1' },
    { translate: `${(v.x * 26).toFixed(1)}% ${(v.y * 26).toFixed(1)}%`, scale: '1.08', offset: 0.35, easing: 'ease-in' },
    { translate: '0 0', scale: '0.94', offset: 0.6, easing: 'ease-out' },
    { translate: '0 0', scale: '1' },
  ], { duration: 460, delay, easing: 'ease-out' });
  knight.animate(shake, { duration: 640, delay: delay + 460, easing: 'ease-in-out' });
}

/** 閒著的時候：望向一個跳得到的格子（那個圓點輕輕脹一下），或用前蹄刨地 */
export function idleGlance(root: HTMLElement, n: number, at: Square, targets: readonly Square[]) {
  const knight = knightEl(root);
  if (!knight || knight.getAnimations().length) return;
  const f = faceOf(knight);
  if (!targets.length || Math.random() < 0.25) {
    // 前蹄刨地：前半身抬一下、放下，兩次
    knight.animate([
      { translate: '0 0', rotate: '0deg' },
      { translate: '0 -7%', rotate: `${-6 * f}deg`, offset: 0.2 }, { translate: '0 0', rotate: '0deg', offset: 0.4 },
      { translate: '0 -5%', rotate: `${-4 * f}deg`, offset: 0.6 }, { translate: '0 0', rotate: '0deg' },
    ], { duration: 780, easing: 'ease-in-out' });
    return;
  }
  const to = pick(targets);
  const v = toward(n, at, to);
  // 探向那一格，鼻子跟著朝上或朝下（落點在下面就低頭）
  const look = { translate: `${(v.x * 9).toFixed(1)}% ${(v.y * 9).toFixed(1)}%`, rotate: `${(f * 9 * v.y).toFixed(1)}deg` };
  knight.animate([
    { translate: '0 0', rotate: '0deg' }, { ...look, offset: 0.3 }, { ...look, offset: 0.65 }, { translate: '0 0', rotate: '0deg' },
  ], { duration: 1300, easing: 'ease-in-out' });
  cellEl(root, to)?.querySelector('[data-dot]')?.animate(
    [{ scale: '1', opacity: 1 }, { scale: '1.6', opacity: 0.6, offset: 0.5 }, { scale: '1', opacity: 1 }],
    { duration: 700, delay: 340, easing: 'ease-in-out' },
  );
}
