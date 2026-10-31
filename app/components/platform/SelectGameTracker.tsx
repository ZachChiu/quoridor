'use client';
import { useEffect } from 'react';
import { track, type GameSlug, type SelectLocation } from '@/utils/analytics';

/**
 * 平台首頁、季目錄頁點了能玩的遊戲卡：送 `select_game`（docs/platform-tracking.md）。
 *
 * 不在每張卡上各掛 onClick（卡片是 server component）：能玩的卡與大卡的「開始玩」本來就帶 `data-game`（站內路徑，HeroPicker 也靠它），
 * 這裡在 document 上聽 click，往上找 `data-select-location` 決定是哪一區。滑鼠、鍵盤 Enter、cmd 點開新分頁都會觸發 click。
 * seasons：站內路徑 → 第幾季，由頁面（server）用 catalog 的 `SEASON_OF` 傳進來，catalog 不必進 client 的 bundle。
 */
export default function SelectGameTracker({ seasons }: { seasons: Record<string, 1 | 2 | 3> }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const card = (e.target as Element | null)?.closest?.('a[data-game]');
      const path = card?.getAttribute('data-game');
      const location = card?.closest('[data-select-location]')?.getAttribute('data-select-location') as SelectLocation | null | undefined;
      if (!path || !location || !seasons[path]) return;
      track('select_game', { game: path.slice(1) as GameSlug, location, season: seasons[path] });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [seasons]);
  return null;
}

