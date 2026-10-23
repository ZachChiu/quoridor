'use client';
import { memo, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { nextCursor } from '@/components/boardCursor';
import { CENTER, SIZE, colOf, pointAt, rowOf, type Move, type Point, type Side, type Stone } from '@/games/blind-gomoku/engine';
import { ColorFace, KEY_HEX, SideFace } from './Stone';
import { celebrate, dip, playIdle, stopIdle } from './idleMotion';

/**
 * 15×15 的棋盤。
 *
 * 版面跟 Bagh Chal 的棋盤同一個寫法：外層只管內距，正方形放在內層（aspect-square 不跟 padding 寫在一起，
 * iPhone 的 WebKit 會算歪）。每個交叉點佔一整格（棋盤寬 / 15）—— 交叉點在格子正中央，
 * 點哪裡就算最近的那個交叉點，手機上 390 寬也有約 24px 的命中範圍。
 *
 * 手指（touch、pen）分兩步：點一下瞄準（十字線＋半透明的子），再點同一點（或按「下子」）才落子 ——
 * 格子小、盲棋又不能悔棋，點歪一格的代價太大。滑鼠有 hover 預覽，點一下就下。鍵盤：方向鍵移動、Enter 下子。
 *
 * 子的翻面用 CSS 3D（兩面 backface-visibility: hidden），結算時依下子順序錯開翻；
 * 新子落下與電腦落子的發光用 Web Animations API（CLAUDE.md：不要每格用 JS 寫 style）。
 * 子落下時壓一下布、旁邊的子跟著滑一下；一般模式等待那一方的子會自己動（見 idleMotion.ts，盲棋沒有）。
 */
const pct = (cells: number) => `${(cells * 100) / SIZE}%`;
const STONE = 0.9;
const STAR_POINTS: [number, number][] = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
const FLIP_MS = 460;

/** 翻子時每顆之間錯開的時間：子越多越短，整段壓在兩秒內 */
const revealStagger = (n: number) => Math.min(45, 1500 / Math.max(1, n));
/** 整段翻子要多久（最後一顆開始翻的時間＋翻一顆的時間） */
export function revealMs(n: number): number {
  return n ? revealStagger(n) * (n - 1) + FLIP_MS : 0;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const at = (p: Point): CSSProperties => ({ left: pct(colOf(p) + 0.5), top: pct(rowOf(p) + 0.5) });
const FACE: CSSProperties = { position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };

function GridLines() {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full" aria-hidden="true">
      <g stroke="#2a2525" strokeOpacity={0.5} strokeWidth={0.04}>
        {Array.from({ length: SIZE }, (_, i) => (
          <g key={i}>
            <line x1={0.5} y1={i + 0.5} x2={SIZE - 0.5} y2={i + 0.5} />
            <line x1={i + 0.5} y1={0.5} x2={i + 0.5} y2={SIZE - 0.5} />
          </g>
        ))}
      </g>
      <rect x={0.5} y={0.5} width={SIZE - 1} height={SIZE - 1} fill="none" stroke="#2a2525" strokeWidth={0.07} />
      {STAR_POINTS.map(([r, c]) => <circle key={`${r}-${c}`} cx={c + 0.5} cy={r + 0.5} r={0.12} fill="#2a2525" />)}
    </svg>
  );
}

/**
 * 新落下的子：從手上（大一點、還沒落地）放下來，壓進白絲裡一點再彈回來 —— 布上的子，不是硬盤上的「喀」。
 * 只動 transform／opacity；壓布那一下旁邊的子跟著滑（idleMotion 的 dip，用 translate，不會跟這裡互相蓋掉）。
 */
const DROP: Keyframe[] = [
  { transform: 'scale(1.32)', opacity: 0 },
  { transform: 'scale(1)', opacity: 1, offset: 0.4, easing: 'ease-in' },
  { transform: 'scale(0.9)', offset: 0.6, easing: 'ease-out' },
  { transform: 'scale(1.03)', offset: 0.82 },
  { transform: 'scale(1)' },
];

/** 一顆子。掛載時落下（新落下的子）；盲棋時兩面，revealed 時翻到黑白那面 */
function StoneView({ p, stone, blind, revealed, delay }: { p: Point; stone: Stone; blind: boolean; revealed: boolean; delay: number }) {
  const popRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    popRef.current?.animate(reducedMotion() ? [{ opacity: 0 }, { opacity: 1 }] : DROP, { duration: reducedMotion() ? 150 : 340, easing: 'ease-out' });
  }, []);
  return (
    <div data-p={p} className="pointer-events-none absolute" style={{ ...at(p), width: pct(STONE), height: pct(STONE), transform: 'translate(-50%, -50%)', perspective: '320px' }}>
      <div ref={popRef} data-stone className="size-full">
        {blind ? (
          <div
            className="relative size-full ease-out motion-reduce:transition-none"
            style={{
              transformStyle: 'preserve-3d',
              transform: revealed ? 'rotateY(180deg)' : 'none',
              transitionProperty: 'transform',
              transitionDuration: `${FLIP_MS}ms`,
              transitionDelay: revealed ? `${delay}ms` : '0ms',
            }}
          >
            <div style={FACE}><ColorFace color={stone.color} /></div>
            <div style={{ ...FACE, transform: 'rotateY(180deg)' }}><SideFace side={stone.side} /></div>
          </div>
        ) : (
          <SideFace side={stone.side} />
        )}
      </div>
    </div>
  );
}

