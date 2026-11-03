'use client';
import { useState, type ReactNode } from 'react';
import { GiConversation } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { fill } from '@/i18n/gameText';
import { HAND_SIZE, SUITS, isValidQuestion, rankLabel, type Question, type QuestionId, type Suit } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import { QT_BAND, QT_PANEL } from './palette';
import { SuitIcon } from './PlayingCard';
import { CIRCLED, QuestionLabel } from './qtext';

const GROUPS: { key: keyof QtText['groups']; ids: QuestionId[] }[] = [
  { key: 'sum', ids: [1, 2, 3, 4] },
  { key: 'count', ids: [5, 6, 7] },
  { key: 'pos', ids: [8, 9, 10, 11] },
];

type Draft = { id: QuestionId; pos: number[]; suit: Suit | null; rank: number | null; which: 'max' | 'min' | null };

function toQuestion(d: Draft): Question | null {
  const q: Question | null =
    d.id === 1 ? { q: 1, pos: [...d.pos].sort((a, b) => a - b) }
    : d.id === 2 || d.id === 8 ? (d.suit === null ? null : { q: d.id, suit: d.suit })
    : d.id === 7 ? (d.rank === null ? null : { q: 7, rank: d.rank })
    : d.id === 11 ? (d.which === null ? null : { q: 11, which: d.which })
    : { q: d.id } as Question;
  return q && isValidQuestion(q) ? q : null;
}

/**
 * 提問：11 題分三組（和、張數、位置），選了要帶參數的（① 三個位置、②⑧ 花色、⑦ 點數、⑪ 最大或最小）就在下面接著選，
 * 最下面那顆鈕寫出完整的題目再送出。每日一手時每題旁邊標價錢。
 * 手機在彈窗裡（AskSheet）；桌機直接攤在桌布中間的一張牌紙上（大話骰桌機東西太少、散在大片底色上被點名過）。
 */
export function AskPanel({ t, onAsk, price, extra }: {
  t: QtText; onAsk: (q: Question) => void; price?: (id: QuestionId) => number; extra?: ReactNode;
}) {
  const [d, setD] = useState<Draft>({ id: 1, pos: [], suit: null, rank: null, which: null });
  const q = toQuestion(d);
  const pick = (id: QuestionId) => setD((x) => ({ ...x, id }));
  const choice = (on: boolean) => `qt-btn min-h-10 px-2 text-sm ${on ? 'is-on' : 'is-paper'}`;

  return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 lg:grid-cols-3">
          {GROUPS.map((g) => (
            <fieldset key={g.key}>
              <legend className="mb-1.5 text-xs font-black opacity-65">{t.groups[g.key]}</legend>
              <div role="radiogroup" className="flex flex-col gap-1">
                {g.ids.map((id) => (
                  <button key={id} type="button" role="radio" aria-checked={d.id === id} onClick={() => pick(id)}
                    className={`qt-btn flex min-h-10 items-center gap-2 px-2.5 py-1.5 text-left text-sm lg:min-h-9 lg:py-1 ${d.id === id ? 'is-on' : 'is-paper'}`}>
                    <span className="text-base leading-none">{CIRCLED[id]}</span>
                    <span className="min-w-0 flex-1 leading-tight">{t.q[String(id) as keyof QtText['q']].name}</span>
                    {price && <span className="shrink-0 rounded-full bg-[var(--qt-red)] px-1.5 text-xs leading-5 text-[#f1eed8]">{fill(t.price, { n: price(id) })}</span>}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        {d.id === 1 && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-black opacity-70">{t.pickPositions}</legend>
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: HAND_SIZE }, (_, p) => {
                const on = d.pos.includes(p);
                return (
                  <button key={p} type="button" aria-pressed={on}
                    onClick={() => setD((x) => ({ ...x, pos: on ? x.pos.filter((y) => y !== p) : x.pos.length < 3 ? [...x.pos, p] : [...x.pos.slice(1), p] }))}
                    className={`${choice(on)} tabular-nums`}>{p + 1}</button>
                );
              })}
            </div>
          </fieldset>
        )}
        {(d.id === 2 || d.id === 8) && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-black opacity-70">{t.pickSuit}</legend>
            <div role="radiogroup" className="grid grid-cols-4 gap-1.5">
              {SUITS.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={d.suit === s} aria-label={['♠', '♥', '♦', '♣'][s]}
                  onClick={() => setD((x) => ({ ...x, suit: s }))} className={`${choice(d.suit === s)} grid place-items-center`}>
                  <SuitIcon suit={s} className="size-6" color={d.suit === s ? 'var(--qt-paper)' : undefined} />
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {d.id === 7 && (
          <fieldset>
            <legend className="mb-1.5 text-sm font-black opacity-70">{t.pickRank}</legend>
            <div role="radiogroup" className="grid grid-cols-7 gap-1">
              {Array.from({ length: 13 }, (_, i) => i + 1).map((r) => (
                <button key={r} type="button" role="radio" aria-checked={d.rank === r} onClick={() => setD((x) => ({ ...x, rank: r }))}
                  className={`${choice(d.rank === r)} tabular-nums`}>{rankLabel(r)}</button>
              ))}
            </div>
          </fieldset>
        )}
        {d.id === 11 && (
          <div role="radiogroup" className="grid grid-cols-2 gap-1.5">
            {(['max', 'min'] as const).map((w) => (
              <button key={w} type="button" role="radio" aria-checked={d.which === w} onClick={() => setD((x) => ({ ...x, which: w }))}
                className={choice(d.which === w)}>{w === 'max' ? t.qMax : t.qMin}</button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" disabled={!q} onClick={() => q && onAsk(q)} className="qt-btn is-ink-on-paper flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 px-3 py-2.5 text-base">
            <span className="shrink-0">{t.askIt}</span>
            {q && <span className="min-w-0 truncate text-sm font-bold opacity-85"><QuestionLabel t={t} q={q} /></span>}
          </button>
          {extra}
        </div>
      </div>
  );
}

export default function AskSheet({ t, open, onClose, onAsk, price, kicker }: {
  t: QtText; open: boolean; onClose: () => void; onAsk: (q: Question) => void; price?: (id: QuestionId) => number; kicker?: string;
}) {
  return (
    <Modal isOpen={open} onClose={onClose} title={t.askBtn} kicker={kicker} icon={GiConversation} band={QT_BAND} panelClassName={`${QT_PANEL} lg:!max-w-[640px]`}>
      <AskPanel t={t} onAsk={onAsk} price={price} />
    </Modal>
  );
}
