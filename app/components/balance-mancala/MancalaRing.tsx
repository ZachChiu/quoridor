'use client';
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { GiAngelWings, GiImpLaugh } from 'react-icons/gi';
import { CELLS, ANGEL, DEVIL, CELL_COLOUR, type Colour, type Seat } from '@/games/balance-mancala/engine';
import { BRASS, CLOTH_LIGHT, DISH_BG, INK, WOOD } from './palette';
import PieceDisc from './PieceDisc';
import { playIdle } from './idleMotion';

/**
 * 環形盤：14 格繞一圈，0（惡魔）在頂端、7（天使）在底端，順時針編號 —— 跟節目的盤面同一個方向。
 *
 * 尺寸全部用 cqw（盤面本身是 inline-size container）：手機 340px 與桌機 600px 是同一張圖等比縮放，
 * 不必分兩套數字。格子中心在半徑 37%、直徑 15%，外側印顏色短標（色盲也分得出三色）、內側印子數。
 *
 * 同一格裡 4 顆以內一顆一顆畫；超過就依主人合併成一顆、右上角標數量（同一個人的子沒有差別，合併不丟資訊）。
 *
 * 盤面是一塊圓的木頭（外層 MancalaPlay 畫），軌道線、箭頭、盤子的外緣是嵌在木頭上的黃銅；字是亮布色。
 *
 * 動作（Zach 10/24：學 Wall Go 補上棋子的互動，但要是這款自己的樣子）—— 全部 WAAPI／CSS、只動 transform 與 opacity：
 * - 播種：手伸進起點那一格撈起來（scoop，那格往下一沉），種子一顆一顆從上一格跳到下一格（flight，飛的時候放大一點 ＝ 被拿起來），
 *   落地後坑裡才出現真的那顆（.mcl-land）；最後一顆落定時得分的那一格像秤盤一樣被壓下去再彈回來（weigh），得分標記跟著跳出來
 * - 閒置：沒輪到的座位的子在坑裡滾、晃、往下一格探頭、跟同坑的子擠一擠（idleMotion.ts）
 */
const R = 37;
const D = 15;
const rad = (i: number) => ((-90 + (i * 360) / CELLS) * Math.PI) / 180;
/**
 * 座標寫成字串前先取到小數三位：Math.cos／sin 在 Node 與各家瀏覽器差在最後一位（實測 21.0722351486829 vs 21.072235148682896），
 * 規則頁的圓盤是伺服器先畫好的，不取整的話每一格都對不上（hydration mismatch）。千分之一個百分比在畫面上看不出來。
 */
const fx = (v: number) => v.toFixed(3);
const pos = (i: number, r: number) => ({ left: `${fx(50 + r * Math.cos(rad(i)))}%`, top: `${fx(50 + r * Math.sin(rad(i)))}%` });

/** 種子落地的那一刻（飛行時間的 85%）：坑裡真的那顆、得分標記、秤盤下沉、音效都對著這一刻 */
export const LAND = 0.85;
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** 只停掉 WAAPI 的動畫（閒置動作），CSS 的落地動畫留著 */
const stopScripted = (root: HTMLElement) => root.querySelectorAll('[data-seat]').forEach((el) => {
  el.getAnimations().forEach((a) => { if (!('animationName' in a)) a.cancel(); });
});

/** 盤面上的得分標記：誰、+幾分、記到哪一色（還沒選色時 colour 是 null） */
export type RingMark = { cell: number; owner: Seat; points: number; colour: Colour | null; faded?: boolean };

/** 坑裡最新那顆子的進場：pop＝開局放子（從上面落下）、land＝播種時飛過來落地（延遲 delay 毫秒，等飛行的那顆到） */
type Drop = { kind: 'pop' | 'land'; key: number; delay: number } | null;

