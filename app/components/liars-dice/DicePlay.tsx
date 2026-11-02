'use client';
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { GiExitDoor, GiLaurelCrown } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuMinus, LuPlus, LuVolume2, LuVolumeX } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { useSound } from '@/hook/useSound';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { decide, hitChance, type Action } from '@/games/liars-dice/ai';
import {
  FACE_ORDER, callExact, canExact, challenge, countMatching, minCountFor, newGame, nextRound, placeBid, totalDice,
  type Bid, type Face, type State,
} from '@/games/liars-dice/engine';
import { TEXT, type LiarsDiceText } from '@/games/liars-dice/text';
import Die, { Cup } from './Die';
import HowToModal from './HowToModal';
import LdFrame from './LdFrame';
import type { DiceMode } from './modeHash';
import { LD_BAND, LD_PANEL, SEAT_HEX } from './palette';
import { playBid, playEnd, playGain, playLand, playLose, playReveal, playShake } from './sounds';

const roundBtn = 'ld-btn is-quiet grid size-11 shrink-0 place-items-center text-xl';

/** 一口的念法：模板裡的 {n} 換成個數、{f} 換成一顆骰子 */
function BidWords({ t, bid, die = 'size-[1.1em]', tone }: { t: LiarsDiceText; bid: Bid; die?: string; tone?: 'ink' }) {
  const parts = t.bidText.split(/(\{n\}|\{f\})/);
  return (
    <span className="inline-flex items-center gap-[0.25em] whitespace-nowrap">
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p === '{n}' ? <span className="tabular-nums">{bid.count}</span> : p === '{f}' ? <Die face={bid.face} className={die} tone={tone} /> : p.trim() && <span>{p.trim()}</span>}
        </Fragment>
      ))}
    </span>
  );
}

/** 給讀屏的一口（骰子是圖，讀不出來） */
const bidLabel = (t: LiarsDiceText, bid: Bid) => fill(t.bidText, { n: bid.count, f: bid.face });

/** 輪到人的時候，預設先選好的那一口：跟著場上的點數加一個；還沒人喊就喊自己最多的點數一個 */
function defaultBid(g: State, seat: number): Bid {
  if (g.bid) {
    const c = minCountFor(g, g.bid.face);
    if (c !== null) return { count: c, face: g.bid.face };
  }
  const faces = FACE_ORDER.filter((f) => f !== 1 && minCountFor(g, f) !== null);
  const face = faces.reduce((b, f) => (countMatching(g.dice[seat], f, g.options.wild) > countMatching(g.dice[seat], b, g.options.wild) ? f : b), faces[0] ?? 1);
  // 第一口先放「自己手上的＋別人的期望值打個七折」，從 1 個開始按 + 要按很多下
  const mine = countMatching(g.dice[seat], face, g.options.wild);
  const unseen = totalDice(g) - g.dice[seat].length;
  return { count: Math.max(1, mine + Math.floor(unseen * hitChance(face, g.options.wild) * 0.7)), face };
}

/**
 * 一局大話骰。只持有一個不可變的 State（engine），電腦的回合由 effect 排一個 timer 去問 ai.ts。
 *
 * - 對電腦：自己固定是第 0 位（紅方），自己的骰子一直攤在下方、外面一圈框（畫面上不寫「你」，讀屏念 mine）。
 * - 同一台輪流：輪到誰，下方先蓋著「交給藍方」，那個人按「看骰子」才攤開；喊完就再蓋起來給下一個人。
 * - 開了之後全部掀開：每個人的骰子排一列，算進去的那幾顆外面一圈胭脂蟲紅。
 */
