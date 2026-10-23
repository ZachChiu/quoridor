'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { GiExitDoor, GiLaurelCrown, GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuSlidersHorizontal, LuVolume2, LuVolumeX } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { useTransition } from '@/contexts/TransitionContext';
import { useSound } from '@/hook/useSound';
import { fill, useTextTable } from '@/i18n/gameText';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { localePath, type Locale } from '@/i18n/locales';
import { BALANCE_MANCALA } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';
import {
  createGame, place, applyMove, sow, sourcesOf, legalPlacements, standings, isLegalMove, letterOf, isSpecial, ANGEL, DEFAULT_PIECES,
  type Colour, type MancalaState, type Move, type Seat, type Sow,
} from '@/games/balance-mancala/engine';
import { chooseMove, choosePlacement, personalityOf, suggestColour, suggestMove } from '@/games/balance-mancala/ai';
import { humanSeatsOf, type MatchSetup } from './match';
import { BRASS, MCL_BAND, MCL_PANEL, WOOD, cellName } from './palette';
import { MCL_ROUND, MCL_SHARE, MCL_WIDE } from './styles';
import { playMancala } from './sounds';
import { MCL_CARD_IMAGES, drawMancalaCard, type MancalaCardData } from './shareCard';
import MancalaFrame from './MancalaFrame';
import MancalaRing, { LAND, type RingMark } from './MancalaRing';
import ScorePanel from './ScorePanel';
import OrderEditor from './OrderEditor';
import MancalaRules from './MancalaRules';
import PieceDisc from './PieceDisc';

/** 節奏（毫秒）。AI 每手約 1.5–2 秒；點盤面可以直接跳過播種動畫。hop／hopHuman 是一顆種子跳一格的時間（比間隔長一點，前後兩顆會交疊） */
const TIMING = { place: 260, think: 320, lift: 150, step: 190, stepHuman: 140, hold: 480, holdHuman: 360, hop: 230, hopHuman: 180 };

