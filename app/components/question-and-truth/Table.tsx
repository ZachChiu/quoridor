'use client';
import type { ReactNode } from 'react';
import { LuCircleHelp, LuHouse, LuNotebookPen, LuVolume2, LuVolumeX } from 'react-icons/lu';
import { useSound } from '@/hook/useSound';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill } from '@/i18n/gameText';
import { HAND_SIZE, type Card } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import { summary, type Notes } from './notes';
import PlayingCard from './PlayingCard';
import QtFrame from './QtFrame';
import { rankLabel } from '@/games/question-and-truth/engine';

export const roundBtn = 'qt-btn is-quiet grid size-11 shrink-0 place-items-center text-xl';

/**
 * 對局頁的骨架（節目版與挑戰共用）：
 * - 手機：上面一排（回選單、狀態、聲音、說明），下面一塊橄欖綠桌布（對方的 8 張牌背、中間的操作、自己那排），再下面是問答紀錄。
 *   筆記在彈窗裡（點對方的牌、或筆記鈕）。
 * - 桌機（lg）：三欄 —— 左邊一直攤著筆記、中間桌布、右邊問答紀錄，整塊撐滿畫面高度（大話骰桌機東西太小、散在大片底色上被點名過）。
 */
export function PlayShell({ t, status, onHome, onHelp, onNotes, notes, log, children }: {
  t: QtText; status: ReactNode; onHome: () => void; onHelp: () => void; onNotes?: () => void;
  notes?: ReactNode; log: ReactNode; children: ReactNode;
}) {
  const g0 = useGameText();
  const { prefs, setPrefs } = useSound();
  return (
    <QtFrame className="items-center px-3 pb-4 pt-3 lg:px-8 lg:pb-6">
      <div className="flex w-full max-w-[480px] items-center gap-2 lg:max-w-[1340px]">
        <button type="button" onClick={onHome} aria-label={t.home} className={roundBtn}><LuHouse aria-hidden="true" /></button>
        <div className="min-w-0 flex-1 text-center text-xs font-black leading-snug lg:text-sm">{status}</div>
        {onNotes && <button type="button" onClick={onNotes} aria-label={t.notesTitle} className={`${roundBtn} lg:hidden`}><LuNotebookPen aria-hidden="true" /></button>}
        <button type="button" onClick={() => setPrefs({ sfx: !prefs.sfx })} aria-label={g0.sound.button} aria-pressed={prefs.sfx} className={roundBtn}>
          {prefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
        </button>
        <button type="button" onClick={onHelp} aria-label={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></button>
      </div>
      <main className="mt-3 flex w-full max-w-[480px] flex-1 flex-col gap-3 lg:mt-4 lg:grid lg:h-[calc(100svh-7rem)] lg:min-h-[620px] lg:max-w-[1340px] lg:grid-cols-[300px_minmax(0,1fr)_330px] lg:gap-6">
        <aside className="hidden min-h-0 flex-col gap-2 overflow-y-auto lg:flex">
          {notes && <><h2 className="text-sm font-black text-[var(--qt-gold)]">{t.notesTitle}</h2>{notes}</>}
        </aside>
        <section className="qt-table flex min-h-0 flex-col gap-3 rounded-[8px] p-3 lg:gap-4 lg:overflow-y-auto lg:p-6">{children}</section>
        <aside className="flex min-h-0 flex-col gap-2">
          <h2 className="text-sm font-black text-[var(--qt-gold)]">{t.logTitle}</h2>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{log}</div>
        </aside>
      </main>
    </QtFrame>
  );
}

/** 對方的 8 張牌背（要猜的那排）：每張底下寫位置，背上寫筆記的摘要（確定的點數，或還剩幾種） */
export function HiddenRow({ t, notes, onPick, reveal, label, focus }: {
  t: QtText; notes?: Notes; onPick?: (pos: number) => void; reveal?: Card[] | null; label: ReactNode; focus?: number | null;
}) {
  return (
    <div className="flex flex-col gap-1.5 lg:mx-auto lg:w-full lg:max-w-[620px]">
      <div className="flex items-center gap-2 text-sm font-black">{label}</div>
      <div className="grid grid-cols-8 gap-1 lg:gap-2.5">
        {Array.from({ length: HAND_SIZE }, (_, p) => {
          const s = notes ? summary(notes[p]) : null;
          const card = reveal?.[p];
          return (
            <button key={p} type="button" disabled={!onPick} onClick={() => onPick?.(p)} className="flex flex-col items-center gap-1"
              aria-label={fill(t.pos, { n: p + 1 })}>
              <span className="relative w-full">
                {card ? <PlayingCard card={card} className="w-full" /> : <PlayingCard back className="w-full" ring={focus === p} />}
                {!card && s && (s.rank !== null || s.left < 13) && (
                  <span className="absolute inset-x-[12%] top-1/2 grid -translate-y-1/2 place-items-center rounded-[3px] bg-[var(--qt-paper)] py-0.5 text-[clamp(0.7rem,3.4vw,1.25rem)] font-black leading-none text-[var(--qt-ink)] shadow-[0_0_0_2px_var(--qt-paper)]">
                    {s.rank !== null ? rankLabel(s.rank) : <span className="text-[0.75em] opacity-70">{s.left}?</span>}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-black tabular-nums opacity-75">{p + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 自己那排：外面一圈米白框（畫面上不寫「你」，讀屏念 mine） */
export function MyRow({ t, hand, label }: { t: QtText; hand: Card[]; label?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 lg:mx-auto lg:w-full lg:max-w-[620px]">
      {label && <div className="flex items-center gap-2 text-sm font-black">{label}</div>}
      <div className="rounded-[8px] p-1.5 outline outline-2 -outline-offset-2 outline-[var(--qt-fg)] lg:p-2.5">
        <span className="sr-only">{t.mine}</span>
        <div className="grid grid-cols-8 gap-1 lg:gap-2.5">
          {hand.map((c, i) => <PlayingCard key={i} card={c} className="w-full" />)}
        </div>
      </div>
    </div>
  );
}

/** 代幣的警示燈：亮的時候是一顆朱紅的圓、旁邊寫明 */
export function Lamp({ on, t }: { on: boolean; t: QtText }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black ${on ? '' : 'opacity-0'}`} aria-hidden={!on}>
      <span className="size-3 rounded-full bg-[var(--qt-red)] shadow-[0_0_8px_2px_var(--qt-red)]" />
      <span className="hidden sm:inline">{t.lampOn}</span>
    </span>
  );
}

/** 優先標記：一枚金色的小籌碼（畫裡桌上的金幣） */
export function Marker({ t }: { t: QtText }) {
  return (
    <span title={t.marker} className="inline-grid size-5 shrink-0 place-items-center rounded-full bg-[var(--qt-gold)] text-[10px] font-black text-[var(--qt-ink)]">
      <span className="sr-only">{t.marker}</span>
      <span aria-hidden="true">◆</span>
    </span>
  );
}
