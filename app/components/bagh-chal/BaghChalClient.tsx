'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GiGoat, GiTigerHead, GiTabletopPlayers } from 'react-icons/gi';
import { LuHouse, LuRotateCcw, LuUndo2 } from 'react-icons/lu';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import PlatformCorner from '@/components/PlatformCorner';
import { useMessages } from '@/i18n/LocaleProvider';
import { localePath, type Locale } from '@/i18n/locales';
import {
  createGame, legalMoves, applyMove, undo, GOATS, SIZE,
  type BaghState, type Move, type Point, type Side,
} from '@/games/bagh-chal/engine';
import { chooseMove, type Difficulty } from '@/games/bagh-chal/ai';

/**
 * Bagh Chal 的整個遊戲畫面：開局選模式 → 對局 → 結算。
 *
 * 視覺沿用 Wall Go 的平塗撞色（奶油底、實色磁磚、900 字重、實心剪影），
 * 識別色是陶橘（老虎）＋深墨（羊）。規則全部在 app/games/bagh-chal/，這裡只管畫面。
 *
 * 平台 logo 只在開局畫面出現；對局中不放（Zach：子遊戲的遊戲頁面內不要有）。
 */
type Mode = { kind: 'local' } | { kind: 'ai'; human: Side; difficulty: Difficulty };

const fmt = (s: string, n: number) => s.replace('{n}', String(n));
const xy = (p: Point) => ({ x: 10 + (p % SIZE) * 20, y: 10 + Math.floor(p / SIZE) * 20 });