export default function DicePlay({ mode, onMenu, onAgain }: { mode: DiceMode; onMenu: () => void; onAgain: () => void }) {
  const t = useTextTable(TEXT);
  const g0 = useGameText();
  const { prefs, setPrefs } = useSound();
  const [g, setG] = useState(() => newGame(mode.players, { wild: mode.wild, exact: mode.exact }, Math.random, Math.floor(Math.random() * mode.players)));
  const local = mode.opponent === 'local';
  const isAi = (seat: number) => !local && seat !== 0;
  /** 同一台輪流：現在攤開的是誰的骰子（換人就蓋回去） */
  const [peeked, setPeeked] = useState<number | null>(null);
  const [sel, setSel] = useState<Bid | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const side = (seat: number) => t.seats[seat];

  // 電腦的 timer 回來時確認局面還是同一個（中途悔棋、重開都不算）
  const gRef = useRef(g);
  useEffect(() => { gRef.current = g; });

  const leave = useLeaveGuard({ live: g.phase !== 'over', inProgress: g.phase !== 'over' && (g.round > 1 || g.calls.length > 0) });

  // 開局搖一次骰盅（從選單點進來的那一下就是使用者手勢，聲音出得來）
  useEffect(() => {
    playShake();
    const id = window.setTimeout(() => playLand(5), 800);
    return () => window.clearTimeout(id);
  }, []);

  const apply = (prev: State, a: Action): State => {
    if (a.type === 'bid') {
      playBid(a.bid.count);
      return placeBid(prev, a.bid);
    }
    const next = a.type === 'exact' ? callExact(prev) : challenge(prev);
    playReveal();
    window.setTimeout(() => {
      if (next.last?.gainer !== null) playGain(); else playLose();
      if (next.phase === 'over') window.setTimeout(() => playEnd(local || next.winner === 0), 500);
    }, 650);
    return next;
  };

  // 電腦的回合：想一下再出手（太快看不出誰喊了什麼）
  useEffect(() => {
    if (g.phase !== 'bidding' || !isAi(g.turn)) return;
    const id = window.setTimeout(() => {
      if (gRef.current !== g) return;
      const a = decide(g, g.turn, mode.opponent === 'ai' ? mode.level : 'normal', Math.random);
      setG(apply(g, a));
    }, 900 + Math.random() * 700);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只看局面換了沒
  }, [g]);

  // 分出勝負：先讓大家看一下掀開的骰子，再跳結算
  useEffect(() => {
    if (g.phase !== 'over') return;
    const id = window.setTimeout(() => setEndOpen(true), 1600);
    return () => window.clearTimeout(id);
  }, [g.phase]);

  /** 下方那一排是誰的骰子：對電腦是自己；同一台輪流是按了「看骰子」的那個人 */
  const bottom = local ? peeked : 0;
  const myTurn = g.phase === 'bidding' && !isAi(g.turn) && (!local || peeked === g.turn);
  const needPass = local && g.phase === 'bidding' && peeked !== g.turn;

  // 輪到人的時候先選好一口；換人或局面換了就重選
  const turnKey = `${g.round}-${g.calls.length}-${g.turn}`;
  const [selKey, setSelKey] = useState('');
  if (myTurn && selKey !== turnKey) {
    setSelKey(turnKey);
    setSel(defaultBid(g, g.turn));
  }

  const act = (a: Action) => {
    setG(apply(g, a));
    if (local) setPeeked(null);
  };
  const next = () => {
    if (g.phase !== 'reveal') return;
    setG(nextRound(g, Math.random));
    setPeeked(null);
    playShake();
    window.setTimeout(() => playLand(5), 800);
  };

  const total = totalDice(g);
  const wildNow = g.options.wild && !g.zhai;
  const ruleChip = !g.options.wild ? t.wildOff : g.zhai ? t.zhaiOn : t.wildOn;
  const topSeats = useMemo(() => g.dice.map((_, i) => i).filter((i) => local || i !== 0), [g.dice, local]);
  const lastCall = (seat: number) => [...g.calls].reverse().find((c) => c.seat === seat)?.bid;

  const seatChip = (seat: number) => {
    const n = g.dice[seat].length;
    const turn = g.phase === 'bidding' && g.turn === seat;
    const call = g.phase === 'bidding' ? lastCall(seat) : undefined;
    return (
      <li key={seat} className={`flex min-w-0 flex-col items-center gap-1 text-[11px] font-black lg:text-sm ${n ? '' : 'opacity-35'}`}>
        <Cup color={SEAT_HEX[seat]} lifted={turn} className="w-11 lg:w-16" />
        <span className={`whitespace-nowrap border-b-2 ${turn ? 'border-[#c9b17b]' : 'border-transparent'}`}>
          {side(seat)}{!local && seat === 0 && <span className="sr-only">{t.mine}</span>}
        </span>
        <span className="whitespace-nowrap opacity-70">{n ? fill(t.diceLeft, { n }) : t.out}</span>
        <span className={`min-h-6 rounded-[3px] px-1.5 py-0.5 text-xs ${call ? 'bg-[#8a3536]' : ''}`}>
          {call && <><span className="sr-only">{bidLabel(t, call)}</span><span aria-hidden="true"><BidWords t={t} bid={call} die="size-3.5" /></span></>}
        </span>
      </li>
    );
  };

  const center: ReactNode = g.phase === 'bidding' ? (
    <div className="flex flex-col items-center gap-1 text-center" aria-live="polite">
      {g.bid && g.bidder !== null ? (
        <>
          <p className="text-sm font-black opacity-70">{fill(t.bidBy, { side: side(g.bidder) })}</p>
          <p className="text-[clamp(2rem,6svh,2.75rem)] font-black leading-none lg:text-6xl">
            <span className="sr-only">{bidLabel(t, g.bid)}</span><span aria-hidden="true"><BidWords t={t} bid={g.bid} /></span>
          </p>
        </>
      ) : (
        <p className="text-lg font-black">{fill(t.opens, { side: side(g.turn) })}</p>
      )}
      <p className="mt-1 text-xs font-bold opacity-70">
        {isAi(g.turn) ? fill(t.thinking, { side: side(g.turn) }) : fill(t.turnOf, { side: side(g.turn) })}
      </p>
    </div>
  ) : g.last ? (
    <RevealPanel t={t} g={g} side={side} onNext={next} />
  ) : null;

  const controls = sel && myTurn && (() => {
    const min = minCountFor(g, sel.face) ?? total + 1;
    const setFace = (face: Face) => {
      const m = minCountFor(g, face);
      if (m === null) return;
      setSel({ face, count: Math.max(m, Math.min(sel.count, total)) });
    };
    const legal = sel.count >= min && sel.count <= total;
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-center gap-3">
          <span className="sr-only">{t.count}</span>
          <button type="button" aria-label="−" disabled={sel.count - 1 < min} onClick={() => setSel({ ...sel, count: sel.count - 1 })} className={`${roundBtn} !size-10`}><LuMinus aria-hidden="true" /></button>
          <span className="w-9 text-center text-2xl font-black tabular-nums">{sel.count}</span>
          <button type="button" aria-label="+" disabled={sel.count + 1 > total} onClick={() => setSel({ ...sel, count: sel.count + 1 })} className={`${roundBtn} !size-10`}><LuPlus aria-hidden="true" /></button>
        </div>
        <div role="radiogroup" aria-label={t.face} className="flex justify-center gap-1.5">
          {([2, 3, 4, 5, 6, 1] as Face[]).map((f) => {
            const ok = minCountFor(g, f) !== null;
            return (
              <button key={f} type="button" role="radio" aria-checked={sel.face === f} aria-label={String(f)} disabled={!ok} onClick={() => setFace(f)}
                className={`rounded-[4px] p-1 transition disabled:opacity-25 ${sel.face === f ? 'bg-[#d4b98f]/20 outline outline-2 outline-[#c9b17b]' : ''}`}>
                <Die face={f} className="size-8" />
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" disabled={!legal} onClick={() => act({ type: 'bid', bid: sel })} className="ld-btn is-ink flex flex-1 items-center justify-center gap-2 py-3 text-base">
            <span>{t.bid}</span><span className="sr-only">{bidLabel(t, sel)}</span><span aria-hidden="true"><BidWords t={t} bid={sel} tone="ink" /></span>
          </button>
          {g.bid && (
            <button type="button" onClick={() => act({ type: 'challenge' })} className="ld-btn is-red flex-1 py-3 text-base">{t.challenge}</button>
          )}
          {canExact(g) && (
            <button type="button" onClick={() => act({ type: 'exact' })} className="ld-btn is-soft px-4 py-3 text-base">{t.callExact}</button>
          )}
        </div>
      </div>
    );
  })();

  const mineRow = bottom !== null && g.dice[bottom]?.length > 0 && g.phase === 'bidding' && (
    <div className="flex flex-col items-center gap-1.5">
      {local && <p className="text-xs font-black opacity-70">{side(bottom)}</p>}
      {/* 自己那一排：外面一圈棉線色的框（畫面上不寫「你」） */}
      <div className="flex justify-center gap-2 rounded-[6px] bg-black/15 px-3 py-2.5 outline outline-2 -outline-offset-2 outline-[#d4b98f]">
        <span className="sr-only">{t.mine}</span>
        {g.dice[bottom].map((f, i) => (
          <Die key={i} face={f} className="size-10 lg:size-11" ring={!!sel && myTurn && countMatching([f], sel.face, sel.face !== 1 && wildNow) > 0} />
        ))}
      </div>
    </div>
  );

  const pass = needPass && (
    <div className="flex flex-col items-center gap-2 rounded-[6px] bg-black/15 p-4 text-center">
      <Cup color={SEAT_HEX[g.turn]} className="w-12" />
      <p className="text-lg font-black">{fill(t.passTitle, { side: side(g.turn) })}</p>
      <p className="text-xs font-bold opacity-75">{fill(t.passBody, { side: side(g.turn) })}</p>
      <button type="button" onClick={() => setPeeked(g.turn)} className="ld-btn is-ink mt-1 w-full max-w-[260px] py-3">{t.peek}</button>
    </div>
  );

  return (
    <LdFrame className="items-center px-3 pb-4 pt-3 lg:px-8 lg:pb-8">
      <div className="flex w-full max-w-[460px] items-center gap-2 lg:max-w-[960px]">
        <button type="button" onClick={() => leave.request(onMenu)} aria-label={t.home} className={roundBtn}><LuHouse aria-hidden="true" /></button>
        <p className="min-w-0 flex-1 text-center text-xs font-black leading-snug opacity-80">
          {fill(t.roundInfo, { n: g.round, dice: total })}
          <span className="mx-1.5 opacity-50">·</span>
          <span className={wildNow ? 'text-[#c9b17b]' : ''}>{ruleChip}</span>
        </p>
        <button type="button" onClick={() => setPrefs({ sfx: !prefs.sfx })} aria-label={g0.sound.button} aria-pressed={prefs.sfx} className={roundBtn}>
          {prefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
        </button>
        <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></button>
      </div>

      <main className="mt-3 flex w-full max-w-[460px] flex-1 flex-col gap-4 lg:my-auto lg:max-h-[640px] lg:max-w-[960px] lg:flex-row lg:items-stretch lg:gap-12">
        <section className="flex flex-1 flex-col gap-4">
          <ul className="grid gap-1" style={{ gridTemplateColumns: `repeat(${topSeats.length}, minmax(0, 1fr))` }}>
            {topSeats.map(seatChip)}
          </ul>
          <div className="flex flex-1 items-center justify-center">{center}</div>
        </section>
        {/* 掀開的時候整個桌面讓給掀開的骰子（桌機才不會右邊空一欄） */}
        {(pass || mineRow || controls) && (
          <section className="flex flex-col justify-end gap-3 lg:w-[400px] lg:shrink-0 lg:justify-center">
            {pass}
            {mineRow}
            {controls}
          </section>
        )}
      </main>

      <HowToModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Modal isOpen={leave.open} onClose={leave.cancel} title={g0.leave.heading} kicker={g0.leave.kicker}
        icon={GiExitDoor} band={LD_BAND} panelClassName={LD_PANEL}
        footer={<>
          <button type="button" className="ld-btn is-paper flex-1 py-3.5" onClick={leave.cancel}>{g0.leave.cancel}</button>
          <button type="button" className="ld-btn is-red flex-1 py-3.5" onClick={leave.confirm}>{g0.leave.confirm}</button>
        </>}>
        <p className="text-sm font-bold leading-relaxed">{g0.leave.body}</p>
      </Modal>

      <Modal isOpen={endOpen && g.winner !== null} onClose={() => setEndOpen(false)}
        title={g.winner !== null ? fill(t.winTitle, { side: side(g.winner) }) : ''} kicker={t.title}
        icon={GiLaurelCrown} band={LD_BAND} panelClassName={LD_PANEL}
        footer={<>
          <button type="button" className="ld-btn is-paper flex-1 py-3.5" onClick={() => leave.request(onMenu)}>{t.backMenu}</button>
          <button type="button" className="ld-btn is-red flex-1 py-3.5" onClick={() => leave.skip(onAgain)}>{t.playAgain}</button>
        </>}>
        <div className="flex flex-col items-center gap-3">
          {g.winner !== null && <Cup color={SEAT_HEX[g.winner]} className="w-16" />}
          <p className="text-sm font-bold leading-relaxed">{fill(t.winBody, { n: g.round })}</p>
        </div>
      </Modal>
    </LdFrame>
  );
}

/** 開了之後：每個人的骰子排一列，算進去的那幾顆外面一圈紅，最後一行講誰少一顆 */
function RevealPanel({ t, g, side, onNext }: { t: LiarsDiceText; g: State; side: (seat: number) => string; onNext: () => void }) {
  const r = g.last!;
  const lines = [
    r.loser !== null && fill(t.loses, { side: side(r.loser) }),
    r.gainer !== null && fill(t.gains, { side: side(r.gainer) }),
    r.loser !== null && g.dice[r.loser].length === 0 && fill(t.knockedOut, { side: side(r.loser) }),
  ].filter(Boolean) as string[];
  return (
    <div className="flex w-full flex-col items-center gap-3" aria-live="polite">
      <p className="text-lg font-black">{fill(r.kind === 'exact' ? t.revealExact : t.revealChallenge, { side: side(r.caller) })}</p>
      <ul className="flex w-full flex-col gap-1.5">
        {r.dice.map((d, seat) => d.length > 0 && (
          <li key={seat} className="flex items-center gap-2">
            <Cup color={SEAT_HEX[seat]} className="w-7" />
            <span className="w-14 shrink-0 truncate text-xs font-black">{side(seat)}</span>
            <span className="flex flex-wrap gap-1">
              {d.map((f, i) => {
                const hit = countMatching([f], r.bid.face, r.wild) > 0;
                return <Die key={i} face={f} className="size-7 lg:size-9" ring={hit} dim={!hit} />;
              })}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-center text-sm font-bold">
        {fill(t.revealBody, { bid: bidLabel(t, r.bid), n: r.actual })}
      </p>
      {lines.map((l) => <p key={l} className="text-center text-base font-black text-[#c9b17b]">{l}</p>)}
      {g.phase === 'reveal' && <button type="button" onClick={onNext} className="ld-btn is-ink w-full max-w-[260px] py-3">{t.nextRound}</button>}
    </div>
  );
}
