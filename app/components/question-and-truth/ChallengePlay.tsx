'use client';
import { useEffect, useMemo, useState } from 'react';
import { GiCardAceDiamonds, GiExitDoor, GiSixEyes } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { ShareResultModal, useShareCard, type ShareClasses } from '@/components/ShareResultModal';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { useGameText, useLocale, useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath } from '@/i18n/locales';
import { QUESTION_AND_TRUTH } from '@/i18n/routes';
import {
  PRICES, SIX_ASKS, WRONG_PENALTY, canAsk, challengeAsk, challengeGuess, demoSteps, localDate, newChallenge, priceOf, solved, spent, stepsOf,
  type ChallengeKind, type ChallengeState,
} from '@/games/question-and-truth/challenge';
import { HAND_SIZE, type Question } from '@/games/question-and-truth/engine';
import { TEXT, type QtText } from '@/games/question-and-truth/text';
import AskSheet, { AskPanel } from './AskSheet';
import HowToModal from './HowToModal';
import LogList, { type LogRow } from './LogList';
import NotesGrid from './NotesGrid';
import PlayingCard from './PlayingCard';
import { HiddenRow, PlayShell } from './Table';
import TruthSheet from './TruthSheet';
import { emptyNotes, prefill, type Notes } from './notes';
import { QT_BAND, QT_PANEL } from './palette';
import { QuestionLabel, answerText } from './qtext';
import { loadDaily, saveDaily } from './records';
import { drawQtCard, type QtCardData } from './shareCard';
import { playAnswer, playAsk, playRight, playWrong } from './sounds';

const QT_SHARE: Partial<ShareClasses> = {
  primary: 'qt-btn is-ink',
  secondary: 'qt-btn is-soft',
  toggle: 'bg-white/10',
  toggleOn: 'bg-[var(--qt-paper)] text-[var(--qt-ink)]',
  toggleOff: 'text-[var(--qt-fg)]/75',
  button: 'font-black',
  placeholder: 'bg-white/10',
};

/** 從存檔接回今天的進度：回答由那一天的牌重算 */
function restoreDaily(date: string): ChallengeState {
  let s = newChallenge('daily', { date });
  const p = loadDaily(date);
  if (!p) return s;
  const guesses = Array.isArray(p.guesses) ? p.guesses.filter((g) => g && Array.isArray(g.guess)) : [];
  for (let i = 0; i <= p.asks.length; i++) {
    for (const g of guesses) if (g.after === i) s = challengeGuess(s, g.guess);
    if (i < p.asks.length) s = challengeAsk(s, p.asks[i]);
  }
  return s;
}

/**
 * 自己的挑戰（單人推理）：每日一手、六問一猜（規則在 games/question-and-truth/challenge.ts）。
 * 桌上只有一排要猜的牌（全世界同一手／隨機一手），沒有出價；畫面跟節目版共用 PlayShell。
 * 每日一手存在 localStorage，重整接得回來、說中之後選單寫花了幾枚；結算就是分享圖（每一題一張小牌，像 Wordle）＋電腦示範。
 */