function CellPieces({ owners, incoming, drop }: { owners: Seat[]; incoming: boolean; drop: Drop }) {
  const n = owners.length;
  if (!n) return null;
  const newest = n - 1;
  const enter = (fresh: boolean): { className: string; style?: CSSProperties } => !drop ? { className: '' }
    : drop.kind === 'pop' ? { className: 'animate-piece-drop' }
    : { className: fresh ? 'mcl-land' : 'mcl-receive', style: { '--mcl-delay': `${drop.delay}ms` } as CSSProperties };
  if (n <= 4) {
    const size = n === 1 ? 8 : n === 2 ? 6.2 : 5.5;
    const items = owners.map((seat, i) => ({ seat, i })).sort((a, b) => a.seat - b.seat || a.i - b.i);
    return (
      <span className="relative flex flex-wrap items-center justify-center" style={{ width: n === 1 ? undefined : `${size * 2 + 0.9}cqw`, gap: '0.9cqw' }}>
        {items.map(({ seat, i }) => {
          const fx = drop && i === newest ? enter(true) : null;
          return (
            <PieceDisc key={fx ? `${i}-${drop!.key}` : i} seat={seat} size={`${size}cqw`} onBoard
              ring={incoming && i === newest ? 'incoming' : undefined}
              className={fx?.className ?? ''} style={fx?.style} />
          );
        })}
      </span>
    );
  }
  const groups = new Map<Seat, number>();
  for (const s of owners) groups.set(s, (groups.get(s) ?? 0) + 1);
  const list = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  const g = list.length;
  const size = g === 1 ? 7.5 : g <= 4 ? 5.5 : 4;
  const cols = g === 1 ? 1 : g <= 4 ? 2 : 3;
  const newOwner = owners[newest];
  return (
    <span className="relative flex flex-wrap items-center justify-center" style={{ width: `${size * cols + 1.1 * (cols - 1)}cqw`, gap: '1.1cqw' }}>
      {list.map(([seat, count]) => {
        // 合成一顆的：同一個人原本就有子在這格時只彈一下，不要整顆消失再出現
        const fx = drop && seat === newOwner ? enter(count === 1) : null;
        return (
          <PieceDisc key={fx ? `${seat}-${drop!.key}` : seat} seat={seat} size={`${size}cqw`} count={count} onBoard
            ring={incoming && seat === newOwner ? 'incoming' : undefined}
            className={fx?.className ?? ''} style={fx?.style} />
        );
      })}
    </span>
  );
}

