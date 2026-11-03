'use client';
import { LETTERS, OP_GLYPH, rowsOf, type Block, type Size } from '@/games/equation-pyramid/engine';

/**
 * 盤面：一座階梯金字塔，一格一塊彩陶磚（照卓瑟王墓室的牆磚：上緣圓、下緣方，上半反光、下半深，磚縫是石灰白 —— 就是頁面的底色）。
 * 每塊磚左上角是字母，中間是「符號＋數字」。10 格是 1-2-3-4 排，大金字塔 15 格是 1-2-3-4-5 排。
 *
 * 選中的磚翻成石灰白、右上角一顆深釉圓牌寫第幾個；答對的那三格跳一下、答錯的抖一下；電腦答的那三格閃一下褪釉的橄欖色。
 * 尺寸都用 cqw（跟著盤面寬度），整盤的寬高比由排數決定（BOARD_ASPECT）。
 */
const GAP = 1.8; // 磚縫，cqw
/** 磚的高 / 寬：預設 0.8；外層可以用 CSS 變數 --ep-ratio 換（直的手機用 1，磚高一點、盤面吃滿剩下的高度） */
const RATIO = 'var(--ep-ratio, 0.8)';

export function boardAspect(size: Size) {
  const rows = rowsOf(size).length;
  const w = (100 - (rows - 1) * GAP) / rows;
  return `100 / calc(${rows * w} * ${RATIO} + ${(rows - 1) * GAP})`;
}

export type BoardFx = { key: number; cells: readonly number[]; tone: 'me' | 'cpu' | 'wrong' };

export default function PyramidBoard({ blocks, selected = [], fx, onTap, label, className = '' }: {
  blocks: readonly Block[];
  /** 依順序選的格子（第幾個寫在磚上） */
  selected?: readonly number[];
  /** 剛送出的那一組：答對跳一下、答錯抖一下、電腦答的閃一下（key 換了就重播） */
  fx?: BoardFx;
  onTap?: (i: number) => void;
  label?: string;
  className?: string;
}) {
  const size = blocks.length as Size;
  const rows = rowsOf(size);
  const w = (100 - (rows.length - 1) * GAP) / rows.length;
  return (
    <div role={onTap ? 'group' : 'img'} aria-label={label}
      className={`w-full select-none [container-type:inline-size] ${className}`} style={{ aspectRatio: boardAspect(size) }}>
      <div className="flex flex-col items-center" style={{ gap: `${GAP}cqw` }}>
      {rows.map((n, r) => (
        <div key={r} className="flex" style={{ gap: `${GAP}cqw` }}>
          {Array.from({ length: n }, (_, c) => {
            // 每一排的格數是 1、2、3…，第 r 排從第 r(r+1)/2 格開始
            const k = (r * (r + 1)) / 2 + c;
            const b = blocks[k];
            const order = selected.indexOf(k);
            const on = order >= 0;
            const hit = fx?.cells.includes(k);
            const motion = hit ? (fx!.tone === 'wrong' ? 'ep-shake' : fx!.tone === 'cpu' ? 'ep-cpu' : 'ep-pop') : '';
            const style = { width: `${w}cqw`, height: `calc(${w}cqw * ${RATIO})` };
            const face = (
              <>
                <span className="absolute left-[9%] top-[7%] font-black leading-none" style={{ fontSize: `${w * 0.17}cqw` }}>{LETTERS[k]}</span>
                <span className="font-black tabular-nums leading-none" style={{ fontSize: `${w * 0.36}cqw` }}>
                  <span className="ep-op mr-[0.06em]">{OP_GLYPH[b.op]}</span>{b.n}
                </span>
                {on && (
                  <span className="ep-order absolute right-[7%] top-[7%] grid place-items-center rounded-full font-black leading-none"
                    style={{ width: `${w * 0.22}cqw`, height: `${w * 0.22}cqw`, fontSize: `${w * 0.14}cqw` }}>{order + 1}</span>
                )}
              </>
            );
            const cls = `ep-brick relative grid place-items-center ${on ? 'is-on' : ''} ${motion}`;
            // key 帶上 fx 的序號：同一格連續答錯兩次，動畫才會重播
            const key = `${k}:${hit ? fx!.key : ''}`;
            return onTap ? (
              <button key={key} type="button" onClick={() => onTap(k)} aria-pressed={on}
                aria-label={`${LETTERS[k]} ${OP_GLYPH[b.op]}${b.n}`}
                className={`${cls} touch-manipulation outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#071a19]`} style={style}>
                {face}
              </button>
            ) : (
              <span key={key} aria-hidden="true" className={cls} style={style}>{face}</span>
            );
          })}
        </div>
      ))}
      </div>
    </div>
  );
}
