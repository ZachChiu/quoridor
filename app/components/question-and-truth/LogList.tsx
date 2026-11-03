import { fill } from '@/i18n/gameText';
import type { Answer, Question, Seat } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import { SeatMark } from './SeatMark';
import { CIRCLED, QuestionLabel, answerText, questionText, ranksText } from './qtext';

export type LogRow =
  | { seat: Seat | null; kind: 'ask'; q: Question; a: Answer; price?: number }
  | { seat: Seat | null; kind: 'truth'; guess: number[]; ok: boolean; correct?: number; price?: number };

/**
 * 問答紀錄：一題一列，前面是誰問的（紅方的方塊、黑方的黑桃；挑戰版只有一方就不畫），題號、題目、回答。
 * 最新的在最上面。真相那列寫報了什麼、對不對。
 */
export default function LogList({ t, rows, className = '' }: { t: QtText; rows: LogRow[]; className?: string }) {
  if (!rows.length) return <p className={`text-sm font-bold opacity-60 ${className}`}>{t.logEmpty}</p>;
  return (
    <ol className={`flex flex-col gap-1.5 ${className}`} aria-live="polite">
      {rows.map((r, i) => ({ r, n: i + 1 })).reverse().map(({ r, n }) => (
        <li key={n} className="flex items-start gap-2 rounded-[5px] bg-[color-mix(in_srgb,var(--qt-fg)_7%,transparent)] px-2.5 py-2 text-sm font-bold leading-snug">
          {r.seat !== null && <SeatMark seat={r.seat} t={t} className="mt-0.5 w-4" />}
          {r.kind === 'ask' ? (
            <>
              <span className="w-5 shrink-0 text-base leading-tight text-[var(--qt-gold)]">{CIRCLED[r.q.q]}</span>
              <span className="min-w-0 flex-1">
                <span className="sr-only">{questionText(t, r.q)}</span>
                <span aria-hidden="true"><QuestionLabel t={t} q={r.q} /></span>
              </span>
              <span className="shrink-0 rounded-[4px] bg-[var(--qt-paper)] px-1.5 text-base font-black tabular-nums text-[var(--qt-ink)]">{answerText(t, r.a)}</span>
            </>
          ) : (
            <>
              <span className="w-5 shrink-0 text-base leading-tight text-[var(--qt-gold)]">✦</span>
              <span className="min-w-0 flex-1 tabular-nums">{fill(t.truthLog, { guess: ranksText(r.guess) })}</span>
              <span className={`shrink-0 rounded-[4px] px-1.5 text-sm font-black ${r.ok ? 'bg-[var(--qt-paper)] text-[var(--qt-ink)]' : 'bg-[var(--qt-red)] text-[#f1eed8]'}`}>
                {r.correct !== undefined && !r.ok ? `${r.correct}/8` : r.ok ? t.right : t.wrong}
              </span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
