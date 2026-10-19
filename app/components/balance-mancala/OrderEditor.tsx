'use client';
import { GiAngelWings, GiImpLaugh } from 'react-icons/gi';
import { LuTriangleAlert, LuWandSparkles } from 'react-icons/lu';
import { CELL_COLOUR, DEVIL, finalScore, type Colour, type Scores, type Seat, type Sow } from '@/games/balance-mancala/engine';
import { fill } from '@/i18n/gameText';
import type { BalanceMancalaText } from '@/games/balance-mancala/text';
import { CREAM, DISH_BG, GOLD, NAVY, cellName } from './palette';
import PieceDisc from './PieceDisc';

/** 落點的小標：盤子是那個顏色＋短標，惡魔、天使是圖示 */
function DestChip({ cell, t }: { cell: number; t: BalanceMancalaText }) {
  const c = CELL_COLOUR[cell];
  const base = 'grid h-4 min-w-[1.6rem] place-items-center rounded-full px-1 text-[9px] font-black leading-none';
  if (c !== null) return <span className={base} style={{ background: DISH_BG[c], color: CREAM }}>{t.colourShort[c]}</span>;
  return cell === DEVIL
    ? <span className={base} style={{ background: '#0b0d18', color: GOLD }}><GiImpLaugh aria-hidden="true" className="size-3" /></span>
    : <span className={base} style={{ background: CREAM, color: NAVY, boxShadow: `inset 0 0 0 1px ${GOLD}` }}><GiAngelWings aria-hidden="true" className="size-3" /></span>;
}

/**
 * 排序編輯器：選好起點格後出現。預設套用電腦建議的排法，玩家可以
 * 1. 直接選「最後一顆給誰」（這一手最重要的決定，其餘的子會重新排成建議的樣子）
 * 2. 點兩顆子交換位置，自己微調
 * 3. 天使／惡魔格同分時選顏色
 * 盤面同時畫出播完的樣子（每顆子落在哪、最後一顆在哪、誰得幾分）。
 */
export default function OrderEditor({
  t, from, pieces, order, sel, preview, names, endsText, onLast, onSlot, onColour, onSuggest, onCancel, onSow,
}: {
  t: BalanceMancalaText;
  from: number;
  /** 起點格裡原本的子（決定「最後一顆給誰」有哪些選項） */
  pieces: Seat[];
  order: Seat[];
  sel: number | null;
  preview: Sow;
  names: string[];
  /** 這一手會結束遊戲時的提醒（不會就是 null） */
  endsText: string | null;
  onLast: (owner: Seat) => void;
  onSlot: (i: number) => void;
  onColour: (c: Colour) => void;
  onSuggest: () => void;
  onCancel: () => void;
  onSow: () => void;
}) {
  const owners = [...new Set(pieces)].sort((a, b) => a - b);
  const last = order[order.length - 1];
  // 得分的人這一手前後的分數（還沒選色時兩者相同）
  const after = preview.scores[preview.owner];
  const prior = preview.colour !== null ? (after.map((v, k) => (k === preview.colour ? v - preview.points : v)) as Scores) : after;
  const chip = 'rounded-full bg-tile-ink/[0.07] px-3 py-1.5 text-xs font-black text-tile-ink transition hover:bg-tile-ink/[0.12]';

  return (
    <div className="flex w-full flex-col gap-3 rounded-2xl bg-tile-ink/[0.05] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black">{fill(t.editorTitle, { cell: cellName(from, t), n: order.length })}</p>
        <button type="button" onClick={onSuggest} className={`flex items-center gap-1 ${chip}`}>
          <LuWandSparkles aria-hidden="true" />{t.suggest}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold text-ink-soft">{t.whoLast}</p>
        <div className="mt-1.5 flex flex-wrap gap-2" role="radiogroup" aria-label={t.whoLast}>
          {owners.map((o) => (
            <button key={o} type="button" role="radio" aria-checked={o === last} aria-label={names[o]} onClick={() => onLast(o)}
              className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-3 text-xs font-black transition ${o === last ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-tile-ink hover:bg-tile-ink/[0.12]'}`}>
              <PieceDisc seat={o} size="1.75rem" />
              <span className="max-w-[5.5rem] truncate">{names[o]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-bold text-ink-soft">{t.order} · {t.swapHint}</p>
        <ol className="mt-1.5 flex flex-wrap gap-x-1 gap-y-1.5">
          {order.map((o, i) => {
            const isLast = i === order.length - 1;
            const dest = preview.path[i];
            return (
              <li key={i}>
                <button type="button" onClick={() => onSlot(i)} aria-pressed={sel === i}
                  aria-label={`${i + 1}. ${names[o]} → ${cellName(dest, t)}`}
                  className={`flex flex-col items-center gap-1 rounded-xl px-1 pb-1 pt-1.5 transition ${sel === i ? '-translate-y-0.5 bg-tile-ink/[0.14]' : 'hover:bg-tile-ink/[0.07]'}`}>
                  <PieceDisc seat={o} size={isLast ? '2.1rem' : '1.7rem'} ring={sel === i ? 'selected' : isLast ? 'last' : undefined} />
                  <DestChip cell={dest} t={t} />
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1" aria-live="polite">
        <PieceDisc seat={preview.owner} size="1.5rem" />
        <p className="text-base font-black">
          {fill(t.gain, { owner: names[preview.owner], points: preview.points, colour: preview.colour !== null ? t.colourNames[preview.colour] : '?' })}
        </p>
        {preview.colour !== null && (
          <p className="text-xs font-bold text-ink-soft">
            {fill(t.gainDetail, {
              colour: t.colourShort[preview.colour], from: prior[preview.colour], to: after[preview.colour],
              f1: finalScore(prior), f2: finalScore(after),
            })}
          </p>
        )}
      </div>

      {preview.options.length > 1 && (
        <div>
          <p className="text-xs font-bold text-ink-soft">{t.pickColour}</p>
          <div className="mt-1.5 flex gap-2" role="radiogroup" aria-label={t.pickColour}>
            {preview.options.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={preview.colour === c} onClick={() => onColour(c)}
                className={`rounded-full px-4 py-1.5 text-sm font-black transition ${preview.colour === c ? 'ring-4 ring-tile-ink' : 'opacity-80'}`}
                style={{ background: DISH_BG[c], color: CREAM }}>
                {t.colourNames[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {endsText && (
        <p className="flex items-center gap-2 rounded-xl bg-tile-ink px-3 py-2 text-xs font-black text-tile-cream">
          <LuTriangleAlert aria-hidden="true" className="shrink-0 text-base" />{endsText}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel}
          className="h-12 rounded-2xl bg-tile-ink/[0.07] text-sm font-black text-tile-ink transition hover:bg-tile-ink/[0.12]">{t.cancel}</button>
        <button type="button" onClick={onSow} disabled={preview.colour === null}
          className="h-12 rounded-2xl bg-tile-ink text-sm font-black text-tile-cream transition active:scale-[0.98] disabled:opacity-40">{t.sow}</button>
      </div>
    </div>
  );
}