export default function ChallengePlay({ kind, onMenu, onAgain }: { kind: ChallengeKind; onMenu: () => void; onAgain: () => void }) {
  const t = useTextTable(TEXT);
  const g0 = useGameText();
  const [date] = useState(() => localDate());
  const [s, setS] = useState<ChallengeState>(() => (kind === 'daily' ? restoreDaily(date) : newChallenge('six')));
  const [notes, setNotes] = useState<Notes>(emptyNotes);
  const [sheet, setSheet] = useState<'ask' | 'truth' | 'notes' | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(() => s.over);
  const [demo, setDemo] = useState<number | null>(null);
  const leave = useLeaveGuard({ live: !s.over, inProgress: !s.over && kind === 'six' && s.asks.length > 0 });

  const persist = (next: ChallengeState) => {
    setS(next);
    if (kind === 'daily') saveDaily({ date, asks: next.asks.map((x) => x.q), guesses: next.guesses.map((g) => ({ guess: g.guess, after: g.after })), spent: spent(next), solved: solved(next) });
  };

  const doAsk = (q: Question) => {
    setSheet(null);
    playAsk();
    persist(challengeAsk(s, q));
    window.setTimeout(playAnswer, 380);
  };
  const doTruth = (guess: number[]) => {
    setSheet(null);
    const next = challengeGuess(s, guess);
    persist(next);
    const g = next.guesses.at(-1)!;
    if (g.correct === HAND_SIZE) playRight(); else playWrong();
    if (next.over) window.setTimeout(() => setEndOpen(true), 1200);
  };

  // 電腦示範：說中之後才算（一步一個 timer，不卡住畫面）
  useEffect(() => {
    if (kind !== 'daily' || !solved(s) || demo !== null) return;
    const it = demoSteps(date);
    let id = 0;
    const step = () => {
      const r = it.next();
      if (r.done) return;
      if (r.value.done) { setDemo(r.value.spent); return; }
      id = window.setTimeout(step, 0);
    };
    id = window.setTimeout(step, 300);
    return () => window.clearTimeout(id);
  }, [kind, s, demo, date]);

  // 紀錄照發生的順序：問過的題，中間插回報過的真相
  const rows: LogRow[] = useMemo(() => {
    const out: LogRow[] = [];
    for (let i = 0; i <= s.asks.length; i++) {
      for (const g of s.guesses) if (g.after === i) out.push({ seat: null, kind: 'truth', guess: g.guess, ok: g.correct === HAND_SIZE, correct: g.correct });
      const x = s.asks[i];
      if (x) out.push({ seat: null, kind: 'ask', q: x.q, a: x.a, price: kind === 'daily' ? priceOf(x.q) : undefined });
    }
    return out;
  }, [s.asks, s.guesses, kind]);

  const asksLeft = SIX_ASKS - s.asks.length;
  const status = kind === 'daily'
    ? <span className="inline-flex flex-wrap items-center justify-center gap-x-3"><span>{fill(t.dailyTitle, { date })}</span><span className="text-[var(--qt-gold)]">{fill(t.spent, { n: spent(s) })}</span></span>
    : <span className="inline-flex flex-wrap items-center justify-center gap-x-3"><span>{t.six}</span><span className="text-[var(--qt-gold)]">{s.over ? fill(t.sixScore, { n: s.guesses[0]?.correct ?? 0 }) : fill(t.sixLeft, { n: asksLeft })}</span></span>;

  const last = s.asks.at(-1);
  const lastGuess = s.guesses.at(-1);
  const center = (
    <div className="flex w-full flex-col items-center gap-3 text-center" aria-live="polite">
      {last && !s.over && (
        <div className="flex w-full max-w-[420px] flex-col items-center gap-2">
          <p className="text-base font-black lg:text-xl"><QuestionLabel t={t} q={last.q} /></p>
          <p className="qt-card rounded-[6px] px-5 py-1.5 text-3xl font-black tabular-nums lg:text-4xl">{answerText(t, last.a)}</p>
        </div>
      )}
      {!last && !s.over && <p className="max-w-[360px] text-sm font-bold leading-relaxed opacity-85">{kind === 'daily' ? t.challengeSteps[0].body : t.challengeSteps[1].body}</p>}
      {lastGuess && !s.over && <p className="text-sm font-black text-[var(--qt-gold)]">{t.wrong} · {fill(t.penalty, { n: WRONG_PENALTY })}</p>}
      {kind === 'six' && !canAsk(s) && !s.over && <p className="text-lg font-black">{t.sixOut}</p>}
      {s.over ? (
        <button type="button" onClick={() => setEndOpen(true)} className="qt-btn is-ink px-6 py-3">{kind === 'daily' ? fill(t.dailyResult, { n: spent(s) }) : fill(t.sixScore, { n: s.guesses[0]?.correct ?? 0 })}</button>
      ) : (
        <>
          <div className="flex w-full max-w-[360px] gap-2 lg:hidden">
            <button type="button" disabled={!canAsk(s)} onClick={() => setSheet('ask')} className="qt-btn is-ink flex-1 py-4 text-lg">{t.askBtn}</button>
            <button type="button" onClick={() => setSheet('truth')} className="qt-btn is-red flex-1 py-4 text-lg">{t.truthBtn}</button>
          </div>
          <div className="qt-card hidden w-full rounded-[8px] p-4 text-left lg:block">
            {canAsk(s)
              ? <AskPanel t={t} onAsk={doAsk} price={kind === 'daily' ? (id) => PRICES[id] : undefined}
                  extra={<button type="button" onClick={() => setSheet('truth')} className="qt-btn is-red shrink-0 px-6 text-base">{t.truthBtn}</button>} />
              : <button type="button" onClick={() => setSheet('truth')} className="qt-btn is-red w-full py-4 text-lg">{t.truthBtn}</button>}
          </div>
        </>
      )}
      {kind === 'daily' && !s.over && <p className="text-[11px] font-bold opacity-65">{fill(t.penalty, { n: WRONG_PENALTY })}</p>}
    </div>
  );

  return (
    <PlayShell t={t} status={status} onHome={() => leave.request(onMenu)} onHelp={() => setHelpOpen(true)}
      onNotes={() => { setFocus(null); setSheet('notes'); }}
      notes={<NotesGrid t={t} notes={notes} onChange={setNotes} focus={focus} tone="dark" />}
      log={<LogList t={t} rows={rows} />}>
      <HiddenRow t={t} notes={notes} focus={focus} reveal={s.over ? s.hand : null}
        label={<span>{kind === 'daily' ? t.daily : t.six}</span>}
        onPick={(p) => { setFocus(p); if (window.matchMedia('(min-width: 1024px)').matches) return; setSheet('notes'); }} />
      <div className="flex flex-1 items-center justify-center py-2">{center}</div>
      {kind === 'daily' && <div className="lg:hidden"><PriceList t={t} /></div>}

      <AskSheet t={t} open={sheet === 'ask'} onClose={() => setSheet(null)} onAsk={doAsk} price={kind === 'daily' ? (id) => PRICES[id] : undefined}
        kicker={kind === 'daily' ? fill(t.spent, { n: spent(s) }) : fill(t.sixLeft, { n: asksLeft })} />
      <TruthSheet t={t} open={sheet === 'truth'} onClose={() => setSheet(null)} onSubmit={doTruth} initial={prefill(notes)} kicker={kind === 'daily' ? t.daily : t.six} />
      <Modal isOpen={sheet === 'notes'} onClose={() => setSheet(null)} title={t.notesTitle} kicker={kind === 'daily' ? t.daily : t.six}
        icon={GiCardAceDiamonds} band={QT_BAND} panelClassName={QT_PANEL} bodyClassName="!p-4">
        <NotesGrid t={t} notes={notes} onChange={setNotes} focus={focus} />
      </Modal>
      <HowToModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <Modal isOpen={leave.open} onClose={leave.cancel} title={g0.leave.heading} kicker={g0.leave.kicker}
        icon={GiExitDoor} band={QT_BAND} panelClassName={QT_PANEL}
        footer={<>
          <button type="button" className="qt-btn is-paper flex-1 py-3.5" onClick={leave.cancel}>{g0.leave.cancel}</button>
          <button type="button" className="qt-btn is-ink-on-paper flex-1 py-3.5" onClick={leave.confirm}>{g0.leave.confirm}</button>
        </>}>
        <p className="text-sm font-bold leading-relaxed">{g0.leave.body}</p>
      </Modal>
      {kind === 'daily'
        ? <DailyResult t={t} open={endOpen && s.over} onClose={() => setEndOpen(false)} s={s} date={date} demo={demo} onMenu={() => leave.skip(onMenu)} />
        : (
          <Modal isOpen={endOpen && s.over} onClose={() => setEndOpen(false)}
            title={s.guesses[0]?.correct === HAND_SIZE ? t.sixPerfect : fill(t.sixScore, { n: s.guesses[0]?.correct ?? 0 })}
            kicker={t.six} icon={GiSixEyes} band={QT_BAND} panelClassName={QT_PANEL}
            footer={<>
              <button type="button" className="qt-btn is-paper flex-1 py-3.5" onClick={() => leave.skip(onMenu)}>{t.backMenu}</button>
              <button type="button" className="qt-btn is-ink-on-paper flex-1 py-3.5" onClick={() => leave.skip(onAgain)}>{t.playAgain}</button>
            </>}>
            <div className="grid grid-cols-8 gap-1">
              {s.hand.map((c, i) => <PlayingCard key={i} card={c} className="w-full" ring={s.guesses[0]?.guess[i] === c.rank} dim={s.guesses[0]?.guess[i] !== c.rank} />)}
            </div>
          </Modal>
        )}
    </PlayShell>
  );
}

