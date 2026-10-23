'use client';

import { useEffect, useRef, useState } from 'react';
import { GiSpeaker, GiSpeakerOff } from 'react-icons/gi';
import { useGameText } from '@/i18n/LocaleProvider';
import { HOVER_TIP } from './IconButton';
import type { SoundPrefs } from '@/utils/sound';

/**
 * 對局左上角的喇叭（Zach 10/23）：點開一小塊，音效、音樂各一個開關。
 * 兩個都關時圖示換成打叉的喇叭，一眼看得出這局是安靜的。
 * 跟旁邊的首頁、遊玩方式同一個紙色。
 */
export default function SoundButton({ prefs, setPrefs }: {
  prefs: SoundPrefs;
  setPrefs: (p: Partial<SoundPrefs>) => void;
}) {
  const g = useGameText();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => { window.removeEventListener('pointerdown', away); window.removeEventListener('keydown', esc); };
  }, [open]);

  const silent = !prefs.sfx && !prefs.music;
  const rows: { key: keyof SoundPrefs; label: string }[] = [
    { key: 'sfx', label: g.sound.sfx },
    { key: 'music', label: g.sound.music },
  ];

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={g.sound.button}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="group relative rounded-full bg-primary-50 p-3.5 text-2xl text-tile-ink transition hover:brightness-95 active:scale-95 coarse:p-2.5"
      >
        {silent ? <GiSpeakerOff /> : <GiSpeaker />}
        {!open && <span aria-hidden="true" className={HOVER_TIP}>{g.sound.button}</span>}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 flex w-44 flex-col gap-1 rounded-2xl bg-primary-50 p-2">
          {rows.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              onClick={() => setPrefs({ [key]: !prefs[key] })}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-black text-tile-ink transition hover:bg-tile-ink/[0.06]"
            >
              {label}
              {/* 開關：深墨＝開、淡墨＝關 */}
              <span className={`relative h-6 w-10 rounded-full transition ${prefs[key] ? 'bg-tile-ink' : 'bg-tile-ink/[0.15]'}`}>
                <span className={`absolute top-1 size-4 rounded-full bg-tile-cream transition-all ${prefs[key] ? 'left-5' : 'left-1'}`} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
