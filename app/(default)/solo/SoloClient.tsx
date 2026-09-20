'use client';
import { useState } from 'react';
import { GiBrain } from 'react-icons/gi';
import PlayClient from '@/components/PlayClient';
import { useGame } from '@/contexts/GameContext';
import { useMessages } from '@/i18n/LocaleProvider';
import { trackButtonClick } from '@/utils/analytics';
import type { Difficulty } from '@/game/ai';

/**
 * 單人對戰。
 *
 * 難度原本存在 GameContext，由首頁的 Modal 設定後才導過來 —— 那表示
 * 直接開這個網址（書籤、分享連結、搜尋結果點進來）會沒有難度，
 * 靜靜地退化成本機雙人。一條自己站不住的路由不值得存在，
 * 所以這裡自備選單：沒選過就先問，選了就開打。
 */
const TONES: { key: Difficulty; tone: string }[] = [
  { key: 'easy', tone: 'bg-tile-forest text-tile-cream' },
  { key: 'normal', tone: 'bg-tile-amber text-tile-ink' },
  { key: 'hard', tone: 'bg-tile-red text-tile-cream' },
];

export default function SoloClient() {
  const { gameState, setGameState } = useGame();
  const t = useMessages();
  const LABELS = [t.solo.level1, t.solo.level2, t.solo.level3];
  const [picked, setPicked] = useState(!!gameState.aiDifficulty);

  if (picked && gameState.aiDifficulty) return <PlayClient />;

  return (
    <div className="flex w-full max-w-[380px] flex-col items-center gap-6 px-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <GiBrain className="text-6xl text-tile-orange" aria-hidden="true" />
        <h2 className="text-3xl font-black tracking-tight">{t.solo.pickLevel}</h2>
      </div>
      <div className="grid w-full grid-cols-3 gap-3">
        {TONES.map(({ key, tone }, i) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setGameState({ ...gameState, playersNum: 2, aiDifficulty: key });
              setPicked(true);
              trackButtonClick(`start_solo_game_${key}`);
            }}
            className={`${tone} rounded-2xl py-6 text-xl font-black transition hover:brightness-95 active:scale-[0.97]`}
          >
            {LABELS[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
