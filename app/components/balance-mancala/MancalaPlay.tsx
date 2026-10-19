'use client';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { GiExitDoor, GiLaurelCrown, GiRuleBook, GiScales } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuSlidersHorizontal } from 'react-icons/lu';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useTransition } from '@/contexts/TransitionContext';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { TEXT } from '@/games/balance-mancala/text';
import {
  createGame, place, applyMove, sow, sourcesOf, legalPlacements, standings, isLegalMove, letterOf, COLOURS, DEFAULT_PIECES,
  type Colour, type MancalaState, type Move, type Seat, type Sow,
} from '@/games/balance-mancala/engine';
import { chooseMove, choosePlacement, personalityOf, suggestColour, suggestMove } from '@/games/balance-mancala/ai';
import { humanSeatsOf, type MatchSetup } from './match';
import { DISH_BG, GOLD, NAVY, cellName, seatLook } from './palette';
import MancalaRing, { type RingMark } from './MancalaRing';
import ScorePanel from './ScorePanel';
import OrderEditor from './OrderEditor';
import MancalaRules from './MancalaRules';
import PieceDisc from './PieceDisc';

/** 節奏（毫秒）。電腦每手約 1.5–2 秒；點盤面可以直接跳過播種動畫 */
const TIMING = { place: 260, think: 320, lift: 150, step: 190, stepHuman: 140, hold: 480, holdHuman: 360 };

type Anim = { move: Move; sow: Sow; step: number; by: Seat };
type Pick = { from: number; order: Seat[]; colour?: Colour; sel: number | null };