export default function MancalaRing({
  board, colourShort, highLabel, lowLabel, ariaOf, selectable, dimOthers, selected, incoming, emptied, dropped, dropKey = 0, mark, onPick, center,
  flight = null, hopMs = 0, scoop = null, weigh = null, markDelay = 0, idleActor = null,
}: {
  board: Seat[][];
  colourShort: string[];
  highLabel: string;
  lowLabel: string;
  /** 每一格的讀屏文字 */
  ariaOf: (cell: number) => string;
  /** 現在可以點的格子（外圈米白框）；null 表示不在選格 */
  selectable: Set<number> | null;
  /** 把不能點的格子調暗（選起點時）。預覽時不調暗 —— 落點常常不是自己的格子，暗掉就看不到剛放進去的子 */
  dimOthers: boolean;
  selected: number | null;
  /** 預覽中：這些格最後一顆是剛放進來的 */
  incoming?: Set<number>;
  /** 預覽／播種中被拿空的起點格 */
  emptied?: number | null;
  /** 播種動畫：剛落下一顆的格子 */
  dropped?: number | null;
  dropKey?: number;
  mark?: RingMark | null;
  onPick: (cell: number) => void;
  center?: ReactNode;
  /** 播種：正在飛的那顆種子（從哪一格跳到哪一格、誰的），dropKey 每顆換一次 */
  flight?: { from: number; to: number; seat: Seat } | null;
  /** 跳一格要多久（毫秒）。0＝不飛（減少動態效果，或不是在播種） */
  hopMs?: number;
  /** 播種剛開始：被撈空的那一格 */
  scoop?: number | null;
  /** 最後一顆落定：得分的那一格（被壓下去再彈回來） */
  weigh?: number | null;
  /** 得分標記晚多久出現（等最後一顆飛到） */
  markDelay?: number;
  /** 閒置動作：輪到的座位（他的子不動）；null＝整個停掉（播種、排序預覽、結束） */
  idleActor?: Seat | null;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<HTMLSpanElement>(null);
  const land = Math.round(hopMs * LAND);

  // 飛：從上一格的中心跳到這一格的中心，中途放大（被拿在手上），最後一點點淡掉、換坑裡真的那顆接手
  useLayoutEffect(() => {
    const el = flyRef.current, root = rootRef.current;
    if (!flight || !hopMs || !el || !root) return;
    const w = root.clientWidth / 100;
    const a = rad(flight.from), b = rad(flight.to);
    const dx = R * (Math.cos(a) - Math.cos(b)) * w, dy = R * (Math.sin(a) - Math.sin(b)) * w;
    el.animate([
      { translate: `${dx}px ${dy}px`, scale: '0.85', opacity: 1 },
      { translate: `${dx / 2}px ${dy / 2}px`, scale: '1.4', opacity: 1, offset: 0.5 },
      { translate: '0px 0px', scale: '1', opacity: 1, offset: 0.9 },
      { translate: '0px 0px', scale: '1', opacity: 0 },
    ], { duration: hopMs, easing: 'cubic-bezier(.4,.1,.5,1)' });
  }, [flight, hopMs]);

  const cellEl = (cell: number) => rootRef.current?.querySelector<HTMLElement>(`[data-cell="${cell}"]`);
  // 撈：手伸進去，那一格往下一沉再浮回來
  useEffect(() => {
    if (scoop === null || !hopMs) return;
    cellEl(scoop)?.animate([{ scale: '1' }, { scale: '0.86', offset: 0.4 }, { scale: '1.04', offset: 0.75 }, { scale: '1' }], { duration: 280, easing: 'ease-out' });
  }, [scoop, hopMs]);
  // 秤：最後一顆落定，得分的那一格像放上砝碼的秤盤，被壓下去、晃一下回來
  useEffect(() => {
    if (weigh === null || reducedMotion()) return;
    cellEl(weigh)?.animate([
      { scale: '1' }, { scale: '0.88', offset: 0.3 }, { scale: '1.05', offset: 0.6 }, { scale: '0.98', offset: 0.8 }, { scale: '1' },
    ], { duration: 520, delay: land, easing: 'ease-out' });
  }, [weigh, land]);

  // 閒置：每 2.4–5.2 秒挑一顆沒輪到的子動一下。停掉時（輪到的人選了格子、開始播種）把還在播的收掉
  useEffect(() => {
    const root = rootRef.current;
    if (idleActor === null || !root || reducedMotion()) return;
    let id = 0;
    const tick = () => { id = window.setTimeout(() => { playIdle(root, idleActor); tick(); }, 2400 + Math.random() * 2800); };
    tick();
    return () => { window.clearTimeout(id); stopScripted(root); };
  }, [idleActor, board]);

  return (
    <div ref={rootRef} className="relative aspect-square w-full select-none [container-type:inline-size]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx={50} cy={50} r={R} fill="none" stroke={BRASS} strokeOpacity={0.45} strokeWidth={0.35} />
        {/* 格與格之間的小箭頭：順時針 */}
        {Array.from({ length: CELLS }, (_, i) => {
          const a = rad(i + 0.5);
          const deg = -90 + ((i + 0.5) * 360) / CELLS + 90;
          return (
            <path key={i} d="M -0.55 -0.75 L 0.45 0 L -0.55 0.75" fill="none" stroke={BRASS} strokeWidth={0.42}
              strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.85}
              transform={`translate(${fx(50 + R * Math.cos(a))} ${fx(50 + R * Math.sin(a))}) rotate(${fx(deg)})`} />
          );
        })}
      </svg>

      {center && (
        <div className="absolute inset-[27%] flex flex-col items-center justify-center text-center" style={{ color: CLOTH_LIGHT }}>
          {center}
        </div>
      )}

      {board.map((owners, cell) => {
        const colour = CELL_COLOUR[cell];
        // 惡魔格是印花的墨（比木頭更深）、天使格是亮布色；兩格都靠黃銅外緣跟木頭分開
        const bg = colour !== null ? DISH_BG[colour] : cell === DEVIL ? INK : CLOTH_LIGHT;
        const canPick = selectable?.has(cell) ?? false;
        const dim = dimOthers && selectable !== null && !canPick && selected !== cell;
        const isSel = selected === cell;
        const outline = isSel ? `0.8cqw solid ${BRASS}` : canPick ? `0.5cqw solid ${CLOTH_LIGHT}` : emptied === cell ? `0.4cqw dashed ${CLOTH_LIGHT}` : 'none';
        const showMark = mark && mark.cell === cell;
        return (
          <div key={cell}>
            <button
              type="button"
              data-cell={cell}
              onClick={() => onPick(cell)}
              aria-label={ariaOf(cell)}
              aria-pressed={isSel || undefined}
              className="absolute grid place-items-center rounded-full transition-[opacity,transform] duration-200"
              style={{
                ...pos(cell, R),
                width: `${D}cqw`, height: `${D}cqw`,
                transform: `translate(-50%, -50%)${isSel ? ' scale(1.07)' : ''}`,
                background: bg,
                boxShadow: `inset 0 0 0 0.45cqw ${BRASS}`,
                outline, outlineOffset: '0.5cqw',
              }}
            >
              {cell === DEVIL && <GiImpLaugh aria-hidden="true" className="absolute size-[62%]" style={{ color: BRASS, opacity: owners.length ? 0.35 : 0.9 }} />}
              {cell === ANGEL && <GiAngelWings aria-hidden="true" className="absolute size-[66%]" style={{ color: WOOD, opacity: owners.length ? 0.18 : 0.55 }} />}
              <CellPieces owners={owners} incoming={!!incoming?.has(cell)}
                drop={dropped === cell ? { kind: flight && hopMs ? 'land' : 'pop', key: dropKey, delay: land } : null} />
              {/* 不能選的格子蓋一層木頭色調暗。不用 opacity：半透明的格子會透出底下那圈軌道線 */}
              {dim && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full" style={{ background: WOOD, opacity: 0.6 }} />}
            </button>

            {/* 外側：顏色短標；惡魔、天使寫記到哪一色 */}
            <span aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-black leading-none"
              style={{ ...pos(cell, R + D / 2 + 3.4), fontSize: '2.7cqw', color: colour !== null ? CLOTH_LIGHT : BRASS, opacity: colour !== null ? 0.8 : 1 }}>
              {colour !== null ? colourShort[colour] : cell === DEVIL ? highLabel : lowLabel}
            </span>

            {/* 內側：子數（得分標記出現時讓位） */}
            {!showMark && owners.length > 0 && (
              <span aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-black leading-none"
                style={{ ...pos(cell, R - D / 2 - 3), fontSize: '2.8cqw', color: CLOTH_LIGHT, opacity: 0.7 }}>
                {owners.length}
              </span>
            )}

            {showMark && (
              <span aria-hidden="true"
                className={`pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full font-black leading-none ${mark.faded ? '' : 'animate-piece-drop'}`}
                style={{ ...pos(cell, R - D / 2 - 6.2), gap: '0.7cqw', padding: '0.6cqw 1.2cqw 0.6cqw 0.6cqw', fontSize: '3.2cqw', background: CLOTH_LIGHT, color: INK, opacity: mark.faded ? 0.8 : 1, animationDelay: mark.faded ? undefined : `${markDelay}ms` }}>
                <PieceDisc seat={mark.owner} size="3.8cqw" />
                +{mark.points}
                {mark.colour !== null && (
                  <span className="rounded-full leading-none" style={{ padding: '0.5cqw 1cqw', fontSize: '2.6cqw', background: DISH_BG[mark.colour], color: CLOTH_LIGHT }}>
                    {colourShort[mark.colour]}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      })}
      {/* 飛在半空中的那顆種子（平常是透明的，只在動畫裡看得到） */}
      {flight && hopMs > 0 && (
        <span ref={flyRef} key={dropKey} aria-hidden="true" className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ ...pos(flight.to, R), opacity: 0 }}>
          <PieceDisc seat={flight.seat} size="6.2cqw" />
        </span>
      )}
    </div>
  );
}
