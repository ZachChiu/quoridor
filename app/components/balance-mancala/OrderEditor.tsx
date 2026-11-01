'use client';
import { useState } from 'react';
import { GiAngelWings, GiImpLaugh } from 'react-icons/gi';
import { LuChevronDown, LuTriangleAlert, LuWandSparkles } from 'react-icons/lu';
import { CELL_COLOUR, DEVIL, finalScore, type Colour, type Scores, type Seat, type Sow } from '@/games/balance-mancala/engine';
import { fill } from '@/i18n/gameText';
import type { BalanceMancalaText } from '@/games/balance-mancala/text';
import { BRASS, CLOTH_LIGHT, DISH_BG, INK, WOOD, cellName } from './palette';
import PieceDisc from './PieceDisc';

/** 落點的小標：盤子是那個顏色＋短標，惡魔、天使是圖示 */
function DestChip({ cell, t }: { cell: number; t: BalanceMancalaText }) {
  const c = CELL_COLOUR[cell];
  const base = 'grid h-4 min-w-[1.6rem] place-items-center rounded-full px-1 text-[9px] font-black leading-none';
  if (c !== null) return <span className={base} style={{ background: DISH_BG[c], color: CLOTH_LIGHT }}>{t.colourShort[c]}</span>;
  return cell === DEVIL
    ? <span className={base} style={{ background: INK, color: BRASS }}><GiImpLaugh aria-hidden="true" className="size-3" /></span>
    : <span className={base} style={{ background: CLOTH_LIGHT, color: WOOD, boxShadow: `inset 0 0 0 1px ${BRASS}` }}><GiAngelWings aria-hidden="true" className="size-3" /></span>;
}

/** 「最後一顆給誰」的每一個選項播完會怎樣（建議排法下）：誰 +幾分、記哪一色、他的最終分怎麼變 */
export type Outcome = { owner: Seat; points: number; colour: Colour | null; f1: number; f2: number };

/**
 * 排序編輯器：選好起點格後出現。
 * 2026-11-01（Zach：「自己都有點難玩懂」）：最後一顆給誰改成一張張「結果」卡（誰 +幾分、哪一色、最終分怎麼變），
 * 新手只要挑一個結果；落下順序收進「自己排落下順序」，要微調再打開。預設套用 AI 建議的排法，玩家可以
 * 1. 直接選「最後一顆給誰」（這一手最重要的決定，其餘的子會重新排成建議的樣子）
 * 2. 點兩顆子交換位置，自己微調
 * 3. 天使／惡魔格同分時選顏色
 * 盤面同時畫出播完的樣子（每顆子落在哪、最後一顆在哪、誰得幾分）。
 */
