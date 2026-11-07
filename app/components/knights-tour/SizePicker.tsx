'use client';
import { useState } from 'react';
import type { IconType } from 'react-icons';
import KnightSvg from './KnightSvg';
import Modal from '@/components/Modal';
import { fill, useTextTable } from '@/i18n/gameText';
import { canClose, SIZES } from '@/games/knights-tour/engine';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import { closedKey, practiceKey, useBestTimes } from './records';
import { formatTime, sizeLabel } from './ui';
import { BAND_CHALK, MODAL_PANEL } from './styles';

/**
 * 練習模式選棋盤大小（選單與對局中共用）。六個大小同一種中性卡片 ——
 * 並列的選項不各帶色相（CLAUDE.md〈視覺〉），有紀錄的在大小下面寫最佳時間。
 *
 * `closed`：「回到原點」挑戰用。單數邊照樣列出來（淡掉、寫「回不去」），點了不開局、在下面說明為什麼做不到
 * （docs/puzzle-reels.md：「5×5 選這個模式時直接說明為什麼」）—— 藏起來的話，看的人只會覺得少了幾個大小。
 */
/** 彈窗標題的圖示也是對局裡那隻銅版畫騎士（11/1 Zach：首頁按鈕換了，這裡也要）。Modal 用字級給大小，所以寬高是 1em */
const KnightIcon: IconType = ({ className }) => <KnightSvg className={`${className ?? ''} size-[1em]`} />;

export default function SizePicker({ open, current, closed = false, onPick, onClose }: {
  open: boolean;
  current?: number;
  closed?: boolean;
  onPick: (n: number) => void;
  onClose: () => void;
}) {
  const t = useTextTable<KnightsText>(TEXT);
  const best = useBestTimes();
  /** 點了做不到的大小：說明的是哪一個 */
  const [why, setWhy] = useState<number | null>(null);
  const close = () => { setWhy(null); onClose(); };
  return (
    <Modal isOpen={open} onClose={close} title={t.pickSize} kicker={closed ? t.closedMode : t.practiceMode} icon={KnightIcon}
      band={BAND_CHALK} panelClassName={MODAL_PANEL}>
      <div className="grid grid-cols-3 gap-3">
        {SIZES.map((n) => {
          const ms = best[closed ? closedKey(n) : practiceKey(n)];
          const can = !closed || canClose(n);
          return (
            <button key={n} type="button" onClick={() => { if (can) { setWhy(null); onPick(n); } else setWhy(n); }}
              aria-pressed={n === current}
              className={`kt-plate flex flex-col items-center gap-1 py-4 active:scale-[0.97] ${n === current || n === why ? 'is-hatched' : ''} ${can ? '' : 'opacity-55'}`}>
              <span className="text-xl font-black tabular-nums">{sizeLabel(n)}</span>
              <span className={`text-[11px] font-bold tabular-nums ${n === current ? 'opacity-80' : 'text-ink-soft'}`}>{!can ? t.closedOdd : ms ? formatTime(ms) : '—'}</span>
            </button>
          );
        })}
      </div>
      {why !== null && (
        <p className="mt-4 text-sm font-bold leading-relaxed" aria-live="polite">
          {fill(t.closedOddWhy, { size: sizeLabel(why), k: why * why })}
        </p>
      )}
    </Modal>
  );
}
