import type { AuctionPress, AuctionRoom } from '@/types/auctionRoom';
import { MODES, TENTH_MS, bidFromHold, createAuction, isOver, playRound, remaining, type AuctionState } from './engine';

/**
 * 時間拍賣的連線版：從房間裡的按鍵時間（每一席每回合一個 down、一個 up，都是伺服器時間）推出整場拍賣。
 * 純函式、零副作用。沒有後端：每台裝置拿同一份資料、各自跑這個函式，算出同一個得標者與剩餘時間。
 * 規則跟本機版一樣 —— engine 只收「每人這回合出了多少」，這裡只負責把按鍵時間換成出價（bidFromHold，本機版也是用它）。
 *
 * 一回合怎麼進行（照節目：大家先按住按鈕，到齊了才開始倒數）：
 * 1. 回合開放：上一回合結算之後（第一回合是最後一個人入座之後）。在那之前寫的 down 不算（見 OPEN_SLACK_MS）
 * 2. 等人按住：第一個人按下去起算 PRESS_WAIT_MS。「要等的人」（上一回合在場的人）都按住了，最後一個人按下去的那一刻
 *    就是回合開始；等到期限還有人沒按，就不等了，回合在「期限＋寬限」那一刻開始
 * 3. 回合開始之前就按住的人才算有參加（倒數中才按的人沒趕上，這回合出價 0，但人在，下一回合照樣等他）
 * 4. 倒數 countdownMs，倒數內放手＝不參加；之後放手的那一刻就是出價：bidFromHold(up − 開始, 倒數, 剩餘時間)，
 *    算到 0.1 秒、無條件捨去、最多到剩餘時間
 * 5. 所有參加的人都放手（而且倒數已經結束）就結算。最高出價只有一人才得標，最高同秒流標（engine 的 resolveBids）
 *
 * **斷線、一直沒放手**：回合不能卡死。按住時程式會先跟伺服器登記「斷線就替我放手」（onDisconnect，見 auctionRoomService），
 * 關分頁、網路斷掉時由伺服器寫 up。萬一連那個都沒寫到（例如伺服器還沒發現斷線），等到他的時間用完（開始＋倒數＋剩餘時間）
 * 再過 GRACE_MS 還沒有 up，就當作他按到底 —— 出價＝剩餘時間，跟他真的一直按著、按鈕自己彈起來的結果一樣。
 * 一直沒來按的人：第一個人按下去 PRESS_WAIT_MS 之後就不等了；之後的回合他不在「要等的人」裡，不會每回合都讓大家等。
 *
 * **網路延遲與平手**：時間一律以伺服器收到的那一刻為準（ServerValue.TIMESTAMP，規則擋掉自己填的時間），不做延遲補償 ——
 * 補償值只能由各台自己回報，等於可以造假；而且伺服器時間是唯一每台都看得到的同一個值。代價是放手的時間會晚上
 * 「從你的手機到伺服器」那一段（通常 0.05–0.15 秒），按下去也一樣，所以差距在 0.1 秒左右的勝負等於看誰的網路快。
 * 規則照本機版：最高出價到 0.1 秒同秒就流標（不比毫秒 —— 毫秒差多半是網路造成的，不是誰按得久）。
 *
 * **看時間的判斷都多等 GRACE_MS**：「到了期限還沒人按」「時間用完還沒放手」這兩種判斷要看現在幾點，
 * 而別人的資料可能晚一點才傳到這台。多等一下，晚到的 down／up 就來得及算進去，各台才會算出一樣的結果。
 * 萬一真的晚到超過寬限，這台下一次重算時會改成跟其他台一樣（結果只由資料決定），只是畫面上會先錯一下。
 */

/** 第一個人按下去之後，最多等其他人多久（毫秒） */
export const PRESS_WAIT_MS = 20_000;
/** 看時間做判斷之前多等多久，讓晚到的資料來得及（毫秒） */
export const GRACE_MS = 2_000;
/**
 * 回合開放之前多久的 down 也算數（毫秒）。按下去時畫面先用「本機估的伺服器時間」，估得不準可能早一點點；
 * 真正提早很多的（例如有人用開發者工具先替後面的回合按好）就不算，免得回合開始的時間被拉到過去。
 */
export const OPEN_SLACK_MS = 1_000;

/**
 * waiting：還有空位，坐滿才開拍
 * open：這回合還沒有人按
 * gathering：有人按了，在等其他人按住
 * live：回合開始了（倒數或跑秒），等所有參加的人放手
 * over：19 回合結束
 */
export type OnlinePhase = 'waiting' | 'open' | 'gathering' | 'live' | 'over';

export type OnlineRound = {
  /** 第幾回合（1 起算） */
  n: number;
  /** 回合開放的伺服器時間（上一回合結束、或最後一個人入座） */
  openAt: number;
  /** 這回合誰按下去了。只有倒數開始前能給畫面看（節目裡看得到大家的手在按鈕上），開始之後誰還按著是秘密 */
  pressed: boolean[];
  /** 這回合要等誰按（上一回合在場的人；第一回合是所有人） */
  required: boolean[];
  /** 等到這個伺服器時間，還沒按的人就不等了；還沒人按是 null */
  cutoff: number | null;
  /** 回合開始（開始倒數）的伺服器時間；還在等人是 null */
  start: number | null;
  /** 有趕上這回合的人（回合開始前就按住了） */
  inRound: boolean[];
};

