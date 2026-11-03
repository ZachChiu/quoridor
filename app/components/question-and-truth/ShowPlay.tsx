'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GiCardAceDiamonds, GiExitDoor, GiLaurelCrown } from 'react-icons/gi';
import { LuMinus, LuPlus } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { decideBid, oppRemaining, think, viewOf, type Level } from '@/games/question-and-truth/ai';
import {
  ask, factsOf, newShowGame, other, randomHand, submitBid, tellTruth, warning, type Hand, type Question, type Seat, type ShowState,
} from '@/games/question-and-truth/engine';
import { TEXT } from '@/games/question-and-truth/text';
import AskSheet, { AskPanel } from './AskSheet';
import HandPicker from './HandPicker';
import HowToModal from './HowToModal';
import LogList, { type LogRow } from './LogList';
import NotesGrid from './NotesGrid';
import PlayingCard from './PlayingCard';
import QtFrame from './QtFrame';
import { SeatMark } from './SeatMark';
import { HiddenRow, Lamp, Marker, MyRow, PlayShell } from './Table';
import TruthSheet from './TruthSheet';
import { emptyNotes, prefill, type Notes } from './notes';
import { QT_BAND, QT_PANEL } from './palette';
import { QuestionLabel, answerText } from './qtext';
import { playAnswer, playAsk, playBid, playLose, playRight, playWonBid, playWrong } from './sounds';

/** 畫面現在在哪一步（遊戲本身的狀態在 ShowState） */
type Stage =
  | { k: 'pass'; seat: Seat; then: 'pick' | 'bid' }
  | { k: 'pick'; seat: Seat }
  | { k: 'bid'; seat: Seat }
  | { k: 'table' };

/**
 * 節目版的一局（對電腦、同一台兩人）。遊戲只持有一個不可變的 ShowState（engine），這裡管畫面的流程：
 *
 * - 對電腦：自己固定是紅方（第 0 位），自己那排牌一直攤在桌布下方（外面一圈框）。排好牌 → 每回合秘密出價（電腦同時出，
 *   只看 ai.viewOf 給的東西，看不到紅方的牌）→ 得標的人提問或說真相 → 下一回合。
 * - 同一台兩人：排牌、出價都先蓋著「交給紅方」，那個人按「我是紅方」才看得到自己的牌與代幣；問答與真相是公開的，在桌上做。
 * - 對方的 8 張牌背上寫自己的筆記摘要；手機點牌背打開筆記，桌機左邊一直攤著。
 */