/** 所有的子。跟瞄準分開成一層、memo 起來 —— 滑鼠移動只改瞄準，不必重畫兩百多顆子 */
const StonesLayer = memo(function StonesLayer({ board, moves, blind, revealed }: {
  board: (Stone | null)[]; moves: Move[]; blind: boolean; revealed: boolean;
}) {
  const order = useMemo(() => new Map(moves.map((m, i) => [m.at, i])), [moves]);
  const stagger = revealStagger(moves.length);
  return (
    <>
      {board.map((stone, p) => stone && (
        <StoneView key={p} p={p} stone={stone} blind={blind} revealed={revealed} delay={(order.get(p) ?? 0) * stagger} />
      ))}
    </>
  );
});

/** 剛落下的子周圍亮一圈，約一秒後淡掉（盲棋看清楚電腦下在哪，又不會一直標著） */
function Glow({ p }: { p: Point }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const base = 'translate(-50%, -50%)';
    const frames: Keyframe[] = reducedMotion()
      ? [{ opacity: 1 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }]
      : [
        { opacity: 0, transform: `${base} scale(0.6)` },
        { opacity: 1, transform: `${base} scale(1)`, offset: 0.15 },
        { opacity: 1, transform: `${base} scale(1)`, offset: 0.7 },
        { opacity: 0, transform: `${base} scale(1.2)` },
      ];
    const anim = el.animate(frames, { duration: 1300, easing: 'ease-out', fill: 'forwards' });
    return () => anim.cancel();
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute rounded-full border-[3px] border-tile-ink opacity-0"
      style={{ ...at(p), width: pct(1.45), height: pct(1.45), transform: 'translate(-50%, -50%)' }} />
  );
}

/** 連成五子的那一排：一條主色的線淡入 */
function WinLine({ line }: { line: Point[] }) {
  const ref = useRef<SVGLineElement>(null);
  useEffect(() => {
    ref.current?.animate([{ opacity: 0 }, { opacity: 0.9 }], { duration: reducedMotion() ? 0 : 450, easing: 'ease-out', fill: 'forwards' });
  }, []);
  const a = line[0];
  const b = line[line.length - 1];
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <line ref={ref} x1={colOf(a) + 0.5} y1={rowOf(a) + 0.5} x2={colOf(b) + 0.5} y2={rowOf(b) + 0.5}
        stroke={KEY_HEX} strokeWidth={0.26} strokeLinecap="round" opacity={0} />
    </svg>
  );
}

type Props = {
  board: (Stone | null)[];
  moves: Move[];
  /** 盲棋：畫顏色＋形狀；一般模式畫黑白 */
  blind: boolean;
  /** 盲棋結算：全部翻到黑白 */
  revealed: boolean;
  aim: Point | null;
  /** 瞄準點上要畫的半透明子 */
  ghost: ReactNode;
  /** 最後一手亮一下（盲棋） */
  glow: boolean;
  /** 最後一手一直標一個小點（一般模式） */
  lastMark: boolean;
  /** 連成的那一排（結算動畫跑完才給） */
  line: Point[] | null;
  /** 閒置時會自己動的那一方（等待的一方）。盲棋與結束後是 null —— 只動一方等於告訴你哪些子是誰的 */
  idle: Side | null;
  interactive: boolean;
  label: string;
  /** 讀屏用：某一點現在是什麼 */
  describe: (p: Point) => string;
  onAim: (p: Point | null) => void;
  onPlace: (p: Point) => void;
};

