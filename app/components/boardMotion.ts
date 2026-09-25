import type { Player } from '@/types/chessboard';

/**
 * 從「前後兩個盤面」推導出這一次該播哪些動畫。
 *
 * 動畫的觸發條件刻意只看盤面差異，不由操作端主動通知 ——
 * 連線模式的盤面是從遠端 WGF 重播出來的，根本沒有「操作」可以掛鉤；
 * 只看差異的話，本機下的和對手下的走同一條路。
 *
 * 盤面用字串簽章表示（每格一字元，空格是 `.`）而不是二維陣列：
 * 比對便宜、當 state 存也不必擔心被外部改到。
 */

export type Slide = { dx: number; dy: number };
export type BoardMotion = {
  /** `"r,c"` → 從哪個方向滑過來（單位是格） */
  slide: Record<string, Slide>;
  /** `"r,c"`：憑空出現的棋子（開局擺放），用落子動畫 */
  drop: string[];
};

export const boardSignature = (board: Player[][]): string =>
  board.map((row) => row.map((c) => c ?? '.').join('')).join('');

const at = (sig: string, size: number, r: number, c: number) => sig[r * size + c];

/**
 * 比對前後盤面。
 *
 * 只在「剛好一顆棋子消失、剛好一顆同色棋子出現」時判定為移動 ——
 * 其餘情況（重播整盤、開局一次擺多顆、破牆後重算）一律不滑動。
 * 寧可不播，也不要播出一個沒發生過的移動。
 */
export function diffBoard(prevSig: string, nextSig: string, size: number): BoardMotion {
  const empty: BoardMotion = { slide: {}, drop: [] };
  if (prevSig.length !== size * size || nextSig.length !== size * size) return empty;

  const gone: { r: number; c: number; p: string }[] = [];
  const born: { r: number; c: number; p: string }[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const a = at(prevSig, size, r, c);
      const b = at(nextSig, size, r, c);
      if (a === b) continue;
      if (a !== '.') gone.push({ r, c, p: a });
      if (b !== '.') born.push({ r, c, p: b });
    }
  }

  if (born.length === 0) return empty;

  // 一來一往、同色 → 這是一次移動。
  if (gone.length === 1 && born.length === 1 && gone[0].p === born[0].p) {
    const from = gone[0];
    const to = born[0];
    return { slide: { [`${to.r},${to.c}`]: { dx: from.c - to.c, dy: from.r - to.r } }, drop: [] };
  }

  // 沒有對應的來源，而且只多了一顆 → 開局擺放。
  // 多顆一起出現代表是重播，不播動畫。
  if (gone.length === 0 && born.length === 1) {
    return { slide: {}, drop: [`${born[0].r},${born[0].c}`] };
  }

  return empty;
}

/**
 * 領地由誰的棋子「擴散」出來 —— 回傳每一格新歸屬的延遲毫秒數。
 *
 * 封閉成領地是這個遊戲的得分瞬間，但畫面上原本只是整片顏色突然換掉。
 * 讓它從擁有者的棋子往外一圈一圈填，看得出「是這顆棋子圈到的」。
 *
 * 距離用曼哈頓距離而不是實際的 BFS 路徑：領地內本來就沒有牆能繞
 * （有牆就會被切成兩塊領地），兩者在絕大多數情況相同，而便宜得多。
 */
export function territoryWave(
  prev: Record<string, Player>,
  next: Record<string, Player>,
  board: Player[][],
  stepMs = 45,
  maxMs = 520
): Record<string, number> {
  const wave: Record<string, number> = {};

  // 先把每位玩家的棋子位置收好，避免每格都掃一次盤面。
  const pieces: Record<string, [number, number][]> = {};
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const p = board[r][c];
      if (p) (pieces[p] ??= []).push([r, c]);
    }
  }

  for (const [key, owner] of Object.entries(next)) {
    if (!owner || prev[key] === owner) continue;
    const [r, c] = key.split(',').map(Number);
    let best = Infinity;
    for (const [pr, pc] of pieces[owner] ?? []) {
      const d = Math.abs(pr - r) + Math.abs(pc - c);
      if (d < best) best = d;
    }
    wave[key] = Math.min(Number.isFinite(best) ? best * stepMs : 0, maxMs);
  }

  return wave;
}