/** 每日一手的價目（桌布下方一排，問之前就看得到） */
function PriceList({ t }: { t: QtText }) {
  const items: [string, number][] = [['①', PRICES[1]], ['②③④', PRICES[2]], ['⑤–⑪', PRICES[5]]];
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-black">
      {items.map(([k, v]) => <span key={k}><span className="text-[var(--qt-gold)]">{k}</span> {fill(t.price, { n: v })}</span>)}
    </div>
  );
}

function DailyResult({ t, open, onClose, s, date, demo, onMenu }: {
  t: QtText; open: boolean; onClose: () => void; s: ChallengeState; date: string; demo: number | null; onMenu: () => void;
}) {
  const m = useMessages();
  const g = useGameText();
  const locale = useLocale();
  const steps = stepsOf(s);
  const wrong = s.guesses.filter((x) => x.correct < HAND_SIZE).length;
  const data: Omit<QtCardData, 'font'> = {
    steps,
    hand: s.hand,
    text: {
      name: t.title,
      date: fill(t.dailyTitle, { date }),
      spent: fill(t.dailyResult, { n: spent(s) }),
      stats: fill(t.dailyStats, { asks: s.asks.length, wrong }),
      demo: demo !== null ? fill(t.demo, { n: demo }) : null,
      brand: t.title,
      from: fill(g.share.cardFrom, { show: m.meta.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  };
  const font = typeof document === 'undefined' ? 'system-ui'
    : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const words = `${Object.values(data.text).join('')}0123456789①②③④⑤⑥⑦⑧⑨⑩⑪✓✕AJQK`;
  const card = useShareCard({
    isOpen: open,
    draw: drawQtCard({ ...data, font }),
    contentKey: JSON.stringify(data),
    fileName: 'question-and-truth',
    homePath: localePath(locale, QUESTION_AND_TRUTH),
    campaign: 'question-and-truth',
    layouts: ['story'],
    fonts: [{ font: `900 40px ${font}`, text: words }, { font: `700 40px ${font}`, text: words }],
  });
  return (
    <ShareResultModal isOpen={open} onClose={onClose} title={data.text.spent} card={card} onRestart={onMenu} restartLabel={t.backMenu}
      classes={QT_SHARE} frameClassName="rounded-[10px]"
      srText={`${data.text.date} ${data.text.spent} ${data.text.stats} ${demo !== null ? data.text.demo : t.demoWorking}`} />
  );
}