type Anim = { move: Move; sow: Sow; step: number; by: Seat };
type Pick = { from: number; order: Seat[]; colour?: Colour; sel: number | null };

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(motionQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/**
 * 對局畫面（跟 AI 玩、本機對戰共用）。只持有一個不可變的 MancalaState，規則全在 engine。
 *
 * 一手的流程：點起點格 → 排序編輯器（預設是 AI 建議的排法，盤面畫出播完的樣子）→ 播下去 →
 * 一顆一顆落下的動畫 → 動畫播完才 applyMove。AI 的回合也走同一條動畫。
 * 動畫跟局面分開存（anim），套用那一刻 setGame 與 setAnim(null) 在同一個事件裡 —— 驅動 AI 的 effect
 * 依賴兩者，不會出現「局面還沒換、動畫已經清掉」的中間狀態而重複出手（CLAUDE.md〈單人對戰〉的教訓）。
 *
 * 版面：手機直式上面圓盤、下面分數（選了起點格時分數換成排序編輯器）；桌機（lg）左盤右欄。
 * 整頁是同一塊 Adinkra 印花布（MancalaFrame），盤面是一塊圓的木頭（WOOD），軌道線與勝利的桂冠是黃銅。
 */
export default function MancalaPlay({ locale, setup, onSettings, onAgain }: {
  locale: Locale;
  setup: MatchSetup;
  onSettings: () => void;
  onAgain: () => void;
}) {
  const t = useTextTable(TEXT);
  const gt = useGameText();
  const msgs = useMessages();
  const { navigate } = useTransition();
  const { prefs: soundPrefs, setPrefs: setSoundPrefs } = useSound();
  const humans = useMemo(() => humanSeatsOf(setup), [setup]);
  const isHuman = useCallback((seat: Seat) => humans.includes(seat), [humans]);
  const solo = setup.mode === 'solo';
  const [game, setGame] = useState<MancalaState>(() => createGame({ seats: setup.seats, pieces: DEFAULT_PIECES }));
  const [anim, setAnim] = useState<Anim | null>(null);
  const [pick, setPick] = useState<Pick | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leaving, setLeaving] = useState<'home' | 'settings' | null>(null);
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

  // 播種動畫：一顆一顆落下，最後停一下讓人看清楚誰得幾分，然後才真的套用
  useEffect(() => {
    if (!anim) return;
    const total = anim.sow.order.length;
    const human = isHuman(anim.by);
    if (anim.step < total) {
      const delay = reduced ? 0 : anim.step === 0 ? TIMING.lift : human ? TIMING.stepHuman : TIMING.step;
      const id = window.setTimeout(() => setAnim((a) => (a ? { ...a, step: reduced ? total : a.step + 1 } : a)), delay);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => finish(anim), human ? TIMING.holdHuman : TIMING.hold);
    return () => window.clearTimeout(id);
  }, [anim, reduced, isHuman, finish]);

  // 一顆一顆落地的聲音：step 每多 1 就響一聲（減少動態效果時 step 一次跳到底，只響最後那一下）
  useEffect(() => {
    if (!anim) return;
    const snd = sounded.current;
    if (snd.move !== anim.move) sounded.current = { move: anim.move, step: 0, scored: false };
    const cur = sounded.current;
    if (anim.step === cur.step || cur.scored) return;
    cur.step = anim.step;
    const human = isHuman(anim.by);
    const delay = reduced ? 0 : ((human ? TIMING.hopHuman : TIMING.hop) * LAND) / 1000;
    const total = anim.sow.order.length;
    if (anim.step >= total) { cur.scored = true; scoreSound(anim.sow, delay); return; }
    // 這一格在這顆落下之前已經有幾顆（種子碰種子的聲音）
    const j = anim.step - 1;
    const cell = anim.sow.path[j];
    const crowd = (cell === anim.sow.from ? 0 : game.board[cell].length) + anim.sow.path.slice(0, j).filter((c) => c === cell).length;
    playMancala({ kind: 'seed', index: j, crowd, delay });
  }, [anim, reduced, isHuman, scoreSound, game.board]);

  // 開局放子：每放一顆響一聲；結束：分出勝負的那一手套用之後，贏、輸各一段（本機對戰一律是慶祝的那段）
  const heard = useRef({ placements: game.placements.length, moves: game.moves.length });
  useEffect(() => {
    const prev = heard.current;
    heard.current = { placements: game.placements.length, moves: game.moves.length };
    if (game.placements.length === prev.placements + 1) {
      const cell = game.placements[game.placements.length - 1];
      playMancala({ kind: 'place', crowd: game.board[cell].length - 1, delay: reduced ? 0 : 0.1 });
    }
    if (game.moves.length === prev.moves + 1 && game.phase === 'over') {
      const won = !solo || standings(game).some((r) => r.rank === 1 && r.seat === humans[0]);
      playMancala({ kind: won ? 'win' : 'lose', delay: 0.35 });
    }
  }, [game, reduced, solo, humans]);

  // 電腦版的「確定要離開嗎？」—— 只管整頁跳轉（CLAUDE.md〈離開前確認〉），手機另靠房子鈕的確認
  const inProgress = game.phase !== 'over' && game.placements.length > 0;
  useEffect(() => {
    if (!inProgress) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [inProgress]);

  const preview = useMemo(() => (pick ? sow(game, pick.from, pick.order, pick.colour) : null), [game, pick]);
  const myTurn = !anim && game.phase !== 'over' && isHuman(game.turn);
  const selectable = useMemo(
    () => (myTurn ? new Set(game.phase === 'setup' ? legalPlacements(game) : sourcesOf(game)) : null),
    [myTurn, game],
  );

  const openEditor = (from: number, last?: Seat) => {
    const m = suggestMove(game, from, last) ?? { from, order: game.board[from].slice() };
    setPick({ from, order: m.order, colour: m.colour, sel: null });
  };

  const onPick = (cell: number) => {
    if (anim) { finish(anim); return; } // 點盤面跳過動畫
    if (!myTurn || !selectable?.has(cell)) return;
    if (game.phase === 'setup') { setGame(place(game, cell)); return; }
    if (pick?.from === cell) { setPick(null); return; }
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
    setPick(null);
    startSow(game, move);
  };

  // 盤面要畫哪一個局面：動畫中的半途、排序預覽（播完的樣子）、或現在的局面
  const view = useMemo((): {
    board: Seat[][]; incoming?: Set<number>; emptied?: number; dropped?: number | null; dropKey?: number; mark: RingMark | null;
    flight?: { from: number; to: number; seat: Seat } | null; weigh?: number | null;
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
    if (pick && preview) return { board: preview.board, incoming: new Set(preview.path), emptied: pick.from, mark: markOf(preview, false) };
    // 開局放子：剛放的那一顆從上面落下（沒有來源格，不飛）
    const placed = game.moves.length === 0 ? game.placements[game.placements.length - 1] ?? null : null;
    return { board: game.board, dropped: placed, dropKey: game.placements.length, mark: game.last ? markOf(game.last, true) : null };
  }, [anim, pick, preview, game]);

  // 一顆種子跳一格的時間；0＝不飛（不在播種、或減少動態效果）
  const hopMs = anim && !reduced ? (isHuman(anim.by) ? TIMING.hopHuman : TIMING.hop) : 0;

  const ariaOf = (cell: number) => {
    const owners = view.board[cell];
    const base = fill(t.cellAria, { cell: cellName(cell, t), n: owners.length });
    return owners.length ? `${base}: ${owners.map(letterOf).join(' ')}` : base;
  };

  // 狀態列
  const actor = anim ? anim.by : game.turn;
  const status = game.phase === 'over' && !anim ? t.over
    : anim ? fill(t.sowing, { name: names[anim.by] })
    : game.phase === 'setup'
      ? (isHuman(actor) ? (solo ? t.setupYou : fill(t.setupHuman, { name: names[actor] })) : fill(t.setupComputer, { name: names[actor] }))
      : (isHuman(actor) ? (solo ? t.turnYou : fill(t.turnHuman, { name: names[actor] })) : fill(t.thinking, { name: names[actor] }));
  const last = game.last;
  const lastMover = game.phase === 'over' ? game.turn : (game.turn - 1 + setup.seats) % setup.seats;
  // 第二行：AI 播種時提示可以跳過動畫，其他時候是上一手做了什麼
  const lastLine = anim ? (isHuman(anim.by) || reduced ? '' : t.skipHint)
    : last && last.colour !== null
      ? fill(t.lastMove, { name: names[lastMover], cell: cellName(last.from, t), n: last.order.length, owner: names[last.owner], colour: t.colourShort[last.colour], points: last.points })
      : '';

  // 這一手會結束遊戲：先告訴玩家結束時的名次
  const endsText = preview?.ends ? (() => {
    const st = standings({ scores: preview.scores });
    if (solo) return fill(t.endsWarn, { rank: st.find((r) => r.seat === humans[0])!.rank });
    return fill(t.endsWarnLocal, { name: st.filter((r) => r.rank === 1).map((r) => names[r.seat]).join(' · ') });
  })() : null;

  // 結算
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
      kicker: `${gt.champion.matchOver} · ${solo ? t.modeSolo : t.modeLocal}`,
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
  });
  const srText = [endTitle, endReason, ...table.map((r) => `${fill(t.rank, { n: r.rank })} ${names[r.seat]}: ${t.colourShort.map((c, k) => `${c} ${r.scores[k]}`).join(', ')}; ${t.final} ${r.final}`)].join(' ');

  const home = () => navigate(localePath(locale, '/'));
  const askLeave = (where: 'home' | 'settings') => {
    if (inProgress) setLeaving(where);
    else if (where === 'home') home();
    else onSettings();
  };

  // 角落的小鈕是切角的淡布片（黃銅留給主要動作），寬的是一條印花布（上下兩道梳線）—— styles.ts、globals.css 的 .mcl-*
  const round = MCL_ROUND;
  const wide = MCL_WIDE;
  const soundButton = (
    <button type="button" onClick={() => setSoundPrefs({ sfx: !soundPrefs.sfx })} aria-pressed={soundPrefs.sfx} aria-label={gt.sound.button} className={round}>
      {soundPrefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );

  const center = over ? (
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
      colourShort={t.colourShort} finalLabel={t.final} />
  );

  const statusBlock = (
    <div className="flex min-h-11 flex-col items-center justify-center text-center lg:items-start lg:text-left" aria-live="polite">
      <p className="text-sm font-black">{status}</p>
      {lastLine && <p className="mt-0.5 text-xs font-bold text-ink-soft">{lastLine}</p>}
    </div>
  );

  // 手機上圓盤讓出分數面板的高度（每席約 2.75rem）與上下兩條布邊（各 20px），整頁塞得進一個畫面
  const ringMax = `max(15rem, min(100%, calc(100dvh - ${11 + setup.seats * 2.75}rem)))`;

  return (
    <MancalaFrame className="items-center px-4 pb-5 pt-3 lg:flex-row lg:items-start lg:justify-center lg:gap-10 lg:pt-8">
      {/* 手機的上方一排：左右各兩顆，標題用三欄置中（兩邊數量一樣，標題才在正中間） */}
      <div className="grid w-full max-w-[520px] grid-cols-[1fr_auto_1fr] items-center lg:hidden">
        <div className="flex gap-1.5 justify-self-start">
          <button type="button" onClick={() => askLeave('home')} aria-label={t.home} className={round}><LuHouse aria-hidden="true" /></button>
          {soundButton}
        </div>
        <h1 className="truncate px-2 text-lg font-black">{t.title}</h1>
        <div className="flex gap-1.5 justify-self-end">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={round}><LuCircleHelp aria-hidden="true" /></button>
          <button type="button" onClick={() => askLeave('settings')} aria-label={t.settings} className={round}><LuSlidersHorizontal aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-1 w-full max-w-[520px] lg:hidden">{statusBlock}</div>

      {/* 圓盤：一塊圓的木頭（Oware 棋盤的木色），盤子嵌在上面 */}
      <div className="mt-1 w-full lg:mt-0 lg:!max-w-[min(600px,calc(100dvh-7.5rem))] lg:flex-1" style={{ maxWidth: ringMax }}>
        <div className="rounded-full p-[3%]" style={{ background: WOOD }}>
          <MancalaRing board={view.board} colourShort={t.colourShort} highLabel={t.high} lowLabel={t.low} ariaOf={ariaOf}
            selectable={selectable} dimOthers={!pick} selected={pick?.from ?? null} incoming={view.incoming} emptied={view.emptied}
            dropped={view.dropped} dropKey={view.dropKey ?? 0} mark={view.mark} onPick={onPick} center={center}
            flight={view.flight} hopMs={hopMs} scoop={anim && !reduced ? anim.sow.from : null} weigh={view.weigh}
            markDelay={anim ? Math.round(hopMs * LAND) : 0}
            idleActor={!anim && !pick && game.phase !== 'over' ? game.turn : null} />
        </div>
      </div>

      {/* 下方（手機）／右欄（桌機） */}
      <div className="mt-3 flex w-full max-w-[520px] flex-col gap-3 lg:mt-0 lg:w-[400px] lg:max-w-none lg:shrink-0">
        <div className="hidden lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-4xl font-black leading-none">{t.title}</h1>
              <p className="mt-1.5 text-sm font-bold text-ink-soft">{t.altName ? `${t.altName} · ` : ''}{solo ? t.modeSolo : t.modeLocal}</p>
            </div>
            {soundButton}
          </div>
          <div className="mt-4">{statusBlock}</div>
        </div>
        {pick && preview && (
          <OrderEditor t={t} from={pick.from} pieces={game.board[pick.from]} order={pick.order} sel={pick.sel} preview={preview}
            names={names} endsText={endsText}
            onLast={(o) => openEditor(pick.from, o)} onSlot={onSlot} onColour={(c) => setPick({ ...pick, colour: c })}
            onSuggest={() => openEditor(pick.from)} onCancel={() => setPick(null)} onSow={onSow} />
        )}
        <div className={pick ? 'hidden lg:block' : ''}>{scorePanel}</div>
        <div className="hidden grid-cols-3 gap-2 lg:grid">
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{t.howTo}</button>
          <button type="button" onClick={() => askLeave('settings')} className={wide}><LuSlidersHorizontal aria-hidden="true" />{t.settings}</button>
          <button type="button" onClick={() => askLeave('home')} className={wide}><LuHouse aria-hidden="true" />{t.home}</button>
        </div>
      </div>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rulesHeading} kicker={t.title}
        icon={GiRuleBook} band={MCL_BAND} panelClassName={MCL_PANEL}>
        <MancalaRules t={t} />
      </Modal>

      <Modal isOpen={leaving !== null} onClose={() => setLeaving(null)} title={t.leaveTitle} icon={GiExitDoor}
        band={MCL_BAND} panelClassName={MCL_PANEL}
        footer={
          <>
            <button type="button" className="mcl-cloth flex-1 py-3.5 font-black" onClick={() => setLeaving(null)}>{t.stay}</button>
            <button type="button" className="mcl-plaque flex-1 py-3.5 font-black" onClick={() => {
              const where = leaving;
              setLeaving(null);
              if (where === 'home') home(); else onSettings();
            }}>{t.leave}</button>
          </>
        }>
        <p className="text-sm leading-relaxed">{t.leaveBody}</p>
      </Modal>

      {/* 結算：圖本身就是對話框（ShareResultModal），再來一局是黃銅牌；關掉就留在終局的盤面上看 */}
      <ShareResultModal isOpen={endOpen} onClose={() => setEndClosed(true)} title={endTitle} card={share}
        onRestart={onAgain} restartLabel={t.again} srText={srText} frameClassName="" classes={MCL_SHARE} />
    </MancalaFrame>
  );
}
