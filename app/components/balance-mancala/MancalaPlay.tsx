'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { GiExitDoor, GiLaurelCrown, GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuVolume2, LuVolumeX } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { useSound } from '@/hook/useSound';
import { useTitleAlert } from '@/hook/useTitleAlert';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { fill, useTextTable } from '@/i18n/gameText';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { localePath, type Locale } from '@/i18n/locales';
import { BALANCE_MANCALA } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';
import {
  createGame, place, applyMove, sow, sourcesOf, legalPlacements, standings, isLegalMove, letterOf, isSpecial, finalScore, ANGEL, DEFAULT_PIECES,
  type Colour, type MancalaState, type Move, type Seat, type Sow,
} from '@/games/balance-mancala/engine';
import { chooseMove, choosePlacement, personalityOf, suggestColour, suggestMove } from '@/games/balance-mancala/ai';
import { humanSeatsOf, type MatchSetup } from './match';
import { beforeLast, catchUp } from './online';
import { BoardFace } from './hoursArt';
import { BRASS, DISH_BG, INK, MCL_BAND, MCL_PANEL, WOOD, CLOTH_LIGHT, cellName } from './palette';
import { MCL_ROUND, MCL_SHARE, MCL_WIDE } from './styles';
import { playMancala } from './sounds';
import { MCL_CARD_IMAGES, drawMancalaCard, type MancalaCardData } from './shareCard';
import MancalaFrame from './MancalaFrame';
import MancalaRing, { LAND, type RingMark, type RingTrail } from './MancalaRing';
import ScorePanel from './ScorePanel';
import BalanceCard from './BalanceCard';
import OrderEditor, { type Outcome } from './OrderEditor';
import { RulesStepsPaged } from './MancalaRulesSteps';
import PieceDisc from './PieceDisc';

/** 節奏（毫秒）。AI 每手約 1.5–2 秒；點盤面可以直接跳過播種動畫。hop／hopHuman 是一顆種子跳一格的時間（比間隔長一點，前後兩顆會交疊） */
const TIMING = { place: 260, think: 320, lift: 150, step: 190, stepHuman: 140, hold: 480, holdHuman: 360, hop: 230, hopHuman: 180 };

type Anim = { move: Move; sow: Sow; step: number; by: Seat };
type Pick = { from: number; order: Seat[]; colour?: Colour; sel: number | null };

/** 連線時一次落後超過這麼多手（分頁在背景、網路卡住）：直接跳到最後一手之前，只播最後一手 */
const CATCH_UP = 2;

/** 連線局（MancalaOnline 給的）：局面跟著房間，自己只在輪到時動 */
export type OnlineSeat = {
  /** 這台裝置上的人坐哪 */
  me: Seat;
  /** 房間的局面（整串走法重走出來的） */
  state: MancalaState;
  /** 自己走完一手（放子或播種）：整個新局面交給房間 */
  send: (next: MancalaState) => void;
};

/**
 * 第一局的教學（Zach 11/1：「要想辦法讓大家好懂」）：照局面一次跳一句，做到了就換下一句（點了格子就不再講怎麼點）。
 * 四句都看過、或按「不用教了」，記在 localStorage，之後不再出現（讀不到就照樣教，不會出錯）。
 */
