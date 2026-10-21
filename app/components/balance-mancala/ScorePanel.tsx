'use client';
import { COLOURS, END_SCORE, finalScore, type Colour, type Scores, type Seat } from '@/games/balance-mancala/engine';
import { DISH_BG } from './palette';
import PieceDisc from './PieceDisc';

/** 分數條的刻度：0–33，30 的結束線畫在 91% 的位置，超過 30 的那一點點看得到 */
const SCALE = 33;
const pct = (v: number) => `${(Math.min(v, SCALE) / SCALE) * 100}%`;

/**
 * 每個座位一列：紅藍綠三條分數條（30 分結束線）＋即時的最終分數（2×最低−最高）。
 * 預覽一手時，得分的那一列把增加的那段畫成半透明，最終分數旁邊寫變成多少。
 */
export default function ScorePanel({ scores, names, turn, gain, colourShort, finalLabel }: {
  scores: Scores[];
  names: string[];
  turn: Seat | null;
  gain: { owner: Seat; colour: Colour | null; points: number } | null;
  colourShort: string[];
  finalLabel: string;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      {scores.map((sc, seat) => {
        const g = gain && gain.owner === seat && gain.colour !== null ? gain : null;
        const after = g ? (sc.map((v, k) => (k === g.colour ? v + g.points : v)) as Scores) : sc;
        const f = finalScore(sc);
        const f2 = finalScore(after);
        return (
          <div key={seat} className={`flex items-center gap-2 rounded-xl px-2 py-1 ${turn === seat ? 'bg-[#201211]/[0.08]' : ''}`}
            aria-label={`${names[seat]}: ${COLOURS.map((c) => `${colourShort[c]} ${sc[c]}`).join(', ')}; ${finalLabel} ${f}`}>
            <PieceDisc seat={seat} size="1.65rem" />
            <p className="w-[4.25rem] shrink-0 truncate text-xs font-black">{names[seat]}</p>
            <div className="flex min-w-0 flex-1 flex-col gap-[3px]" aria-hidden="true">
              {COLOURS.map((c) => {
                const v = sc[c];
                const add = g && g.colour === c ? g.points : 0;
                return (
                  <div key={c} className="flex items-center gap-1">
                    <span className="w-[1.4rem] shrink-0 whitespace-nowrap text-[9px] font-black leading-none text-ink-soft">{colourShort[c]}</span>
                    <span className="w-5 shrink-0 text-right text-[10px] font-black tabular-nums leading-none">{v}</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#201211]/[0.08]">
                      <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: pct(v), background: DISH_BG[c] }} />
                      {add > 0 && (
                        <div className="absolute inset-y-0 rounded-full opacity-45"
                          style={{ left: pct(v), width: `calc(${pct(v + add)} - ${pct(v)})`, background: DISH_BG[c] }} />
                      )}
                      <div className="absolute inset-y-0 w-0.5 bg-[#201211]/60" style={{ left: pct(END_SCORE) }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="w-11 shrink-0 text-right" aria-hidden="true">
              <p className="text-lg font-black tabular-nums leading-none">{f}</p>
              <p className="mt-0.5 text-[9px] font-black leading-none text-ink-soft">{g && f2 !== f ? `→ ${f2}` : finalLabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
