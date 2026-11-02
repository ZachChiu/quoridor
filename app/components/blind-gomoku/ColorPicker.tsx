'use client';
import { COLORS, type StoneColor } from '@/games/blind-gomoku/engine';
import { ColorFace } from './Stone';

/**
 * 盲棋的選色盤：七顆子排一排（390 寬的手機上每顆約 46px，夠手指點）。
 * 選中的那顆底下換深墨色塊 —— 不用另一個色相標示選中，面板裡已經有七個顏色了。
 * 預設沿用上一手的顏色（狀態放在對局畫面，這裡只負責畫與回報）。
 */
export function ColorPicker({ value, onChange, disabled, label, nameOf }: {
  value: StoneColor;
  onChange: (c: StoneColor) => void;
  disabled?: boolean;
  label: string;
  nameOf: (c: StoneColor) => string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid w-full grid-cols-7 gap-1.5">
      {COLORS.map((c) => {
        const on = c === value;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={nameOf(c)}
            title={nameOf(c)}
            disabled={disabled}
            onClick={() => onChange(c)}
            // 一格一塊布：選中的那塊縫線變成實線的黑絲（棋子本身就是那塊布的顏色，不再墊深墨）
            className={`gmk-patch grid aspect-square max-h-14 w-full place-items-center active:scale-95 disabled:opacity-40 ${
              on ? '![outline-color:#2a2525] ![outline-offset:-4px] ![outline-style:solid] ![outline-width:2px]' : 'is-ramie'
            }`}
          >
            <ColorFace color={c} className={`size-[72%] transition-transform ${on ? 'scale-110' : ''}`} />
          </button>
        );
      })}
    </div>
  );
}
