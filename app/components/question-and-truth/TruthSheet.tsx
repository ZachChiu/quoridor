'use client';
import { useState } from 'react';
import { GiCardAceDiamonds } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { HAND_SIZE, rankLabel } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import { QT_BAND, QT_PANEL } from './palette';

/**
 * 說真相的彈窗：上面 8 格（對方的第 1–8 張），下面 13 個點數。選一格、按一個點數就填上、自動跳下一格。
 * 打開時先照筆記填好（圈起來的、或只剩一個沒劃掉的）。
 */
export default function TruthSheet({ t, open, onClose, onSubmit, initial, kicker }: {
  t: QtText; open: boolean; onClose: () => void; onSubmit: (ranks: number[]) => void; initial: (number | null)[]; kicker?: string;
}) {
  const [vals, setVals] = useState<(number | null)[]>(initial);
  const [at, setAt] = useState(() => Math.max(0, initial.findIndex((v) => v === null)));
  const [seenOpen, setSeenOpen] = useState(open);
  if (open !== seenOpen) {
    setSeenOpen(open);
    if (open) { setVals(initial); setAt(Math.max(0, initial.findIndex((v) => v === null))); }
  }
  const full = vals.every((v) => v !== null);
  const put = (r: number) => {
    const next = vals.map((v, i) => (i === at ? r : v));
    setVals(next);
    const empty = next.findIndex((v, i) => v === null && i > at);
    const any = next.findIndex((v) => v === null);
    setAt(empty >= 0 ? empty : any >= 0 ? any : Math.min(HAND_SIZE - 1, at + 1));
  };
  return (
    <Modal isOpen={open} onClose={onClose} title={t.truthTitle} kicker={kicker} icon={GiCardAceDiamonds} band={QT_BAND} panelClassName={QT_PANEL}
      footer={<button type="button" disabled={!full} onClick={() => full && onSubmit(vals as number[])} className="qt-btn is-red min-h-12 flex-1 py-3 text-base">{t.truthSubmit}</button>}>
      <p className="text-sm font-bold leading-relaxed opacity-80">{t.truthHint}</p>
      <div className="mt-3 grid grid-cols-8 gap-1">
        {vals.map((v, i) => (
          <button key={i} type="button" onClick={() => setAt(i)} aria-label={`${i + 1}`} aria-pressed={at === i}
            className={`flex aspect-[5/7] flex-col items-center justify-center rounded-[4px] border-2 ${at === i ? 'border-[var(--qt-red)]' : 'border-transparent'} bg-[color-mix(in_srgb,var(--qt-ink)_9%,transparent)]`}>
            <span className="text-[10px] font-black opacity-55">{i + 1}</span>
            <span className="text-lg font-black tabular-nums leading-none">{v === null ? '·' : rankLabel(v)}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {Array.from({ length: 13 }, (_, i) => i + 1).map((r) => (
          <button key={r} type="button" onClick={() => put(r)} className="qt-btn is-paper min-h-11 text-base tabular-nums">{rankLabel(r)}</button>
        ))}
      </div>
    </Modal>
  );
}