export function GomokuBoard({ board, moves, blind, revealed, aim, ghost, glow, lastMark, line, idle, interactive, label, describe, onAim, onPlace }: Props) {
  const squareRef = useRef<HTMLDivElement>(null);

  // 剛好多一手：壓一下布，旁邊兩圈的子往新子滑一點（不分黑白；悔棋、重來不算）
  const placed = useRef(moves.length);
  useEffect(() => {
    const prev = placed.current;
    placed.current = moves.length;
    const root = squareRef.current;
    if (moves.length !== prev + 1 || !root || reducedMotion()) return;
    dip(root, board, moves[moves.length - 1].at);
  }, [moves, board]);

  // 閒置：每 2.5–5.5 秒挑一顆等待那一方的子動一下。換手（board 變了）就把還在播的停掉
  useEffect(() => {
    const root = squareRef.current;
    if (!idle || !root || reducedMotion()) return;
    let id = 0;
    const tick = () => { id = window.setTimeout(() => { playIdle(root, board, idle); tick(); }, 2500 + Math.random() * 3000); };
    tick();
    return () => { window.clearTimeout(id); stopIdle(root); };
  }, [idle, board]);

  // 連成五子：連線淡入之後，那一排依序跳一下
  useEffect(() => {
    const root = squareRef.current;
    if (!line || !root || reducedMotion()) return;
    const id = window.setTimeout(() => celebrate(root, line), 260);
    return () => window.clearTimeout(id);
  }, [line]);
  // 手指按下時的狀態：按在哪一點、按之前是不是已經瞄準那一點、中間有沒有滑到別點
  const pressRef = useRef<{ p: Point; armed: boolean; moved: boolean; mouse: boolean } | null>(null);
  const last = moves.length ? moves[moves.length - 1].at : null;

  const pointFrom = (e: React.PointerEvent): Point | null => {
    const rect = squareRef.current?.getBoundingClientRect();
    if (!rect || !rect.width) return null;
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE);
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE ? pointAt(r, c) : null;
  };
  const empty = (p: Point | null): p is Point => p !== null && !board[p];

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = pointFrom(e);
    if (!empty(p)) return;
    const mouse = e.pointerType === 'mouse';
    pressRef.current = { p, armed: mouse || aim === p, moved: false, mouse };
    if (!mouse) {
      onAim(p);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!interactive) return;
    const press = pressRef.current;
    const p = pointFrom(e);
    if (e.pointerType === 'mouse') {
      if (!press) onAim(empty(p) ? p : null);
      return;
    }
    // 手指按著滑動：瞄準跟著走（手指蓋住的那一點靠十字線看）
    if (press && empty(p) && p !== press.p) {
      press.p = p;
      press.moved = true;
      onAim(p);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press || !interactive) return;
    if (press.armed && !press.moved && pointFrom(e) === press.p) onPlace(press.p);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive) return;
    const cur = aim ?? CENTER;
    const next = nextCursor({ row: rowOf(cur), col: colOf(cur) }, e.key, { size: SIZE, ctrl: e.ctrlKey || e.metaKey });
    if (next) {
      e.preventDefault();
      onAim(pointAt(next.row, next.col));
    } else if ((e.key === 'Enter' || e.key === ' ') && empty(aim)) {
      e.preventDefault();
      onPlace(aim);
    }
  };

  return (
    // 棋盤是一塊淺一階的白絲（包袱巾裡的白絲），線是黑絲色；不另外加框
    <div className="w-full rounded-md bg-[#f2e4c9] p-[2.5%]">
      <div
        ref={squareRef}
        role="application"
        aria-label={label}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { pressRef.current = null; }}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse' && interactive) onAim(null); }}
        onKeyDown={onKeyDown}
        className={`relative aspect-square w-full touch-none select-none rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-tile-ink/40 ${interactive ? 'cursor-pointer' : ''}`}
      >
        <GridLines />
        {aim !== null && (
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
            <g stroke={KEY_HEX} strokeWidth={0.08} strokeLinecap="round">
              <line x1={0.5} y1={rowOf(aim) + 0.5} x2={SIZE - 0.5} y2={rowOf(aim) + 0.5} />
              <line x1={colOf(aim) + 0.5} y1={0.5} x2={colOf(aim) + 0.5} y2={SIZE - 0.5} />
            </g>
          </svg>
        )}
        <StonesLayer board={board} moves={moves} blind={blind} revealed={revealed} />
        {aim !== null && !board[aim] && (
          <div className="pointer-events-none absolute opacity-60" style={{ ...at(aim), width: pct(STONE), height: pct(STONE), transform: 'translate(-50%, -50%)' }}>
            {ghost}
          </div>
        )}
        {glow && last !== null && <Glow key={moves.length} p={last} />}
        {lastMark && last !== null && (
          <div aria-hidden="true" className="pointer-events-none absolute rounded-full"
            style={{ ...at(last), width: pct(0.26), height: pct(0.26), transform: 'translate(-50%, -50%)', background: KEY_HEX }} />
        )}
        {line && <WinLine line={line} />}
        {/* 讀屏：瞄準的那一點是什麼 */}
        <p className="sr-only" aria-live="polite">{aim !== null ? describe(aim) : ''}</p>
      </div>
    </div>
  );
}

/** 瞄準點上的半透明子 */
export function Ghost({ blind, color, side }: { blind: boolean; color: Stone['color']; side: Stone['side'] }) {
  return blind ? <ColorFace color={color} /> : <SideFace side={side} />;
}