type CoachTip = 'setup' | 'turn' | 'pick' | 'balance';
const COACH_KEY = 'mcl-coach-done';
const coachListeners = new Set<() => void>();
function readCoachDone(): boolean {
  try { return window.localStorage.getItem(COACH_KEY) === '1'; } catch { return false; }
}
function writeCoachDone() {
  try { window.localStorage.setItem(COACH_KEY, '1'); } catch { /* 私密視窗：這一頁裡照樣關掉 */ }
  coachDoneMemo = true;
  coachListeners.forEach((cb) => cb());
}
let coachDoneMemo: boolean | null = null;
const subscribeCoach = (cb: () => void) => { coachListeners.add(cb); return () => { coachListeners.delete(cb); }; };
const coachSnapshot = () => (coachDoneMemo ??= readCoachDone());

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(motionQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/**
 * 對局畫面（跟 AI 玩、本機對戰、連線共用）。只持有一個不可變的 MancalaState，規則全在 engine。
 *
 * 一手的流程：點起點格 → 排序編輯器（預設是 AI 建議的排法，盤面畫出播完的樣子）→ 播下去 →
 * 一顆一顆落下的動畫 → 動畫播完才 applyMove。AI 的回合也走同一條動畫。
 * 動畫跟局面分開存（anim），套用那一刻 setGame 與 setAnim(null) 在同一個事件裡 —— 驅動 AI 的 effect
 * 依賴兩者，不會出現「局面還沒換、動畫已經清掉」的中間狀態而重複出手（CLAUDE.md〈單人對戰〉的教訓）。
 *
 * 連線（online）：畫面上的局面一步一步追房間的局面（online.ts 的 catchUp）—— 別人的放子一顆一顆落下、
 * 播種照樣一顆一顆飛，落後太多就只播最後一手；自己的一手先畫出來、同時寫進房間。只有輪到自己而且已經追上時能點。
 *
 * 房子回這款的首頁（選模式那一頁，onHome），不播轉場（Zach 10/24：這款裡面換畫面直接換）；
 * 進行到一半先問一次（原本就有的確認視窗）。原本另有一顆「換設定」，跟回首頁是同一個畫面，拿掉了。
 *
 * 版面：手機直式上面圓盤、下面分數（選了起點格時分數換成排序編輯器）；桌機（lg）左盤右欄。
 * 整頁是同一頁時禱書的羊皮紙（MancalaFrame），盤面是墨底金格紋的圓（WOOD＋hoursArt 的 BoardFace），軌道線與勝利的桂冠是金。
 */
export default function MancalaPlay({ locale, setup, onHome, onAgain, online = null }: {
  locale: Locale;
  setup: MatchSetup;
  /** 回這款的首頁（選模式那一頁） */
  onHome: () => void;
  /** 再來一局（連線是開一間新房） */
  onAgain: () => void;
  online?: OnlineSeat | null;
}) {
  const t = useTextTable(TEXT);
  const gt = useGameText();
  const msgs = useMessages();
  const { prefs: soundPrefs, setPrefs: setSoundPrefs } = useSound();
  const humans = useMemo(() => humanSeatsOf(setup), [setup]);
  const isHuman = useCallback((seat: Seat) => humans.includes(seat), [humans]);
  const solo = setup.mode === 'solo';
  const me = online?.me ?? null;
  // 「輪到你」的那個人：跟 AI 玩是 A、連線是這台裝置上的人；本機對戰沒有「自己」
  const self: Seat | null = solo ? humans[0] : me;
  // 播種動畫快一點的一方：自己剛排好的那一手（本機對戰是每個真人），別人的一手（AI、連線的其他人）放慢讓人看清楚
  const quick = useCallback((seat: Seat) => (me !== null ? seat === me : isHuman(seat)), [me, isHuman]);
  const [game, setGame] = useState<MancalaState>(() => online?.state ?? createGame({ seats: setup.seats, pieces: DEFAULT_PIECES }));
  const [anim, setAnim] = useState<Anim | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  // 滑鼠停在哪一格（電腦版）：能選的格子先畫出建議排法的路線與結果，不必點進去才知道
  const [hover, setHover] = useState<number | null>(null);
  const coachDone = useSyncExternalStore(subscribeCoach, coachSnapshot, () => true);
  const [coachSeen, setCoachSeen] = useState<CoachTip[]>([]);
  const seeTip = useCallback((tip: CoachTip) => setCoachSeen((xs) => {
    if (xs.includes(tip)) return xs;
    const next = [...xs, tip];
    if (next.length === 4) writeCoachDone();
    return next;
  }), []);
  const [helpOpen, setHelpOpen] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => false);

  const names = useMemo(() => Array.from({ length: setup.seats }, (_, seat) => {
    if (!humans.includes(seat)) return fill(t.computer, { seat: letterOf(seat) });
    return solo ? t.you : fill(t.player, { seat: letterOf(seat) });
  }), [setup.seats, humans, solo, t]);

  const startSow = useCallback((g: MancalaState, m: Move) => {
    setAnim({ move: m, sow: sow(g, m.from, m.order, m.colour), step: 0, by: g.turn });
  }, []);
  // 播種的音效：每一顆落地響一聲，最後一顆加上得分的黃銅聲。只對著動畫的「下一顆」響 —— 跳過動畫時剩下的不補，
  // 但得分那一聲一定要有（finish 補上）
  const sounded = useRef<{ move: Move | null; step: number; scored: boolean }>({ move: null, step: 0, scored: false });
  const scoreSound = useCallback((r: Sow, delay: number) => {
    playMancala({ kind: 'last', crowd: r.points - 1, delay });
    playMancala({ kind: 'score', points: r.points, cell: !isSpecial(r.cell) ? 'dish' : r.cell === ANGEL ? 'angel' : 'devil', delay: delay + 0.1 });
  }, []);

  // 動畫播完的計時器與「點盤面跳過」可能落在同一個 tick：同一手只能套用一次
  const applied = useRef<Anim | null>(null);
  const finish = useCallback((a: Anim) => {
    if (applied.current === a) return;
    applied.current = a;
    if (sounded.current.move !== a.move || !sounded.current.scored) {
      sounded.current = { move: a.move, step: a.sow.order.length, scored: true };
      scoreSound(a.sow, 0);
    }
    setGame((g) => applyMove(g, a.move));
    setAnim(null);
  }, [scoreSound]);

  // AI 的回合：讓出一點時間再算（一手幾毫秒），看起來也像在想
  useEffect(() => {
    if (anim || game.phase === 'over' || isHuman(game.turn)) return;
    const id = window.setTimeout(() => {
      if (game.phase === 'setup') {
        const cell = choosePlacement(game, setup.difficulty);
        if (cell !== null) setGame(place(game, cell));
        return;
      }
      const m = chooseMove(game, setup.difficulty, { personality: personalityOf(game.turn) });
      if (m) startSow(game, m);
    }, game.phase === 'setup' ? TIMING.place : TIMING.think);
    return () => window.clearTimeout(id);
  }, [game, anim, isHuman, setup.difficulty, startSow]);

  // 連線：畫面上的局面追房間的局面。動畫播完才追下一步（自己剛播的那一手，房間已經先有了，套用之後就一樣）
  const target = online?.state ?? null;
  const lag = useMemo(() => (target ? catchUp(game, target) : null), [game, target]);
  useEffect(() => {
    if (!target || !lag || lag.kind === 'same' || anim) return;
    const id = window.setTimeout(() => {
      if (lag.kind === 'reset') { setPick(null); setGame(target); }
      else if (lag.kind === 'place') setGame(place(game, lag.cell));
      else if (lag.behind > CATCH_UP) setGame(beforeLast(target));
      else startSow(game, lag.move);
    }, lag.kind === 'place' ? TIMING.place : 0);
    return () => window.clearTimeout(id);
  }, [target, lag, anim, game, startSow]);

  // 播種動畫：一顆一顆落下，最後停一下讓人看清楚誰得幾分，然後才真的套用
  useEffect(() => {
    if (!anim) return;
    const total = anim.sow.order.length;
    const human = quick(anim.by);
    if (anim.step < total) {
      const delay = reduced ? 0 : anim.step === 0 ? TIMING.lift : human ? TIMING.stepHuman : TIMING.step;
      const id = window.setTimeout(() => setAnim((a) => (a ? { ...a, step: reduced ? total : a.step + 1 } : a)), delay);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => finish(anim), human ? TIMING.holdHuman : TIMING.hold);
    return () => window.clearTimeout(id);
  }, [anim, reduced, quick, finish]);

  // 一顆一顆落地的聲音：step 每多 1 就響一聲（減少動態效果時 step 一次跳到底，只響最後那一下）
  useEffect(() => {
    if (!anim) return;
    const snd = sounded.current;
    if (snd.move !== anim.move) sounded.current = { move: anim.move, step: 0, scored: false };
    const cur = sounded.current;
    if (anim.step === cur.step || cur.scored) return;
    cur.step = anim.step;
    const human = quick(anim.by);
    const delay = reduced ? 0 : ((human ? TIMING.hopHuman : TIMING.hop) * LAND) / 1000;
    const total = anim.sow.order.length;
    if (anim.step >= total) { cur.scored = true; scoreSound(anim.sow, delay); return; }
    // 這一格在這顆落下之前已經有幾顆（種子碰種子的聲音）
    const j = anim.step - 1;
    const cell = anim.sow.path[j];
    const crowd = (cell === anim.sow.from ? 0 : game.board[cell].length) + anim.sow.path.slice(0, j).filter((c) => c === cell).length;
    playMancala({ kind: 'seed', index: j, crowd, delay });
  }, [anim, reduced, quick, scoreSound, game.board]);

  // 開局放子：每放一顆響一聲；結束：分出勝負的那一手套用之後，贏、輸各一段（本機對戰一律是慶祝的那段）。
  // 剛好多一顆、多一手才響 —— 連線一次追好幾手、重整接回都不響
  const heard = useRef({ placements: game.placements.length, moves: game.moves.length });
  useEffect(() => {
    const prev = heard.current;
    heard.current = { placements: game.placements.length, moves: game.moves.length };
    if (game.placements.length === prev.placements + 1) {
      const cell = game.placements[game.placements.length - 1];
      playMancala({ kind: 'place', crowd: game.board[cell].length - 1, delay: reduced ? 0 : 0.1 });
    }
    if (game.moves.length === prev.moves + 1 && game.phase === 'over') {
      const won = self === null || standings(game).some((r) => r.rank === 1 && r.seat === self);
      playMancala({ kind: won ? 'win' : 'lose', delay: 0.35 });
    }
  }, [game, reduced, self]);

  // 下到一半離開先問：房子鈕、瀏覽器返回鍵、電腦版關分頁（hook/useLeaveGuard.ts）。
  // 連線局一坐滿就算開始了：離開的話其他人會停在那裡等
  const inProgress = game.phase !== 'over' && (online !== null || game.placements.length > 0);
  const leave = useLeaveGuard({ live: game.phase !== 'over', inProgress });

  const preview = useMemo(() => (pick ? sow(game, pick.from, pick.order, pick.colour) : null), [game, pick]);
  // 連線：輪到自己、而且畫面已經追上房間（別人的一手還在播就先等）
  const myTurn = !anim && game.phase !== 'over' && (online ? game.turn === me && lag?.kind === 'same' : isHuman(game.turn));

  // 連線：輪到自己的那一下響一聲（分頁在背景也聽得到）、電腦版的分頁標題跟著閃。重整接回的那一下不響
  const myOnlineTurn = online !== null && myTurn;
  const rang = useRef(myOnlineTurn && game.placements.length > 0);
  useEffect(() => {
    if (!myOnlineTurn) { rang.current = false; return; }
    if (rang.current) return;
    rang.current = true;
    playMancala({ kind: 'turn', delay: 0.2 });
  }, [myOnlineTurn]);
  useTitleAlert(myOnlineTurn, gt.tips.yourTurn);
  const selectable = useMemo(
    () => (myTurn ? new Set(game.phase === 'setup' ? legalPlacements(game) : sourcesOf(game)) : null),
    [myTurn, game],
  );

  // 滑鼠停著的那一格：用建議排法預覽（每次換格才算一次；建議排法裡有隨機排法，同一格停著不會一直變）
  const hoverSow = useMemo(() => {
    if (hover === null || pick || game.phase !== 'play' || !selectable?.has(hover)) return null;
    const m = suggestMove(game, hover);
    return m ? sow(game, m.from, m.order, m.colour) : null;
  }, [hover, pick, game, selectable]);
  const shown = preview ?? hoverSow;

  // 排序編輯器的結果卡：起點格裡每一位主人當最後一顆時（建議排法），誰 +幾分、最終分怎麼變。換起點格才重算
  const pickFrom = pick?.from ?? null;
  const outcomes = useMemo((): Outcome[] | undefined => {
    if (pickFrom === null || game.phase !== 'play') return undefined;
    return [...new Set(game.board[pickFrom])].flatMap((o) => {
      const m = suggestMove(game, pickFrom, o);
      if (!m) return [];
      const r = sow(game, m.from, m.order, m.colour);
      return [{ owner: r.owner, points: r.points, colour: r.colour, f1: finalScore(game.scores[r.owner]), f2: finalScore(r.scores[r.owner]) }];
    });
  }, [game, pickFrom]);

  const openEditor = (from: number, last?: Seat) => {
    const m = suggestMove(game, from, last) ?? { from, order: game.board[from].slice() };
    setPick({ from, order: m.order, colour: m.colour, sel: null });
  };

  const onPick = (cell: number) => {
    if (anim) { finish(anim); return; } // 點盤面跳過動畫
    if (!myTurn || !selectable?.has(cell)) return;
    if (game.phase === 'setup') {
      const next = place(game, cell);
      setGame(next);
      online?.send(next);
      return;
    }
    if (pick?.from === cell) { setPick(null); return; }
    seeTip('turn');
    openEditor(cell);
  };

  const onSlot = (i: number) => {
    if (!pick) return;
    if (pick.sel === null || pick.sel === i) { setPick({ ...pick, sel: pick.sel === i ? null : i }); return; }
    const order = pick.order.slice();
    [order[pick.sel], order[i]] = [order[i], order[pick.sel]];
    // 換到最後一顆的人變了，同分選色要跟著重選
    const options = sow(game, pick.from, order).options;
    const colour = options.length > 1 ? (pick.colour !== undefined && options.includes(pick.colour) ? pick.colour : suggestColour(game, pick.from, order) ?? undefined) : undefined;
    setPick({ ...pick, order, colour, sel: null });
  };

  const onSow = () => {
    if (!pick || !preview) return;
    const move: Move = preview.options.length > 1 ? { from: pick.from, order: pick.order, colour: pick.colour } : { from: pick.from, order: pick.order };
    if (!isLegalMove(game, move)) return;
    seeTip('pick');
    setPick(null);
    startSow(game, move);
    // 連線：動畫還在播，房間先寫好（其他人不必等這一手播完才收到）
    online?.send(applyMove(game, move));
  };

  // 盤面要畫哪一個局面：動畫中的半途、排序預覽（播完的樣子）、或現在的局面
  const view = useMemo((): {
    board: Seat[][]; incoming?: Set<number>; emptied?: number; dropped?: number | null; dropKey?: number; mark: RingMark | null;
    flight?: { from: number; to: number; seat: Seat } | null; weigh?: number | null; trail?: RingTrail | null;
  } => {
    const markOf = (r: Sow, faded: boolean): RingMark => ({ cell: r.cell, owner: r.owner, points: r.points, colour: r.colour, faded });
    if (anim) {
      const board = game.board.map((c, i) => (i === anim.sow.from ? [] : c.slice()));
      for (let j = 0; j < anim.step; j++) board[anim.sow.path[j]].push(anim.sow.order[j]);
      const done = anim.step >= anim.sow.order.length;
      const k = anim.step - 1;
      // 飛的那顆從上一格跳過來（第一顆從被撈空的那一格）—— 手拿著一把種子沿路一格放一顆
      const flight = k >= 0 ? { from: k === 0 ? anim.sow.from : anim.sow.path[k - 1], to: anim.sow.path[k], seat: anim.sow.order[k] } : null;
      return {
        board, emptied: anim.sow.from, dropped: k >= 0 ? anim.sow.path[k] : null, dropKey: anim.step, flight,
        mark: done ? markOf(anim.sow, false) : null, weigh: done ? anim.sow.cell : null,
      };
    }
    // 預覽：盤面畫播完的樣子，加上路線（第幾顆落在哪）；誰得幾分寫在盤面中央（不壓在格子的子上）
    if (pick && preview) return { board: preview.board, incoming: new Set(preview.path), emptied: pick.from, mark: null, trail: { from: pick.from, path: preview.path } };
    // 滑鼠停著：盤面不動，只畫路線
    if (hoverSow) return { board: game.board, mark: null, trail: { from: hoverSow.from, path: hoverSow.path } };
    // 開局放子：剛放的那一顆從上面落下（沒有來源格，不飛）
    const placed = game.moves.length === 0 ? game.placements[game.placements.length - 1] ?? null : null;
    return { board: game.board, dropped: placed, dropKey: game.placements.length, mark: game.last ? markOf(game.last, true) : null };
  }, [anim, pick, preview, hoverSow, game]);

  // 一顆種子跳一格的時間；0＝不飛（不在播種、或減少動態效果）
  const hopMs = anim && !reduced ? (quick(anim.by) ? TIMING.hopHuman : TIMING.hop) : 0;

  const ariaOf = (cell: number) => {
    const owners = view.board[cell];
    const base = fill(t.cellAria, { cell: cellName(cell, t), n: owners.length });
    return owners.length ? `${base}: ${owners.map(letterOf).join(' ')}` : base;
  };

  // 狀態列：自己（跟 AI 玩、連線）寫「輪到你」；本機對戰的真人寫名字；AI 與連線的其他人是「放子中／思考中」
  const actor = anim ? anim.by : game.turn;
  const setupPhase = game.phase === 'setup';
  const status = game.phase === 'over' && !anim ? t.over
    : anim ? fill(t.sowing, { name: names[anim.by] })
    : actor === self ? (setupPhase ? t.setupYou : t.turnYou)
    : isHuman(actor) && !online ? fill(setupPhase ? t.setupHuman : t.turnHuman, { name: names[actor] })
    : fill(setupPhase ? t.setupComputer : t.thinking, { name: names[actor] });
  const last = game.last;
  const lastMover = game.phase === 'over' ? game.turn : (game.turn - 1 + setup.seats) % setup.seats;
  // 第二行：AI 播種時提示可以跳過動畫，其他時候是上一手做了什麼
  const lastLine = anim ? (quick(anim.by) || reduced ? '' : t.skipHint)
    : last && last.colour !== null
      ? fill(t.lastMove, { name: names[lastMover], cell: cellName(last.from, t), n: last.order.length, owner: names[last.owner], colour: t.colourShort[last.colour], points: last.points })
      : '';

  // 這一手會結束遊戲：先告訴玩家結束時的名次
  const endsText = preview?.ends ? (() => {
    const st = standings({ scores: preview.scores });
    if (self !== null) return fill(t.endsWarn, { rank: st.find((r) => r.seat === self)!.rank });
    return fill(t.endsWarnLocal, { name: st.filter((r) => r.rank === 1).map((r) => names[r.seat]).join(' · ') });
  })() : null;

  // 結算
  const modeLabel = solo ? t.modeSolo : online ? t.modeOnline : t.modeLocal;
  const over = game.phase === 'over' && !anim;
  const table = over ? standings(game) : [];
  const winnersList = table.filter((r) => r.rank === 1).map((r) => r.seat);
  const soleWinner = winnersList.length === 1 ? winnersList[0] : null;
  const endTitle = soleWinner === null ? t.tie : solo && soleWinner === humans[0] ? t.youWin : fill(t.winner, { name: names[soleWinner] });
  const endReason = over && last && last.colour !== null
    ? fill(t.endReason, { name: names[last.owner], colour: t.colourNames[last.colour], n: game.scores[last.owner][last.colour] })
    : '';

  // 結算就是分享圖（Zach 10/24：結尾的可分享畫面，各自設計）—— 圖長得像這款自己的頁面（shareCard.ts）。
  // 關掉就停在終局的盤面上，盤面中間的「看結果」再打開
  // 盤子的紅藍綠（站上的玩家色）與字型從 CSS 變數讀；只有結束後（一定在瀏覽器裡）才讀
  const { dish, font } = useMemo(() => {
    const fallback = { dish: ['#cd4642', '#2478b7', '#0e8142'] as [string, string, string], font: 'system-ui' };
    if (!over || typeof document === 'undefined') return fallback;
    const css = getComputedStyle(document.documentElement);
    const v = (k: string, fb: string) => css.getPropertyValue(k).trim() || fb;
    return { dish: [v('--player-A', fallback.dish[0]), v('--player-B', fallback.dish[1]), v('--player-C', fallback.dish[2])] as [string, string, string], font: v('--font-app', fallback.font) };
  }, [over]);
  const card: Omit<MancalaCardData, 'font' | 'dish'> = {
    rows: table.map((r) => ({ seat: r.seat, rank: r.rank, name: names[r.seat], scores: r.scores, final: r.final })),
    text: {
      showRef: t.showRef,
      name: t.title,
      altName: t.altName,
      kicker: `${gt.champion.matchOver} · ${modeLabel}`,
      title: endTitle,
      reason: endReason,
      formula: t.formula,
      colourShort: t.colourShort,
      rank: t.rank,
      final: t.final,
      brand: t.altName ? `${t.title} ${t.altName}` : t.title,
      from: fill(gt.share.cardFrom, { show: msgs.meta.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  };
  const endOpen = over && !endClosed;
  const share = useShareCard({
    isOpen: endOpen,
    draw: drawMancalaCard({ ...card, dish, font }),
    contentKey: JSON.stringify([card, dish, font]),
    fileName: 'balance-mancala',
    homePath: localePath(locale, BALANCE_MANCALA),
    campaign: 'balance-mancala',
    fonts: [
      { font: `900 40px ${font}`, text: [card.text.name, card.text.title, card.text.brand, ...card.rows.map((r) => r.name), ...t.colourShort, t.final].join('') },
      { font: `700 40px ${font}`, text: card.text.showRef + card.text.kicker + card.text.reason + card.text.from + card.text.altName },
    ],
    images: MCL_CARD_IMAGES,
    layouts: ['story'],
  });
  const srText = [endTitle, endReason, ...table.map((r) => `${fill(t.rank, { n: r.rank })} ${names[r.seat]}: ${t.colourShort.map((c, k) => `${c} ${r.scores[k]}`).join(', ')}; ${t.final} ${r.final}`)].join(' ');

  const askLeave = () => leave.request(onHome);

  // 角落的小鈕是切角的淡墨片（金箔留給主要動作），寬的是一條畫了格線的羊皮紙 —— styles.ts、globals.css 的 .mcl-*
  const round = MCL_ROUND;
  const wide = MCL_WIDE;
  const soundButton = (
    <button type="button" onClick={() => setSoundPrefs({ sfx: !soundPrefs.sfx })} aria-pressed={soundPrefs.sfx} aria-label={gt.sound.button} className={round}>
      {soundPrefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );

  // 預覽的結果（盤面中央）：最後一顆落在哪、誰 +幾分、記哪一色、那個人的最終分怎麼變
  const previewCenter = shown ? (() => {
    const before = game.scores[shown.owner];
    const after = shown.scores[shown.owner];
    return (
      <>
        <p className="font-bold leading-tight opacity-80" style={{ fontSize: '2.7cqw' }}>
          {fill(t.previewLand, { cell: cellName(shown.cell, t) })}
        </p>
        <div className="mt-[1.6cqw] flex items-center" style={{ gap: '1.4cqw' }}>
          <PieceDisc seat={shown.owner} size="8cqw" />
          <span className="font-black leading-none" style={{ fontSize: '7cqw' }}>+{shown.points}</span>
          <span className="grid place-items-center rounded-full font-black leading-none"
            style={{ minWidth: '7cqw', height: '7cqw', padding: '0 1.2cqw', fontSize: '3.4cqw', background: shown.colour !== null ? DISH_BG[shown.colour] : CLOTH_LIGHT, color: shown.colour !== null ? CLOTH_LIGHT : INK }}>
            {shown.colour !== null ? t.colourShort[shown.colour] : '?'}
          </span>
        </div>
        <p className="mt-[1.4cqw] max-w-full truncate font-black leading-tight" style={{ fontSize: '3.2cqw' }}>{names[shown.owner]}</p>
        <p className="mt-[0.6cqw] font-bold leading-tight opacity-80" style={{ fontSize: '2.7cqw' }}>
          {shown.colour !== null ? fill(t.previewFinal, { f1: finalScore(before), f2: finalScore(after) }) : t.previewTie}
        </p>
        {!preview && <p className="mt-[1.2cqw] font-bold leading-tight" style={{ fontSize: '2.5cqw', color: BRASS }}>{t.previewHover}</p>}
      </>
    );
  })() : null;

  const center = previewCenter && !anim ? previewCenter : over ? (
    <>
      <GiLaurelCrown aria-hidden="true" style={{ color: BRASS, width: '11cqw', height: '11cqw' }} />
      <p className="mt-[1cqw] font-black leading-tight" style={{ fontSize: '3.6cqw' }}>{t.over}</p>
      {endClosed && (
        <button type="button" onClick={() => setEndClosed(false)} className="mcl-plaque mt-[2cqw] px-[3cqw] py-[1.2cqw] font-black" style={{ fontSize: '3cqw' }}>
          {t.results}
        </button>
      )}
    </>
  ) : (
    <>
      <PieceDisc seat={actor} size="11cqw" />
      <p className="mt-[1.6cqw] max-w-full truncate font-black leading-tight" style={{ fontSize: '3.6cqw' }}>{names[actor]}</p>
      <p className="mt-[0.6cqw] font-bold leading-tight opacity-70" style={{ fontSize: '2.7cqw' }}>
        {game.phase === 'setup' ? `${game.placements.length} / ${game.setupOrder.length}` : t.formula}
      </p>
    </>
  );

  const scorePanel = (
    <ScorePanel scores={game.scores} names={names} turn={over ? null : actor}
      gain={preview ? { owner: preview.owner, colour: preview.colour, points: preview.points } : null}
      colourShort={t.colourShort} finalLabel={t.final} mine={me} />
  );

  // 三色的天平：跟 AI 玩是你、連線是自己、本機對戰是輪到的真人（AI 的回合停在座位順序上前一個真人）
  const who = self ?? (() => {
    for (let k = 0; k < setup.seats; k++) {
      const seat = (actor - k + setup.seats) % setup.seats;
      if (isHuman(seat)) return seat;
    }
    return actor;
  })();
  const balanceGain = shown && shown.owner === who && shown.colour !== null ? { colour: shown.colour, points: shown.points } : null;
  const balanceCard = !over ? (
    <BalanceCard t={t} seat={who} name={names[who]} scores={game.scores[who]} gain={balanceGain} />
  ) : null;

  // 現在該講哪一句：第一句還沒做到的、而且現在用得上的
  const coachTip: CoachTip | null = coachDone || !myTurn ? null
    : game.phase === 'setup' ? (coachSeen.includes('setup') ? null : 'setup')
    : pick ? (coachSeen.includes('pick') ? null : 'pick')
    : !coachSeen.includes('turn') ? 'turn'
    : !coachSeen.includes('balance') && game.moves.length >= setup.seats ? 'balance'
    : null;
  const coachText = coachTip === 'setup' ? t.coachSetup : coachTip === 'turn' ? fill(t.coachTurn, { seat: letterOf(game.turn) })
    : coachTip === 'pick' ? t.coachPick : coachTip === 'balance' ? t.coachBalance : '';
  const coach = coachTip ? (
    <div className="mcl-cut flex w-full flex-col gap-2 bg-[var(--mcl-cloth-light)] p-3" role="status">
      <p className="flex items-start gap-2 text-sm font-bold leading-snug">
        <span aria-hidden="true" className="mcl-weight mt-1 shrink-0" />
        <span>{coachText}</span>
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={writeCoachDone} className="mcl-cut px-3 py-1.5 text-xs font-black text-ink-soft fine:hover:bg-[rgb(var(--mcl-ink-rgb)/0.07)]">{t.coachOff}</button>
        <button type="button" onClick={() => seeTip(coachTip)} className="mcl-plaque is-small px-3 py-1.5 text-xs font-black">{t.coachGot}</button>
      </div>
    </div>
  ) : null;

  const statusBlock = (
    <div className="flex min-h-11 flex-col items-center justify-center text-center lg:items-start lg:text-left" aria-live="polite">
      <p className="text-sm font-black">{status}</p>
      {lastLine && <p className="mt-0.5 text-xs font-bold text-ink-soft">{lastLine}</p>}
    </div>
  );

  // 手機上圓盤讓出分數面板的高度（每席約 2.75rem）與上下兩條頁邊（各 30px），整頁塞得進一個畫面
  // svh 不用 dvh：手機工具列收起時 dvh 變大，圓盤會跟著脹（Zach 10/24）
  const ringMax = `max(15rem, min(100%, calc(100svh - ${12.25 + setup.seats * 2.75}rem)))`;

  return (
    <MancalaFrame className="items-center px-4 pb-5 pt-3 lg:flex-row lg:items-start lg:justify-center lg:gap-10 lg:pt-8">
      {/* 手機的上方一排：左邊房子與聲音、右邊說明，標題用三欄置中（左右兩欄等寬，標題就在正中間） */}
      <div className="grid w-full max-w-[520px] grid-cols-[1fr_auto_1fr] items-center lg:hidden">
        <div className="flex gap-1.5 justify-self-start">
          <button type="button" onClick={askLeave} aria-label={t.home} className={round}><LuHouse aria-hidden="true" /></button>
          {soundButton}
        </div>
        <h1 className="truncate px-2 text-lg font-black">{t.title}</h1>
        <div className="flex gap-1.5 justify-self-end">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={round}><LuCircleHelp aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-1 w-full max-w-[520px] lg:hidden">{statusBlock}</div>
      {coach && <div className="mt-2 w-full max-w-[520px] lg:hidden">{coach}</div>}

      {/* 圓盤：一塊圓的木頭（Oware 棋盤的木色），盤子嵌在上面 */}
      <div className="mt-1 w-full lg:mt-0 lg:!max-w-[min(600px,calc(100svh-9.5rem))] lg:flex-1" style={{ maxWidth: ringMax }}>
        <div className="relative rounded-full p-[3%]" style={{ background: WOOD }}>
          <BoardFace />
          <MancalaRing board={view.board} colourShort={t.colourShort} highLabel={t.high} lowLabel={t.low} ariaOf={ariaOf}
            selectable={selectable} dimOthers={!pick && !hoverSow} selected={pick?.from ?? null} incoming={view.incoming} emptied={view.emptied}
            dropped={view.dropped} dropKey={view.dropKey ?? 0} mark={view.mark} onPick={onPick} center={center}
            flight={view.flight} hopMs={hopMs} scoop={anim && !reduced ? anim.sow.from : null} weigh={view.weigh}
            markDelay={anim ? Math.round(hopMs * LAND) : 0}
            idleActor={!anim && !pick && game.phase !== 'over' ? game.turn : null}
            trail={anim ? null : view.trail} onHover={myTurn && game.phase === 'play' ? setHover : undefined} />
        </div>
      </div>

      {/* 下方（手機）／右欄（桌機） */}
      <div className="mt-3 flex w-full max-w-[520px] flex-col gap-3 lg:mt-0 lg:w-[400px] lg:max-w-none lg:shrink-0">
        <div className="hidden lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-4xl font-black leading-none">{t.title}</h1>
              <p className="mt-1.5 text-sm font-bold text-ink-soft">{t.altName ? `${t.altName} · ` : ''}{modeLabel}</p>
            </div>
            {soundButton}
          </div>
          <div className="mt-4">{statusBlock}</div>
          {coach && <div className="mt-3">{coach}</div>}
        </div>
        {pick && preview && (
          <OrderEditor t={t} from={pick.from} pieces={game.board[pick.from]} order={pick.order} sel={pick.sel} preview={preview}
            names={names} endsText={endsText} outcomes={outcomes}
            onLast={(o) => openEditor(pick.from, o)} onSlot={onSlot} onColour={(c) => setPick({ ...pick, colour: c })}
            onSuggest={() => openEditor(pick.from)} onCancel={() => setPick(null)} onSow={onSow} />
        )}
        {balanceCard}
        <div className={pick ? 'hidden lg:block' : ''}>{scorePanel}</div>
        <div className="hidden grid-cols-2 gap-2 lg:grid">
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{t.howTo}</button>
          <button type="button" onClick={askLeave} className={wide}><LuHouse aria-hidden="true" />{t.home}</button>
        </div>
      </div>

      {/* 說明：跟規則頁同一份七步，一次一步、可以左右滑（MancalaRulesSteps）。不放會離開對局的連結 */}
      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rulesHeading} kicker={t.title}
        icon={GiRuleBook} band={MCL_BAND} panelClassName={MCL_PANEL}>
        <RulesStepsPaged open={helpOpen} prev={msgs.ui.prev} next={msgs.ui.next} done={msgs.ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>

      <Modal isOpen={leave.open} onClose={leave.cancel} title={online ? t.leaveTitleOnline : t.leaveTitle} icon={GiExitDoor}
        band={MCL_BAND} panelClassName={MCL_PANEL}
        footer={
          <>
            <button type="button" className="mcl-cloth flex-1 py-3.5 font-black" onClick={leave.cancel}>{t.stay}</button>
            <button type="button" className="mcl-plaque flex-1 py-3.5 font-black" onClick={leave.confirm}>
              {online ? t.leaveOnline : t.leave}
            </button>
          </>
        }>
        <p className="text-sm leading-relaxed">{online ? t.leaveBodyOnline : t.leaveBody}</p>
      </Modal>

      {/* 結算：圖本身就是對話框（ShareResultModal），再來一局是黃銅牌；關掉就留在終局的盤面上看 */}
      <ShareResultModal isOpen={endOpen} onClose={() => setEndClosed(true)} title={endTitle} card={share}
        onRestart={onAgain} restartLabel={t.again} srText={srText} frameClassName="" classes={MCL_SHARE} />
    </MancalaFrame>
  );
}