/**
 * 找出「這一次新出現的那一道牆」。
 *
 * 不能只靠元素掛載就播動畫：連線重播、重整、觀戰加入時整盤的牆會一起掛上，
 * 於是每一道都長一次，看起來像剛剛全部蓋好。一回合只會多一道牆，
 * 所以多於一道就判定成重播、整組不播。
 *
 * 回傳 `"h:r,c"` / `"v:r,c"` 這樣的鍵，橫直牆共用一個命名空間。
 */
export function newWall(
  prev: { h: string; v: string },
  next: { h: string; v: string }
): string | null {
  let found: string | null = null;
  for (const axis of ['h', 'v'] as const) {
    const a = prev[axis];
    const b = next[axis];
    if (a.length !== b.length) return null; // 換盤面大小
    for (let i = 0; i < b.length; i++) {
      if (b[i] !== '.' && a[i] === '.') {
        if (found) return null; // 一次多於一道 → 是重播
        found = `${axis}:${i}`;
      }
    }
  }
  return found;
}

export type Walls = { h: Player[][]; v: Player[][] };

/** 從 `(r,c)` 往某方向走有沒有被牆擋住。與 Chessboard 的可走點判定同一套。 */
const blocked = (w: Walls, r: number, c: number, dr: number, dc: number): boolean => {
  if (dr === 1) return !!w.h[r]?.[c];
  if (dr === -1) return r > 0 && !!w.h[r - 1]?.[c];
  if (dc === 1) return !!w.v[r]?.[c];
  if (dc === -1) return c > 0 && !!w.v[r]?.[c - 1];
  return false;
};

/**
 * 棋子實際走的那條路 —— 回傳沿途每一格（含起點與終點）。
 *
 * 兩步的 L 形如果用直線補間，畫面上就是斜著飛過去，看起來像可以走斜線；
 * 這個遊戲只能走上下左右，動畫不該教錯規則。所以照著格子走，
 * 而且用 BFS 走合法路徑 —— 直覺的那個轉角要是被牆擋住，會自動改走另一邊。
 *
 * 盤面是移動**之後**的狀態：起點已空、終點站著自己那顆，
 * 所以終點要特別放行，其他有棋子的格子一律不能穿過。
 */
export function pathBetween(
  board: Player[][],
  walls: Walls,
  from: [number, number],
  to: [number, number],
  maxSteps = 2
): [number, number][] | null {
  const size = board.length;
  const key = (r: number, c: number) => r * size + c;
  const prev = new Map<number, number>();
  const seen = new Set([key(...from)]);
  let frontier: [number, number][] = [from];

  for (let step = 0; step < maxSteps && frontier.length; step++) {
    const next: [number, number][] = [];
    for (const [r, c] of frontier) {
      for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]] as const) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        if (blocked(walls, r, c, dr, dc)) continue;
        // 終點現在站著剛移動過去的那顆自己，要放行
        const isGoal = nr === to[0] && nc === to[1];
        if (!isGoal && board[nr][nc]) continue;
        const k = key(nr, nc);
        if (seen.has(k)) continue;
        seen.add(k);
        prev.set(k, key(r, c));
        if (isGoal) {
          const out: [number, number][] = [];
          for (let cur: number | undefined = k; cur !== undefined; cur = prev.get(cur)) {
            out.unshift([Math.floor(cur / size), cur % size]);
          }
          return out;
        }
        next.push([nr, nc]);
      }
    }
    frontier = next;
  }
  return null;
}
