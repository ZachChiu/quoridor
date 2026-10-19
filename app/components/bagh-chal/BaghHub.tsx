'use client';
import { useState } from 'react';
import { GiGoat, GiRuleBook, GiTabletopPlayers, GiTigerHead } from 'react-icons/gi';
import GameTile, { type TileOrigin } from '@/components/GameTile';
import Modal from '@/components/Modal';
import DifficultyButtons from '@/components/DifficultyButtons';
import { useTransition } from '@/contexts/TransitionContext';
import { useMessages, useLocale } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';
import type { Side } from '@/games/bagh-chal/engine';
import type { Difficulty } from '@/games/bagh-chal/ai';
import { soloHash } from './soloHash';

const wipeFrom = ({ rect, color, icon, iconSize, label, kicker, row, iconColor, fg }: TileOrigin) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
  color,
  from: { width: rect.width, height: rect.height, radius: 16 },
  icon, iconSize, label, kicker, row, iconColor, fg,
});

/**
 * Bagh Chal 首頁的磁磚，跟 Wall Go 首頁同一套（GameTile、同樣的轉場）。
 *
 * 跟電腦下分成「當老虎」「當羊」兩塊：選邊是這款遊戲最大的決定（兩邊玩法完全不同），
 * 藏進選單裡就看不出來。按下去再問難度（同一個難度 Modal 的樣子）。
 */
export default function BaghHub() {
  const t = useMessages();
  const b = t.baghChal;
  const locale = useLocale();
  const { navigate } = useTransition();
  const [side, setSide] = useState<Side | null>(null);

  const startSolo = (difficulty: Difficulty, at: { x: number; y: number }) => {
    if (!side) return;
    setSide(null);
    navigate(localePath(locale, baghChal('/solo')) + soloHash(side, difficulty), { wipe: { ...at, color: 'rgb(var(--tile-cream))' } });
  };

  return (
    <div className="relative z-20 grid w-full grid-cols-2 gap-3 md:gap-4">
      <GameTile icon={GiTigerHead} tone="orange" kicker={b.vsAi} label={b.tiger}
        href={localePath(locale, baghChal('/solo'))} onClick={() => setSide('tiger')} />
      <GameTile icon={GiGoat} tone="blue" kicker={b.vsAi} label={b.goat}
        href={localePath(locale, baghChal('/solo'))} onClick={() => setSide('goat')} />
      <GameTile icon={GiTabletopPlayers} tone="amber" label={b.local} wide
        href={localePath(locale, baghChal('/local'))}
        onClick={(o) => navigate(localePath(locale, baghChal('/local')), { wipe: wipeFrom(o) })} />
      <GameTile icon={GiRuleBook} tone="forest" label={t.home.rules} wide
        href={localePath(locale, baghChal('/rules'))}
        onClick={(o) => navigate(localePath(locale, baghChal('/rules')), { wipe: wipeFrom(o) })} />

      <Modal isOpen={!!side} onClose={() => setSide(null)} title={t.ui.pickLevel}
        kicker={`${b.playAs}：${side === 'goat' ? b.goat : b.tiger}`}
        icon={side === 'goat' ? GiGoat : GiTigerHead}
        band={side === 'goat' ? { className: 'bg-tile-blue', fg: 'text-tile-cream' } : { className: 'bg-tile-orange', fg: 'text-tile-ink' }}>
        <DifficultyButtons onPick={startSolo} />
      </Modal>
    </div>
  );
}
