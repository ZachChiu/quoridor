'use client';
import { useShareCard } from '@/components/ShareResultModal';
import { fill, useTextTable } from '@/i18n/gameText';
import { useGameText, useLocale, useMessages } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { HEXAGON } from '@/i18n/routes';
import { totals, type GameState } from '@/games/hexagon/engine';
import { TEXT, type HexText } from '@/games/hexagon/text';
import { drawHxCard, type HxCardData } from './shareCard';

/**
 * 結算分享圖的資料（每日一題、節目規則、練習共用）。QR 掃了回到這款的首頁（帶語系），utm_campaign 是 hexagon。
 * 只給 9:16 一種（同騎士巡遊、尼泊爾虎棋）。字用頁面的 --font-app（這款的網頁字型，要先載好）。
 */
export function useHxShare({ isOpen, state, modeName }: { isOpen: boolean; state: GameState; modeName: string }) {
  const t = useTextTable<HexText>(TEXT);
  const m = useMessages();
  const g = useGameText();
  const locale = useLocale();
  const sum = totals(state.history);
  const mode = state.config.mode === 'daily' ? `${modeName}・${state.config.seed.replace(/^daily:/, '')}` : modeName;
  const data: Omit<HxCardData, 'font'> = {
    score: state.score, ...sum,
    rounds: state.history.slice(-10).map((r) => ({ found: r.found, answers: r.answers })),
    last: { board: state.round.board, answers: state.round.answers, found: [...state.found] },
    text: {
      name: t.subtitle ? `${t.title} ${t.subtitle}` : t.title,
      mode,
      scoreLine: fill(t.resultTitle, { score: state.score }),
      stats: `${t.found} ${sum.found} / ${sum.answers}・${t.wrong} ${sum.wrong}`,
      brand: t.title,
      from: fill(g.share.cardFrom, { show: m.meta.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  };
  const font = typeof document === 'undefined' ? 'system-ui'
    : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const words = `${Object.values(data.text).join('')}0123456789/`;
  return useShareCard({
    isOpen,
    draw: drawHxCard({ ...data, font }),
    contentKey: JSON.stringify(data),
    fileName: 'hexagon',
    homePath: localePath(locale, HEXAGON),
    campaign: 'hexagon',
    layouts: ['story'],
    fonts: [{ font: `900 40px ${font}`, text: words }, { font: `700 40px ${font}`, text: words }],
  });
}