export default function ShowPlay({ mode, onMenu, onAgain }: { mode: { kind: 'ai'; level: Level } | { kind: 'local' }; onMenu: () => void; onAgain: () => void }) {
  const t = useTextTable(TEXT);
  const g0 = useGameText();
  const local = mode.kind === 'local';
  const level: Level = mode.kind === 'ai' ? mode.level : 'normal';
  const isAi = (seat: Seat) => !local && seat === 1;

  const [aiHand] = useState<Hand>(() => randomHand(Math.random));
  const [picked, setPicked] = useState<(Hand | null)[]>([null, local ? null : aiHand]);
  const [g, setG] = useState<ShowState | null>(null);
  const [stage, setStage] = useState<Stage>(local ? { k: 'pass', seat: 0, then: 'pick' } : { k: 'pick', seat: 0 });
  const [notes, setNotes] = useState<[Notes, Notes]>(() => [emptyNotes(), emptyNotes()]);
  const [sheet, setSheet] = useState<'ask' | 'truth' | 'notes' | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [bid, setBid] = useState(2);
  const side = (s: Seat) => t.seats[s];

  const gRef = useRef(g);
  useEffect(() => { gRef.current = g; });
  const leave = useLeaveGuard({ live: g?.phase !== 'over', inProgress: g !== null ? g.phase !== 'over' : picked.some(Boolean) && local });

  /** 桌上現在是誰在看：對電腦一律紅方；同一台是得標的人（或最後動作的人） */
  const viewer: Seat = !local || !g ? 0 : g.phase === 'act' && g.actor !== null ? g.actor : (g.log.at(-1)?.seat ?? 0);
  const target = other(viewer);

  const startGame = (hands: [Hand, Hand]) => {
    const marker: Seat = Math.random() < 0.5 ? 0 : 1;
    setG(newShowGame(hands, marker));
    setStage(local ? { k: 'pass', seat: 0, then: 'bid' } : { k: 'bid', seat: 0 });
  };

  const onPicked = (seat: Seat, h: Hand) => {
    const next = [...picked];
    next[seat] = h;
    setPicked(next);
    if (local && seat === 0) setStage({ k: 'pass', seat: 1, then: 'pick' });
    else startGame([next[0]!, next[1]!]);
  };

  const onBid = (seat: Seat, n: number) => {
    if (!g) return;
    playBid(n);
    let s = submitBid(g, seat, n);
    if (!local) s = submitBid(s, 1, decideBid(viewOf(g, 1), level, Math.random));
    setG(s);
    setBid(2);
    if (local && seat === 0) { setStage({ k: 'pass', seat: 1, then: 'bid' }); return; }
    setStage({ k: 'table' });
    window.setTimeout(playWonBid, 350);
  };

  const doAsk = (q: Question) => {
    if (!g) return;
    setSheet(null);
    playAsk();
    setG(ask(g, q));
    window.setTimeout(playAnswer, 380);
  };
  const doTruth = (guess: number[]) => {
    if (!g) return;
    setSheet(null);
    const next = tellTruth(g, guess);
    setG(next);
    const ok = next.phase === 'over';
    if (ok) (local || next.winner === 0 ? playRight : playLose)(); else playWrong();
  };

  // 電腦得標：想一下再問（太快看不出它問了什麼）
  useEffect(() => {
    if (!g || g.phase !== 'act' || g.actor === null || !isAi(g.actor)) return;
    const id = window.setTimeout(() => {
      if (gRef.current !== g) return;
      const view = viewOf(g, 1);
      const danger = oppRemaining(view) <= 3;
      const d = think(factsOf(g.log, 1), level, Math.random, { danger });
      if (d.kind === 'ask') { playAsk(); setG(ask(g, d.q)); window.setTimeout(playAnswer, 380); }
      else {
        const next = tellTruth(g, d.guess);
        setG(next);
        if (next.phase === 'over') playLose(); else playWrong();
      }
    }, 1100 + Math.random() * 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只看局面換了沒
  }, [g]);

  // 分出勝負：先讓大家看一下翻開的牌，再跳結算
  useEffect(() => {
    if (g?.phase !== 'over') return;
    const id = window.setTimeout(() => setEndOpen(true), 1400);
    return () => window.clearTimeout(id);
  }, [g?.phase]);

  const nextRound = () => setStage(local ? { k: 'pass', seat: 0, then: 'bid' } : { k: 'bid', seat: 0 });

  const rows: LogRow[] = useMemo(() => (g?.log ?? []).map((e) => (e.kind === 'ask'
    ? { seat: e.seat, kind: 'ask', q: e.q, a: e.a }
    : { seat: e.seat, kind: 'truth', guess: e.guess, ok: e.ok })), [g?.log]);

  const helpModal = <HowToModal open={helpOpen} onClose={() => setHelpOpen(false)} />;
  const leaveModal = (
    <Modal isOpen={leave.open} onClose={leave.cancel} title={g0.leave.heading} kicker={g0.leave.kicker}
      icon={GiExitDoor} band={QT_BAND} panelClassName={QT_PANEL}
      footer={<>
        <button type="button" className="qt-btn is-paper flex-1 py-3.5" onClick={leave.cancel}>{g0.leave.cancel}</button>
        <button type="button" className="qt-btn is-ink-on-paper flex-1 py-3.5" onClick={leave.confirm}>{g0.leave.confirm}</button>
      </>}>
      <p className="text-sm font-bold leading-relaxed">{g0.leave.body}</p>
    </Modal>
  );

  // ── 交給某一方（同一台）
  if (stage.k === 'pass') {
    return (
      <QtFrame className="items-center justify-center px-6">
        <div className="flex w-full max-w-[360px] flex-col items-center gap-4 text-center">
          <SeatMark seat={stage.seat} className="w-16" />
          <p className="text-2xl font-black">{fill(t.passTitle, { side: side(stage.seat) })}</p>
          <p className="text-sm font-bold opacity-75">{t.passBody}</p>
          <button type="button" onClick={() => setStage(stage.then === 'pick' ? { k: 'pick', seat: stage.seat } : { k: 'bid', seat: stage.seat })}
            className="qt-btn is-ink w-full py-3.5 text-base">{fill(t.peek, { side: side(stage.seat) })}</button>
          <button type="button" onClick={() => leave.request(onMenu)} className="text-sm font-bold underline underline-offset-4 opacity-70">{t.home}</button>
        </div>
        {leaveModal}
      </QtFrame>
    );
  }

  // ── 排牌
  if (stage.k === 'pick') {
    return (
      <QtFrame className="items-center px-3 pb-6 pt-4 lg:px-8">
        <div className="flex w-full max-w-[480px] flex-col gap-3 lg:max-w-[920px]">
          <HandPicker t={t} kicker={local ? side(stage.seat) : t.title} onDone={(h) => onPicked(stage.seat, h)} />
          <button type="button" onClick={() => leave.request(onMenu)} className="self-center text-sm font-bold underline underline-offset-4 opacity-70">{t.home}</button>
        </div>
        {leaveModal}
      </QtFrame>
    );
  }

  if (!g) return null;
  const lastResult = g.bidResults.at(-1);
  const lastLog = g.log.at(-1);
  const myHand = local ? null : g.hands[0];

  // ── 秘密出價（自己的牌、代幣只在這裡看得到；同一台時另一方看不到）
  const bidPanel = stage.k === 'bid' && (() => {
    const seat = stage.seat;
    const mine = g.tokens[seat];
    const n = Math.min(bid, mine);
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-xs font-black text-[var(--qt-gold)]">{fill(t.round, { n: g.round })}</p>
        <p className="text-xl font-black lg:text-2xl">{t.bidTitle}</p>
        <p className="max-w-[320px] text-xs font-bold opacity-80">{t.bidHint}</p>
        <div className="flex items-center gap-4">
          <button type="button" aria-label="−" disabled={n <= 0} onClick={() => setBid(Math.max(0, n - 1))} className="qt-btn is-soft grid size-12 place-items-center text-2xl"><LuMinus aria-hidden="true" /></button>
          <span className="w-16 text-5xl font-black tabular-nums">{n}</span>
          <button type="button" aria-label="+" disabled={n >= mine} onClick={() => setBid(Math.min(mine, n + 1))} className="qt-btn is-soft grid size-12 place-items-center text-2xl"><LuPlus aria-hidden="true" /></button>
        </div>
        <p className="flex items-center gap-2 text-sm font-black">
          {fill(t.tokens, { n: mine })}
          <Lamp on={warning(mine)} t={t} />
        </p>
        <button type="button" onClick={() => onBid(seat, n)} className="qt-btn is-ink w-full max-w-[300px] py-3.5 text-base">{fill(t.submitBid, { n })}</button>
      </div>
    );
  })();

  const actPanel = stage.k === 'table' && (() => {
    if (g.phase === 'over') {
      return (
        <div className="flex flex-col items-center gap-2 text-center" aria-live="polite">
          <GiLaurelCrown aria-hidden="true" className="text-4xl text-[var(--qt-gold)]" />
          <p className="text-2xl font-black">{fill(t.winTitle, { side: side(g.winner!) })}</p>
          <button type="button" onClick={() => setEndOpen(true)} className="qt-btn is-ink mt-1 px-6 py-3">{t.playAgain}</button>
        </div>
      );
    }
    if (g.phase === 'act' && g.actor !== null) {
      const head = lastResult?.tie && (
        <p className="text-sm font-black text-[var(--qt-gold)]">
          {lastResult.tie ? fill(t.bidTie, { side: side(lastResult.winner) }) : fill(t.bidWon, { side: side(lastResult.winner) })}
        </p>
      );
      if (isAi(g.actor)) {
        return <div className="flex flex-col items-center gap-2 text-center" aria-live="polite">{head}<p className="animate-pulse text-xl font-black">{fill(t.thinking, { side: side(g.actor) })}</p></div>;
      }
      return (
        <div className="flex w-full flex-col items-center gap-3 text-center" aria-live="polite">
          {head}
          <p className="text-lg font-black lg:text-xl">{fill(t.actTitle, { side: side(g.actor) })}</p>
          <div className="flex w-full max-w-[360px] gap-2 lg:hidden">
            <button type="button" onClick={() => setSheet('ask')} className="qt-btn is-ink flex-1 py-4 text-lg">{t.askBtn}</button>
            <button type="button" onClick={() => setSheet('truth')} className="qt-btn is-red flex-1 py-4 text-lg">{t.truthBtn}</button>
          </div>
          <div className="qt-card hidden w-full rounded-[8px] p-4 text-left lg:block">
            <AskPanel t={t} onAsk={doAsk} extra={<button type="button" onClick={() => setSheet('truth')} className="qt-btn is-red shrink-0 px-6 text-base">{t.truthBtn}</button>} />
          </div>
        </div>
      );
    }
    // 一個動作做完了（phase 回到 bid）：把剛剛那一問攤在桌上，按「下一回合」才出價
    return (
      <div className="flex w-full flex-col items-center gap-3 text-center" aria-live="polite">
        {lastLog && (
          <div className="flex w-full max-w-[420px] flex-col items-center gap-2">
            <p className="flex items-center gap-2 text-sm font-black"><SeatMark seat={lastLog.seat} className="w-4" />{side(lastLog.seat)}</p>
            {lastLog.kind === 'ask' ? (
              <>
                <p className="text-base font-black lg:text-xl"><QuestionLabel t={t} q={lastLog.q} /></p>
                <p className="qt-card rounded-[6px] px-5 py-1.5 text-3xl font-black tabular-nums lg:text-4xl">{answerText(t, lastLog.a)}</p>
              </>
            ) : (
              <p className="text-xl font-black">{t.truthBtn} · <span className="text-[var(--qt-gold)]">{t.wrong}</span></p>
            )}
          </div>
        )}
        <button type="button" onClick={nextRound} className="qt-btn is-ink w-full max-w-[300px] py-3.5 text-base">{fill(t.round, { n: g.round })} ›</button>
      </div>
    );
  })();

  const statusLine = (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-2">
      <span>{fill(t.round, { n: g.round })}</span>
      <span className="opacity-40">·</span>
      <span className="inline-flex items-center gap-1"><Marker t={t} /><span className="sr-only">{t.marker}</span><SeatMark seat={g.marker} className="w-3.5" />{side(g.marker)}</span>
    </span>
  );

  const seatLabel = (s: Seat) => (
    <>
      <SeatMark seat={s} t={t} className="w-4" />
      <span>{side(s)}</span>
      {g.marker === s && <Marker t={t} />}
      <Lamp on={warning(g.tokens[s])} t={t} />
    </>
  );

  // 桌上：要猜的那排（得標／正在看的那一方要猜的另一方）
  const hiddenSeat: Seat = local ? (stage.k === 'bid' ? other(stage.seat) : target) : 1;
  const notesSeat: Seat = other(hiddenSeat);
  const hidden = (
    <HiddenRow t={t} notes={notes[notesSeat]} focus={focus} label={seatLabel(hiddenSeat)}
      reveal={g.phase === 'over' ? g.hands[hiddenSeat] : null}
      onPick={(p) => { setFocus(p); if (window.matchMedia('(min-width: 1024px)').matches) return; setSheet('notes'); }} />
  );

  const myRow = local
    ? (stage.k === 'bid' ? <MyRow t={t} hand={g.hands[stage.seat]} label={seatLabel(stage.seat)} />
      : g.phase === 'over' ? <MyRow t={t} hand={g.hands[notesSeat]} label={seatLabel(notesSeat)} /> : (
        <div className="flex items-center gap-2 text-sm font-black opacity-80">{seatLabel(notesSeat)}</div>
      ))
    : myHand && <MyRow t={t} hand={myHand} label={seatLabel(0)} />;

  const setNotesFor = (n: Notes) => setNotes((ns) => (notesSeat === 0 ? [n, ns[1]] : [ns[0], n]));

  return (
    <PlayShell t={t} status={statusLine} onHome={() => leave.request(onMenu)} onHelp={() => setHelpOpen(true)}
      onNotes={() => { setFocus(null); setSheet('notes'); }}
      notes={<NotesGrid t={t} notes={notes[notesSeat]} onChange={setNotesFor} focus={focus} tone="dark" />}
      log={<LogList t={t} rows={rows} />}>
      {hidden}
      <div className="flex flex-1 items-center justify-center py-2">{bidPanel || actPanel}</div>
      {myRow}

      <AskSheet t={t} open={sheet === 'ask'} onClose={() => setSheet(null)} onAsk={doAsk} kicker={fill(t.round, { n: g.round })} />
      <TruthSheet t={t} open={sheet === 'truth'} onClose={() => setSheet(null)} onSubmit={doTruth} initial={prefill(notes[notesSeat])} kicker={fill(t.handOf, { side: side(hiddenSeat) })} />
      <Modal isOpen={sheet === 'notes'} onClose={() => setSheet(null)} title={t.notesTitle} kicker={fill(t.handOf, { side: side(hiddenSeat) })}
        icon={GiCardAceDiamonds} band={QT_BAND} panelClassName={QT_PANEL} bodyClassName="!p-4">
        <NotesGrid t={t} notes={notes[notesSeat]} onChange={setNotesFor} focus={focus} />
      </Modal>
      {helpModal}
      {leaveModal}
      <Modal isOpen={endOpen && g.winner !== null} onClose={() => setEndOpen(false)}
        title={g.winner !== null ? fill(t.winTitle, { side: side(g.winner) }) : ''} kicker={t.title}
        icon={GiLaurelCrown} band={QT_BAND} panelClassName={`${QT_PANEL} lg:!max-w-[560px]`}
        footer={<>
          <button type="button" className="qt-btn is-paper flex-1 py-3.5" onClick={() => leave.request(onMenu)}>{t.backMenu}</button>
          <button type="button" className="qt-btn is-ink-on-paper flex-1 py-3.5" onClick={() => leave.skip(onAgain)}>{t.playAgain}</button>
        </>}>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold">{fill(t.winBody, { n: g.round })}</p>
          {([0, 1] as Seat[]).map((s) => (
            <div key={s} className="flex flex-col gap-1">
              <p className="flex items-center gap-1.5 text-xs font-black"><SeatMark seat={s} className="w-3.5" />{fill(t.handOf, { side: side(s) })}</p>
              <div className="grid grid-cols-8 gap-1">{g.hands[s].map((c, i) => <PlayingCard key={i} card={c} className="w-full outline outline-1 outline-[color-mix(in_srgb,var(--qt-ink)_25%,transparent)]" />)}</div>
            </div>
          ))}
          {!local && g.winner === 1 && level === 'hard' && <p className="rounded-[6px] bg-[color-mix(in_srgb,var(--qt-ink)_7%,transparent)] p-3 text-sm font-bold leading-relaxed">{t.trickNote}</p>}
        </div>
      </Modal>
    </PlayShell>
  );
}