const motionQuery = '(prefers-reduced-motion: reduce)';
function subscribeMotion(cb: () => void) {
  const mq = window.matchMedia(motionQuery);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

/**
 * 對局畫面（跟電腦玩、多人同一台共用）。只持有一個不可變的 MancalaState，規則全在 engine。
 *
 * 一手的流程：點起點格 → 排序編輯器（預設是電腦建議的排法，盤面畫出播完的樣子）→ 播下去 →
 * 一顆一顆落下的動畫 → 動畫播完才 applyMove。電腦的回合也走同一條動畫。
 * 動畫跟局面分開存（anim），套用那一刻 setGame 與 setAnim(null) 在同一個事件裡 —— 驅動電腦的 effect
 * 依賴兩者，不會出現「局面還沒換、動畫已經清掉」的中間狀態而重複出手（CLAUDE.md〈單人對戰〉的教訓）。
 *
 * 版面：手機直式上面圓盤、下面分數（選了起點格時分數換成排序編輯器）；桌機（lg）左盤右欄。
 */
export default function MancalaPlay({ locale, setup, onSettings, onAgain }: {
  locale: Locale;
  setup: MatchSetup;
  onSettings: () => void;
  onAgain: () => void;
}) {
  const t = useTextTable(TEXT);
  const { navigate } = useTransition();
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
  // 動畫播完的計時器與「點盤面跳過」可能落在同一個 tick：同一手只能套用一次
  const applied = useRef<Anim | null>(null);
  const finish = useCallback((a: Anim) => {
    if (applied.current === a) return;
    applied.current = a;
    setGame((g) => applyMove(g, a.move));
    setAnim(null);
  }, []);

  // 電腦的回合：讓出一點時間再算（一手幾毫秒），看起來也像在想
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
  const view = useMemo((): { board: Seat[][]; incoming?: Set<number>; emptied?: number; dropped?: number | null; mark: RingMark | null } => {
    const markOf = (r: Sow, faded: boolean): RingMark => ({ cell: r.cell, owner: r.owner, points: r.points, colour: r.colour, faded });
    if (anim) {
      const board = game.board.map((c, i) => (i === anim.sow.from ? [] : c.slice()));
      for (let j = 0; j < anim.step; j++) board[anim.sow.path[j]].push(anim.sow.order[j]);
      const done = anim.step >= anim.sow.order.length;
      return { board, emptied: anim.sow.from, dropped: anim.step > 0 ? anim.sow.path[anim.step - 1] : null, mark: done ? markOf(anim.sow, false) : null };
    }
    if (pick && preview) return { board: preview.board, incoming: new Set(preview.path), emptied: pick.from, mark: markOf(preview, false) };
    return { board: game.board, mark: game.last ? markOf(game.last, true) : null };
  }, [anim, pick, preview, game]);

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
  // 第二行：電腦播種時提示可以跳過動畫，其他時候是上一手做了什麼
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

  const home = () => navigate(localePath(locale, '/'));
  const askLeave = (where: 'home' | 'settings') => {
    if (inProgress) setLeaving(where);
    else if (where === 'home') home();
    else onSettings();
  };

  const round = 'grid size-11 place-items-center rounded-full bg-tile-ink/[0.07] text-xl text-ink-soft transition hover:bg-tile-ink/[0.12]';
  const wide = 'flex h-11 items-center justify-center gap-2 rounded-2xl bg-tile-ink/[0.07] text-sm font-black text-tile-ink transition hover:bg-tile-ink/[0.12]';

  const center = over ? (
    <>
      <GiLaurelCrown aria-hidden="true" style={{ color: GOLD, width: '11cqw', height: '11cqw' }} />
      <p className="mt-[1cqw] font-black leading-tight" style={{ fontSize: '3.6cqw' }}>{t.over}</p>
      {endClosed && (
        <button type="button" onClick={() => setEndClosed(false)} className="mt-[2cqw] rounded-full bg-tile-cream px-[3cqw] py-[1.2cqw] font-black text-tile-ink" style={{ fontSize: '3cqw' }}>
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

  // 手機上圓盤讓出分數面板的高度（每席約 2.75rem），整頁塞得進一個畫面
  const ringMax = `max(15rem, min(100%, calc(100dvh - ${8.5 + setup.seats * 2.75}rem)))`;

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pb-5 pt-3 font-[family-name:var(--font-app)] lg:flex-row lg:items-start lg:justify-center lg:gap-10 lg:pt-8">
      {/* 手機的上方一排 */}
      <div className="flex w-full max-w-[520px] items-center justify-between lg:hidden">
        <button type="button" onClick={() => askLeave('home')} aria-label={t.home} className={round}><LuHouse aria-hidden="true" /></button>
        <h1 className="truncate px-2 text-lg font-black">{t.title}</h1>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={round}><LuCircleHelp aria-hidden="true" /></button>
          <button type="button" onClick={() => askLeave('settings')} aria-label={t.settings} className={round}><LuSlidersHorizontal aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-1 w-full max-w-[520px] lg:hidden">{statusBlock}</div>

      {/* 圓盤：夜空藍的實色磁磚 */}
      <div className="mt-1 w-full lg:mt-0 lg:!max-w-[min(600px,calc(100dvh-4rem))] lg:flex-1" style={{ maxWidth: ringMax }}>
        <div className="rounded-[2rem] p-[3%]" style={{ background: NAVY }}>
          <MancalaRing board={view.board} colourShort={t.colourShort} highLabel={t.high} lowLabel={t.low} ariaOf={ariaOf}
            selectable={selectable} dimOthers={!pick} selected={pick?.from ?? null} incoming={view.incoming} emptied={view.emptied}
            dropped={view.dropped} dropKey={anim?.step ?? 0} mark={view.mark} onPick={onPick} center={center} />
        </div>
      </div>

      {/* 下方（手機）／右欄（桌機） */}
      <div className="mt-3 flex w-full max-w-[520px] flex-col gap-3 lg:mt-0 lg:w-[400px] lg:max-w-none lg:shrink-0">
        <div className="hidden lg:block">
          <h1 className="text-4xl font-black leading-none">{t.title}</h1>
          <p className="mt-1.5 text-sm font-bold text-ink-soft">{t.altName ? `${t.altName} · ` : ''}{solo ? t.modeSolo : t.modeLocal}</p>
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
        icon={GiRuleBook} band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}>
        <MancalaRules t={t} />
      </Modal>

      <Modal isOpen={leaving !== null} onClose={() => setLeaving(null)} title={t.leaveTitle} icon={GiExitDoor}
        band={{ className: 'bg-tile-ink', fg: 'text-tile-cream' }}
        footer={
          <>
            <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={() => setLeaving(null)}>{t.stay}</Button>
            <Button color="bg-tile-ink text-tile-cream" handleClickEvent={() => {
              const where = leaving;
              setLeaving(null);
              if (where === 'home') home(); else onSettings();
            }}>{t.leave}</Button>
          </>
        }>
        <p className="text-sm leading-relaxed">{t.leaveBody}</p>
      </Modal>

      <Modal isOpen={over && !endClosed} onClose={() => setEndClosed(true)} title={endTitle} kicker={t.gameOver}
        icon={soleWinner === null ? GiScales : GiLaurelCrown}
        band={soleWinner === null
          ? { className: 'bg-tile-ink', fg: 'text-tile-cream' }
          : { style: { backgroundColor: seatLook(soleWinner).bg }, fg: seatLook(soleWinner).fgClass }}
        footer={
          <>
            <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={onSettings}>{t.settings}</Button>
            <Button color="bg-tile-ink text-tile-cream" handleClickEvent={onAgain}>{t.again}</Button>
          </>
        }>
        {endReason && <p className="text-sm leading-relaxed">{endReason}</p>}
        <ol className="mt-4 flex flex-col gap-2">
          {table.map((r) => {
            const win = r.rank === 1;
            const look = seatLook(r.seat);
            return (
              <li key={r.seat} className={`flex items-center gap-3 rounded-2xl px-3 ${win ? 'py-3' : 'bg-tile-ink/[0.05] py-2 text-ink-soft'}`}
                style={win ? { background: look.bg, color: look.fg } : undefined}>
                <span className="w-12 shrink-0 text-xs font-black">{fill(t.rank, { n: r.rank })}</span>
                <PieceDisc seat={r.seat} size={win ? '2rem' : '1.5rem'} className={win ? '' : 'opacity-50'} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate font-black ${win ? 'text-base' : 'text-sm'}`}>{names[r.seat]}</p>
                  <p className="flex gap-2 text-[11px] font-bold">
                    {COLOURS.map((c) => (
                      <span key={c} className="flex items-center gap-1">
                        <span aria-hidden="true" className="inline-block size-2 rounded-full" style={{ background: DISH_BG[c], opacity: win ? 1 : 0.5 }} />
                        {t.colourShort[c]} {r.scores[c]}
                      </span>
                    ))}
                  </p>
                </div>
                <span className={`font-black tabular-nums ${win ? 'text-3xl' : 'text-xl'}`}>{r.final}</span>
              </li>
            );
          })}
        </ol>
      </Modal>
    </div>
  );
}
