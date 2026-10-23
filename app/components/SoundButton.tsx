'use client';

import { LuVolume2, LuVolumeX } from 'react-icons/lu';
import { useGameText } from '@/i18n/LocaleProvider';
import { HOVER_TIP } from './IconButton';
import type { SoundPrefs } from '@/utils/sound';

/**
 * 對局左上角的喇叭：一按就開／關音效，關掉時圖示換成打叉的喇叭。
 * 原本點開是一小塊「音效、音樂」兩個開關；音樂拔掉（Zach 10/23）之後只剩一個，就直接按。
 * 跟旁邊的首頁、遊玩方式同一個紙色、同一套 Lucide 線條圖示（Zach 10/23 選的 B）。
 */
export default function SoundButton({ prefs, setPrefs }: {
  prefs: SoundPrefs;
  setPrefs: (p: Partial<SoundPrefs>) => void;
}) {
  const g = useGameText();
  return (
    <button
      type="button"
      aria-label={g.sound.button}
      aria-pressed={prefs.sfx}
      onClick={() => setPrefs({ sfx: !prefs.sfx })}
      className="group relative rounded-full bg-primary-50 p-3.5 text-2xl text-tile-ink transition hover:brightness-95 active:scale-95 coarse:p-2.5"
    >
      {prefs.sfx ? <LuVolume2 /> : <LuVolumeX />}
      <span aria-hidden="true" className={HOVER_TIP}>{g.sound.button}</span>
    </button>
  );
}