export default function BaghChalClient({ locale }: { locale: Locale }) {
  const t = useMessages();
  const b = t.baghChal;
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [game, setGame] = useState<BaghState>(createGame);
  const [selected, setSelected] = useState<Point | null>(null);

  const aiSide: Side | null = mode?.kind === 'ai' ? (mode.human === 'tiger' ? 'goat' : 'tiger') : null;
  const aiTurn = !!aiSide && !game.winner && game.turn === aiSide;
  const legal = useMemo(() => (aiTurn ? [] : legalMoves(game)), [game, aiTurn]);

  // 電腦的回合：讓出一格畫面再算（搜尋在主執行緒，幾十毫秒），看起來也像在想
  useEffect(() => {
    if (!aiTurn || mode?.kind !== 'ai') return;
    const id = window.setTimeout(() => {
      setGame((g) => {
        const m = chooseMove(g, mode.difficulty);
        return m ? applyMove(g, m) : g;
      });
    }, 450);
    return () => window.clearTimeout(id);
  }, [aiTurn, mode, game]);

  const start = (m: Mode) => { setMode(m); setGame(createGame()); setSelected(null); };

  if (!mode) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-16">
        <PlatformCorner locale={locale} />
        <header className="text-center">
          <h1 className="text-[clamp(2.75rem,9vw,4.5rem)] font-black leading-[0.95] tracking-tight">
            {b.title}<br /><span className="text-[0.6em]">{b.subtitle}</span>
          </h1>
          <p className="mt-3 text-sm font-bold text-ink-soft md:text-base">{b.tagline}</p>
        </header>
        <div className="mt-8 grid w-full max-w-[420px] grid-cols-2 gap-3">
          <ModeTile tone="bg-tile-orange text-tile-ink" icon={GiTigerHead} iconFill="rgb(var(--tile-ink))" kicker={b.vsAi} label={b.tiger}
            onClick={() => start({ kind: 'ai', human: 'tiger', difficulty })} />
          <ModeTile tone="bg-tile-ink text-tile-cream" icon={GiGoat} iconFill="rgb(var(--tile-orange))" kicker={b.vsAi} label={b.goat}
            onClick={() => start({ kind: 'ai', human: 'goat', difficulty })} />
          <ModeTile wide tone="bg-tile-amber text-tile-ink" icon={GiTabletopPlayers} iconFill="rgb(var(--tile-blue))" label={b.local}
            onClick={() => start({ kind: 'local' })} />
        </div>
        <div className="mt-5 flex w-full max-w-[420px] flex-col gap-2">
          <p className="text-sm font-bold text-ink-soft">{b.level}</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={b.level}>
            {(['easy', 'normal', 'hard'] as const).map((d, i) => (
              <button key={d} type="button" role="radio" aria-checked={difficulty === d} onClick={() => setDifficulty(d)}
                className={`rounded-xl py-3 text-sm font-black transition ${difficulty === d ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}>
                {[t.solo.level1, t.solo.level2, t.solo.level3][i]}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const human = mode.kind === 'ai' ? mode.human : game.turn;
  const pick = (p: Point) => {
    if (aiTurn || game.winner) return;
    if (game.turn === 'goat' && game.goatsInHand > 0) {
      const m = legal.find((x) => x.kind === 'place' && x.to === p);
      if (m) setGame(applyMove(game, m));
      return;
    }
    const own = game.turn === 'tiger' ? 'T' : 'G';
    if (game.board[p] === own) { setSelected(selected === p ? null : p); return; }
    if (selected !== null) {
      const m = legal.find((x) => x.kind !== 'place' && x.from === selected && x.to === p);
      if (m) { setGame(applyMove(game, m)); setSelected(null); }
    }
  };
  const targets = new Map<Point, Move>();
  for (const m of legal) {
    if (m.kind === 'place') { if (game.turn === 'goat') targets.set(m.to, m); }
    else if (m.from === selected) targets.set(m.to, m);
  }
  const movable = new Set(legal.flatMap((m) => (m.kind === 'place' ? [] : [m.from])));
  const last = game.history[game.history.length - 1];
  const undoSteps = mode.kind === 'ai' ? (game.turn === mode.human ? 2 : 1) : 1;
  // 跟電腦下時退到「又輪到你」：電腦已經回了就退兩手。電腦先手（你當老虎）的第一手不能退
  const canUndo = !aiTurn && game.history.length >= undoSteps;

  const status = game.winner ? '' : aiTurn ? b.thinking : mode.kind === 'ai' ? b.yourTurn : game.turn === 'tiger' ? b.turnTiger : b.turnGoat;
  const result = game.winner === 'tiger' ? { title: b.winTiger, body: b.winTigerBody, band: 'bg-tile-orange', fg: 'text-tile-ink' }
    : game.winner === 'goat' ? { title: b.winGoat, body: b.winGoatBody, band: 'bg-tile-ink', fg: 'text-tile-cream' }
    : { title: b.draw, body: b.drawBody, band: 'bg-tile-ink', fg: 'text-tile-cream' };

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pb-10 pt-4">
      <div className="flex w-full max-w-[520px] items-center justify-between">
        <button type="button" onClick={() => setMode(null)} aria-label={b.menu}
          className="grid size-11 place-items-center rounded-full bg-tile-ink/[0.07] text-xl text-ink-soft transition hover:bg-tile-ink/[0.12]">
          <LuHouse aria-hidden="true" />
        </button>
        <h1 className="text-xl font-black">{b.title}</h1>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => { setGame(undo(game, undoSteps)); setSelected(null); }} disabled={!canUndo} aria-label={b.undo}
            className="grid size-11 place-items-center rounded-full bg-tile-ink/[0.07] text-xl text-ink-soft transition hover:bg-tile-ink/[0.12] disabled:opacity-35">
            <LuUndo2 aria-hidden="true" />
          </button>
          <button type="button" onClick={() => start(mode)} aria-label={b.restart}
            className="grid size-11 place-items-center rounded-full bg-tile-ink/[0.07] text-xl text-ink-soft transition hover:bg-tile-ink/[0.12]">
            <LuRotateCcw aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* 狀態列：輪到誰、羊還剩幾隻要放、老虎吃了幾隻 */}
      <div className="mt-4 grid w-full max-w-[520px] grid-cols-2 gap-3">
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${game.turn === 'tiger' && !game.winner ? 'bg-tile-orange text-tile-ink' : 'bg-tile-ink/[0.07] text-ink-soft'}`}>
          <GiTigerHead aria-hidden="true" className="shrink-0 text-3xl" />
          <div className="min-w-0">
            <p className="text-xs font-bold">{b.tiger}</p>
            <p className="font-black">{fmt(b.captured, game.captured)}</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${game.turn === 'goat' && !game.winner ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}>
          <GiGoat aria-hidden="true" className="shrink-0 text-3xl" />
          <div className="min-w-0">
            <p className="text-xs font-bold">{b.goat}</p>
            {/* 「還有 14 隻羊要放」在手機上放不下一行：字小一級、可以換行，不截斷 */}
            <p className="text-sm font-black leading-tight">{game.goatsInHand > 0 ? fmt(b.goatsInHand, game.goatsInHand) : `${GOATS - game.captured} / ${GOATS}`}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 h-6 text-sm font-black text-ink-soft" aria-live="polite">{status}</p>

      {/* 棋盤：線用 SVG 畫，交叉點是按鈕（鍵盤與讀屏都點得到） */}
      <div className="relative mt-2 aspect-square w-full max-w-[520px] rounded-3xl bg-primary-50 p-[4%]">
        <div className="relative size-full">
          <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
            <g stroke="rgb(var(--board-line))" strokeWidth="0.9" strokeLinecap="round">
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line x1={10} y1={10 + i * 20} x2={90} y2={10 + i * 20} />
                  <line x1={10 + i * 20} y1={10} x2={10 + i * 20} y2={90} />
                </g>
              ))}
              <line x1={10} y1={10} x2={90} y2={90} />
              <line x1={90} y1={10} x2={10} y2={90} />
              <polygon points="50,10 90,50 50,90 10,50" fill="none" />
            </g>
          </svg>
          {game.board.map((cell, p) => {
            const { x, y } = xy(p);
            const target = targets.get(p);
            const isSel = selected === p;
            const wasLast = last && (last.to === p || (last.kind !== 'place' && last.from === p));
            const label = cell === 'T' ? b.tiger : cell === 'G' ? b.goat : `${Math.floor(p / SIZE) + 1}-${(p % SIZE) + 1}`;
            return (
              <button
                key={p}
                type="button"
                onClick={() => pick(p)}
                aria-label={label}
                aria-pressed={isSel || undefined}
                className="absolute grid size-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                {cell === 'T' && (
                  <span className={`grid size-[86%] place-items-center rounded-full bg-tile-orange text-tile-ink transition ${isSel ? 'scale-110 ring-4 ring-tile-ink' : ''} ${!isSel && movable.has(p) ? 'ring-2 ring-tile-ink/25' : ''}`}>
                    <GiTigerHead aria-hidden="true" className="size-[64%]" />
                  </span>
                )}
                {cell === 'G' && (
                  <span className={`grid size-[74%] place-items-center rounded-full bg-tile-ink text-tile-cream transition ${isSel ? 'scale-110 ring-4 ring-tile-orange' : ''} ${!isSel && movable.has(p) ? 'ring-2 ring-tile-orange/50' : ''}`}>
                    <GiGoat aria-hidden="true" className="size-[66%]" />
                  </span>
                )}
                {!cell && target && (
                  <span className={`rounded-full ${target.kind === 'jump' ? 'size-[46%] bg-tile-orange/80' : 'size-[28%] bg-tile-ink/30'}`} />
                )}
                {!cell && !target && wasLast && <span className="size-[22%] rounded-full bg-tile-ink/15" />}
              </button>
            );
          })}
        </div>
      </div>

      {mode.kind === 'ai' && (
        <p className="mt-3 text-xs font-bold text-ink-soft">{b.playAs}：{human === 'tiger' ? b.tiger : b.goat}</p>
      )}

      <Modal
        isOpen={!!game.winner}
        onClose={() => start(mode)}
        title={result.title}
        icon={game.winner === 'goat' ? GiGoat : GiTigerHead}
        band={{ className: result.band, fg: result.fg }}
        footer={
          <>
            <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={() => setMode(null)}>{b.menu}</Button>
            <Button color="bg-tile-ink text-tile-cream" handleClickEvent={() => start(mode)}>{b.again}</Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">{result.body}</p>
      </Modal>

      <Link href={localePath(locale, '/')} className="sr-only">{t.crumb.home}</Link>
    </div>
  );
}

function ModeTile({ tone, icon: Icon, iconFill, kicker, label, wide, onClick }: {
  tone: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties; 'aria-hidden'?: boolean }>;
  iconFill: string; kicker?: string; label: string; wide?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`${tone} ${wide ? 'col-span-2 flex-row gap-3 py-4' : 'aspect-square flex-col gap-2'} flex items-center justify-center rounded-2xl p-3 transition hover:brightness-95 active:scale-[0.97]`}>
      <Icon aria-hidden className={wide ? 'shrink-0 text-4xl' : 'text-7xl'} style={{ color: iconFill }} />
      <span className={wide ? 'text-lg font-black' : 'flex flex-col items-center'}>
        {!wide && kicker && <span className="text-xs font-bold opacity-75">{kicker}</span>}
        <span className={wide ? '' : 'text-lg font-black leading-tight'}>{label}</span>
      </span>
    </button>
  );
}
