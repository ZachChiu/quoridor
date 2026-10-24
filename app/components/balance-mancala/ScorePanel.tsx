'use client';
import { COLOURS, END_SCORE, finalScore, type Colour, type Scores, type Seat } from '@/games/balance-mancala/engine';
import { CLOTH, DISH_BG, seatLook } from './palette';
import PieceDisc from './PieceDisc';

/** 分數條的刻度：0–33，30 的結束線畫在 91% 的位置，超過 30 的那一點點看得到 */
const SCALE = 33;
const pct = (v: number) => `${(Math.min(v, SCALE) / SCALE) * 100}%`;

/**
 * 每個座位一列：紅藍綠三條分數條（30 分結束線）＋即時的最終分數（2×最低−最高）。
 * 預覽一手時，得分的那一列把增加的那段畫成半透明，最終分數旁邊寫變成多少。
 * 一手套用之後，加分的那條慢慢長過去、變了的數字跳一下（.mcl-pop：key 跟著數值換，換了才重播；0 分不跳）——
 * 盤面上「+N」與黃銅聲是第一拍，這裡是記進帳的第二拍。減少動態效果時都不動。
 *
 * 連線時自己那一列多一圈自己座位色的框，中間留一道縫（CLAUDE.md：連線時比分上自己那塊多一圈自己顏色的框；
 * 不在畫面上寫「你」）。列是切角的（.mcl-cut），框也要切角 —— clip-path 會把 box-shadow／outline 切掉，
 * 所以框是外面兩層：座位色一層、布色一層（那道縫），列本身照舊。
 */
export default function ScorePanel({ scores, names, turn, gain, colourShort, finalLabel, mine = null }: {
  scores: Scores[];
  names: string[];
  turn: Seat | null;
  gain: { owner: Seat; colour: Colour | null; points: number } | null;
  colourShort: string[];
  finalLabel: string;
  /** 這台裝置上的人坐哪（連線）；null＝沒有「自己」（本機對戰、跟 AI 玩時名字已經寫「你」） */
  mine?: Seat | null;
}) {
  return (
    <div className="flex w-full flex-col gap-1">
      {scores.map((sc, seat) => {
        const g = gain && gain.owner === seat && gain.colour !== null ? gain : null;
        const after = g ? (sc.map((v, k) => (k === g.colour ? v + g.points : v)) as Scores) : sc;
        const f = finalScore(sc);
        const f2 = finalScore(after);
        const row = (
          <div key={seat} className={`mcl-cut flex items-center gap-2 px-2 py-1 ${turn === seat ? 'bg-[#201211]/[0.08]' : ''}`}
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
                    <span className="w-5 shrink-0 text-right text-[10px] font-black tabular-nums leading-none">
                      <span key={v} className={v ? 'mcl-pop' : ''}>{v}</span>
                    </span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#201211]/[0.08]">
                      <div className="absolute inset-y-0 left-0 rounded-full motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out" style={{ width: pct(v), background: DISH_BG[c] }} />
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
              <p className="text-lg font-black tabular-nums leading-none"><span key={f} className={sc.some((x) => x > 0) ? 'mcl-pop' : ''}>{f}</span></p>
              <p className="mt-0.5 text-[9px] font-black leading-none text-ink-soft">{g && f2 !== f ? `→ ${f2}` : finalLabel}</p>
            </div>
          </div>
        );
        if (seat !== mine) return row;
        return (
          <div key={seat} className="mcl-cut p-[2px]" style={{ background: seatLook(seat).bg }}>
            <div className="mcl-cut p-[2px]" style={{ background: CLOTH }}>{row}</div>
          </div>
        );
      })}
    </div>
  );
}
