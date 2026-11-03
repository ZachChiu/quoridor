'use client';
import { LuX } from 'react-icons/lu';
import { rankLabel } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import { cycle, type Notes } from './notes';

/**
 * 筆記格：8 欄（對方的第 1–8 張）× 13 列（A–K）。點一下劃掉、再點圈起來、再點清掉。
 * 手機在彈窗裡（點對方的牌就打開、那一欄先亮起來），桌機一直放在左邊那一欄。
 * tone：dark 是放在黑底上（桌機側欄），paper 是放在彈窗的牌紙上。
 */
export default function NotesGrid({ t, notes, onChange, focus = null, tone = 'paper' }: {
  t: QtText; notes: Notes; onChange: (n: Notes) => void; focus?: number | null; tone?: 'paper' | 'dark';
}) {
  const ink = tone === 'paper' ? 'var(--qt-ink)' : 'var(--qt-fg)';
  return (
    <div className="flex flex-col gap-2">
      <div role="group" aria-label={t.notesTitle} className="grid grid-cols-[1.6rem_repeat(8,minmax(0,1fr))] gap-[3px] text-center" style={{ color: ink }}>
        <span />
        {notes.map((_, p) => (
          <span key={p} className={`rounded-[3px] py-0.5 text-xs font-black tabular-nums ${focus === p ? 'bg-[var(--qt-red)] text-[#f1eed8]' : 'opacity-70'}`}>{p + 1}</span>
        ))}
        {Array.from({ length: 13 }, (_, i) => i + 1).map((rank) => (
          <Row key={rank} rank={rank} notes={notes} focus={focus} tone={tone} onTap={(p) => onChange(cycle(notes, p, rank))} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold opacity-70" style={{ color: ink }}>
        <span>{t.notesHint}</span>
        <button type="button" className="shrink-0 underline underline-offset-2" onClick={() => onChange(notes.map((r) => r.map(() => 0)))}>{t.notesClear}</button>
      </div>
    </div>
  );
}

function Row({ rank, notes, focus, tone, onTap }: { rank: number; notes: Notes; focus: number | null; tone: 'paper' | 'dark'; onTap: (p: number) => void }) {
  const cellBase = tone === 'paper'
    ? 'bg-[color-mix(in_srgb,var(--qt-ink)_7%,transparent)]'
    : 'bg-[color-mix(in_srgb,var(--qt-fg)_8%,transparent)]';
  return (
    <>
      <span className="self-center text-xs font-black tabular-nums">{rankLabel(rank)}</span>
      {notes.map((row, p) => {
        const v = row[rank - 1];
        return (
          <button key={p} type="button" aria-label={`${p + 1} ${rankLabel(rank)}`}
            aria-pressed={v === 2 ? true : v === 1 ? 'mixed' : false}
            onClick={() => onTap(p)}
            className={`relative grid h-[min(1.75rem,4.2svh)] place-items-center rounded-[3px] text-[11px] font-black transition ${cellBase} ${focus === p ? 'ring-1 ring-[var(--qt-red)]' : ''}`}>
            {v === 1 && <LuX aria-hidden="true" className="size-3.5 opacity-45" />}
            {v === 2 && <span aria-hidden="true" className="grid size-[1.35rem] place-items-center rounded-full border-2 border-[var(--qt-red)] leading-none">{rankLabel(rank)}</span>}
          </button>
        );
      })}
    </>
  );
}
