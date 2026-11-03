import { Fragment } from 'react';
import { fill } from '@/i18n/gameText';
import { rankLabel, type Answer, type Question, type Suit } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import { SUIT_NAMES, SuitChip } from './PlayingCard';

/** 一題問出口的樣子（純文字，給讀屏與分享）：花色寫成 ♠♥♦♣、位置寫 1–8 */
export function questionText(t: QtText, q: Question): string {
  return fill(t.q[String(q.q) as keyof QtText['q']].ask, vars(t, q, (s) => SUIT_NAMES[s]));
}

function vars(t: QtText, q: Question, suit: (s: Suit) => string): Record<string, string> {
  if (q.q === 1) { const [a, b, c] = [...q.pos].sort((x, y) => x - y).map((p) => String(p + 1)); return { a, b, c }; }
  if (q.q === 2 || q.q === 8) return { suit: suit(q.suit) };
  if (q.q === 7) return { rank: rankLabel(q.rank) };
  if (q.q === 11) return { which: q.which === 'max' ? t.qMax : t.qMin };
  return {};
}

/** 畫面上的題目：花色畫成一小片牌（黑底上才看得到黑桃） */
export function QuestionLabel({ t, q }: { t: QtText; q: Question }) {
  const tpl = t.q[String(q.q) as keyof QtText['q']].ask;
  const v = vars(t, q, () => '');
  const parts = tpl.split(/(\{\w+\})/);
  return (
    <span>
      {parts.map((p, i) => {
        const m = /^\{(\w+)\}$/.exec(p);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        if (m[1] === 'suit' && (q.q === 2 || q.q === 8)) return <SuitChip key={i} suit={q.suit} />;
        return <Fragment key={i}>{v[m[1]] ?? p}</Fragment>;
      })}
    </span>
  );
}

/** 回答：和與張數是數字；位置題寫 1–8，同一組用「·」連、組與組之間「／」；沒有就寫「沒有」 */
export function answerText(t: QtText, a: Answer): string {
  if (typeof a === 'number') return String(a);
  const groups = a.filter((g) => g.length);
  if (!groups.length) return t.none;
  return groups.map((g) => g.map((p) => p + 1).join('·')).join(' ／ ');
}

export const CIRCLED = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪'];

export const ranksText = (ranks: number[]) => ranks.map(rankLabel).join(' ');