export type OnlineView = {
  /** 已經結算的回合都套用過的局面 */
  game: AuctionState;
  phase: OnlinePhase;
  /** 進行中的那一回合；waiting、over 是 null */
  round: OnlineRound | null;
  /** 下一次「時間到了、結果可能會變」的伺服器時間 —— 畫面在那時再算一次；沒有是 null */
  wakeAt: number | null;
};

type RoomData = Pick<AuctionRoom, 'mode' | 'seats' | 'players' | 'rounds'>;

const num = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);

/** 從房間資料推出整場拍賣。`now` 是伺服器時間（Date.now() 加上 .info/serverTimeOffset） */
export function deriveAuction(room: RoomData, now: number): OnlineView {
  const cfg = MODES[room.mode];
  const seats = Array.from({ length: room.seats }, (_, i) => i);
  let game = createAuction(room.mode, room.seats);
  let wakeAt: number | null = null;
  const wake = (t: number) => { if (t > now && (wakeAt === null || t < wakeAt)) wakeAt = t; };

  // 坐滿才開拍；回合 1 在最後一個人入座的那一刻開放（joinedAt 是伺服器時間）
  const joined = seats.map((i) => num(room.players?.[`s${i}`]?.joinedAt));
  if (joined.some((t) => t === null)) return { game, phase: 'waiting', round: null, wakeAt: null };
  let openAt = Math.max(...(joined as number[]));
  /** 上一回合在場的人（第一回合是 null：所有人都要等） */
  let present: boolean[] | null = null;

  while (!isOver(game)) {
    const n = game.history.length + 1;
    const rec = room.rounds?.[`r${n}`] ?? {};
    const press: AuctionPress[] = seats.map((i) => rec[`s${i}`] ?? {});
    const left = seats.map((i) => remaining(game, i));

    // 所有人的時間都用完了：沒有人出得了價，剩下的回合直接全員放棄（不必再一回合一回合按）
    if (left.every((l) => l <= 0)) {
      game = playRound(game, seats.map(() => 0));
      continue;
    }

    const downs = press.map((p) => {
      const d = num(p.down);
      return d !== null && d >= openAt - OPEN_SLACK_MS ? d : null;
    });
    const pressed = downs.map((d) => d !== null);
    let required = present ?? seats.map(() => true);
    if (!required.some(Boolean)) required = seats.map(() => true);
    const base = { n, openAt, pressed, required };
    const valid = downs.filter((d): d is number => d !== null);
    if (valid.length === 0) {
      return { game, phase: 'open', round: { ...base, cutoff: null, start: null, inRound: seats.map(() => false) }, wakeAt };
    }

    // 要等的人都按住了：最後一個人按下去就開始。等到期限（＋寬限）還沒到齊：不等了，在那一刻開始
    const cutoff = Math.min(...valid) + PRESS_WAIT_MS;
    const reqDowns = seats.filter((i) => required[i]).map((i) => downs[i]);
    let start: number;
    if (reqDowns.every((d) => d !== null) && Math.max(...(reqDowns as number[])) <= cutoff) {
      start = Math.max(...(reqDowns as number[]));
    } else if (now >= cutoff + GRACE_MS) {
      start = cutoff + GRACE_MS;
    } else {
      wake(cutoff + GRACE_MS);
      return { game, phase: 'gathering', round: { ...base, cutoff, start: null, inRound: seats.map(() => false) }, wakeAt };
    }

    const inRound = downs.map((d) => d !== null && d <= start);
    const live = { game, phase: 'live' as const, round: { ...base, cutoff, start, inRound } };
    const countdownEnd = start + cfg.countdownMs;
    let pending = false;
    let closeAt = countdownEnd;
    const bids = seats.map((i) => {
      if (!inRound[i]) return 0;
      // 時間用完的那一刻按鈕自己彈起：之後才寫到的 up 一律算按到底
      const expiry = countdownEnd + left[i] * TENTH_MS;
      const up = num(press[i].up);
      if (up !== null) {
        closeAt = Math.max(closeAt, Math.min(up, expiry));
        return bidFromHold(up - start, cfg.countdownMs, left[i]);
      }
      if (now >= expiry + GRACE_MS) {
        closeAt = Math.max(closeAt, expiry);
        return left[i];
      }
      wake(expiry + GRACE_MS);
      pending = true;
      return 0;
    });
    // 倒數結束前不公布（節目的大螢幕倒數完才開始跑）：大家都在倒數裡放手了，也要等倒數跑完
    if (now < countdownEnd) { wake(countdownEnd); pending = true; }
    if (pending) return { ...live, wakeAt };

    // 在場：倒數結束前按下去的人。倒數中才按的人雖然沒趕上，但人在，下一回合照樣等他
    present = downs.map((d) => d !== null && d <= countdownEnd);
    game = playRound(game, bids);
    openAt = closeAt;
  }
  return { game, phase: 'over', round: null, wakeAt: null };
}
