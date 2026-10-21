'use client';
import { GiChessKnight } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useTextTable } from '@/i18n/gameText';
import { SIZES } from '@/games/knights-tour/engine';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import { practiceKey, useBestTimes } from './records';
import { formatTime, sizeLabel } from './ui';
import { BAND_CHALK, MODAL_PANEL } from './GameFrame';

/**
 * 練習模式選棋盤大小（選單與對局中共用）。六個大小同一種中性卡片 ——
 * 並列的選項不各帶色相（CLAUDE.md〈視覺〉），有紀錄的在大小下面寫最佳時間。
 */
export default function SizePicker({ open, current, onPick, onClose }: {
  open: boolean;
  current?: number;
  onPick: (n: number) => void;
  onClose: () => void;
}) {
  const t = useTextTable<KnightsText>(TEXT);
  const best = useBestTimes();
  return (
    <Modal isOpen={open} onClose={onClose} title={t.pickSize} kicker={t.practiceMode} icon={GiChessKnight}
      band={BAND_CHALK} panelClassName={MODAL_PANEL}>
      <div className="grid grid-cols-3 gap-3">
        {SIZES.map((n) => {
          const ms = best[practiceKey(n)];
          return (
            <button key={n} type="button" onClick={() => onPick(n)} aria-pressed={n === current}
              className={`kt-plate flex flex-col items-center gap-1 py-4 active:scale-[0.97] ${n === current ? 'is-hatched' : ''}`}>
              <span className="text-xl font-black tabular-nums">{sizeLabel(n)}</span>
              <span className={`text-[11px] font-bold tabular-nums ${n === current ? 'opacity-80' : 'text-ink-soft'}`}>{ms ? formatTime(ms) : '—'}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