export default function OrderEditor({
  t, from, pieces, order, sel, preview, names, endsText, onLast, onSlot, onColour, onSuggest, onCancel, onSow, outcomes,
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
  /** 每一個「最後一顆給誰」的結果；沒給就只列名字 */
  outcomes?: Outcome[];
}) {
  const [showOrder, setShowOrder] = useState(false);
  const owners = [...new Set(pieces)].sort((a, b) => a - b);
  const last = order[order.length - 1];
  // 得分的人這一手前後的分數（還沒選色時兩者相同）
  const after = preview.scores[preview.owner];
  const prior = preview.colour !== null ? (after.map((v, k) => (k === preview.colour ? v - preview.points : v)) as Scores) : after;
  // 播種面板是一條印花布（上下兩道梳線）；裡面的選項是切角的小布片，選中與「播種」是黃銅牌 —— globals.css 的 .mcl-*
  const patch = 'mcl-cut bg-[rgb(var(--mcl-ink-rgb)/0.07)] transition fine:hover:bg-[rgb(var(--mcl-ink-rgb)/0.12)]';
  const chip = `${patch} px-3 py-1.5 text-xs font-black`;

  return (
    <div className="mcl-cloth flex w-full flex-col gap-3 px-3 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black">{fill(t.editorTitle, { cell: cellName(from, t), n: order.length })}</p>
        <button type="button" onClick={onSuggest} className={`flex items-center gap-1 ${chip}`}>
          <LuWandSparkles aria-hidden="true" />{t.suggest}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold text-ink-soft">{t.whoLast}{outcomes ? ` ${t.whoLastHint}` : ''}</p>
        <div className={`mt-1.5 ${outcomes ? 'grid grid-cols-2 gap-2' : 'flex flex-wrap gap-2'}`} role="radiogroup" aria-label={t.whoLast}>
          {owners.map((o) => {
            const r = outcomes?.find((x) => x.owner === o);
            if (!r) return (
              <button key={o} type="button" role="radio" aria-checked={o === last} aria-label={names[o]} onClick={() => onLast(o)}
                className={`flex items-center gap-1.5 py-1 pl-1.5 pr-3 text-xs font-black ${o === last ? 'mcl-plaque' : patch}`}>
                <PieceDisc seat={o} size="1.75rem" />
                <span className="max-w-[5.5rem] truncate">{names[o]}</span>
              </button>
            );
            return (
              <button key={o} type="button" role="radio" aria-checked={o === last} onClick={() => onLast(o)}
                aria-label={`${names[o]} +${r.points} ${r.colour !== null ? t.colourNames[r.colour] : ''}`}
                className={`flex items-center gap-2 px-2 py-1.5 text-left ${o === last ? 'mcl-plaque' : patch}`}>
                <PieceDisc seat={o} size="1.9rem" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-black leading-tight">
                    <span className="truncate">{names[o]}</span> +{r.points}
                    {r.colour !== null && (
                      <span className="rounded-full px-1.5 py-0.5 text-[10px] leading-none" style={{ background: DISH_BG[r.colour], color: CLOTH_LIGHT }}>{t.colourShort[r.colour]}</span>
                    )}
                  </span>
                  <span className="block text-[11px] font-bold leading-tight text-ink-soft">{t.final} {r.f1} → {r.colour !== null ? r.f2 : '?'}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button type="button" onClick={() => setShowOrder((v) => !v)} aria-expanded={showOrder}
        className="-my-1 flex items-center gap-1 self-start py-1 text-xs font-black text-ink-soft">
        <LuChevronDown aria-hidden="true" className={`transition-transform ${showOrder ? 'rotate-180' : ''}`} />
        {showOrder ? t.orderHide : t.orderToggle}
      </button>
      <div hidden={!showOrder}>
        <p className="text-xs font-bold text-ink-soft">{t.order} · {t.swapHint}</p>
        <ol className="mt-1.5 flex flex-wrap gap-x-1 gap-y-1.5">
          {order.map((o, i) => {
            const isLast = i === order.length - 1;
            const dest = preview.path[i];
            return (
              <li key={i}>
                <button type="button" onClick={() => onSlot(i)} aria-pressed={sel === i}
                  aria-label={`${i + 1}. ${names[o]} → ${cellName(dest, t)}`}
                  className={`mcl-cut flex flex-col items-center gap-1 px-1 pb-1 pt-1.5 transition ${sel === i ? '-translate-y-0.5 bg-[rgb(var(--mcl-ink-rgb)/0.14)]' : 'fine:hover:bg-[rgb(var(--mcl-ink-rgb)/0.07)]'}`}>
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
                className={`rounded-full px-4 py-1.5 text-sm font-black transition ${preview.colour === c ? 'ring-4 ring-[var(--mcl-ink)]' : 'opacity-80'}`}
                style={{ background: DISH_BG[c], color: CLOTH_LIGHT }}>
                {t.colourNames[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {endsText && (
        <p className="mcl-cut flex items-center gap-2 bg-[var(--mcl-ink)] px-3 py-2 text-xs font-black text-[var(--mcl-cloth)]">
          <LuTriangleAlert aria-hidden="true" className="shrink-0 text-base" />{endsText}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel}
          className={`${patch} h-12 text-sm font-black`}>{t.cancel}</button>
        <button type="button" onClick={onSow} disabled={preview.colour === null}
          className="mcl-plaque h-12 text-sm font-black active:scale-[0.98] disabled:opacity-40">{t.sow}</button>
      </div>
    </div>
  );
}
