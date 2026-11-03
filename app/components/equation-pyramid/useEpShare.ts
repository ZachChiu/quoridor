'use client';
import { useShareCard } from '@/components/ShareResultModal';
import { fill, useTextTable } from '@/i18n/gameText';
import { useGameText, useLocale, useMessages } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { EQUATION_PYRAMID } from '@/i18n/routes';
import { totals, type GameState } from '@/games/equation-pyramid/engine';
import { TEXT, type EpText } from '@/games/equation-pyramid/text';
import { clock } from './records';
import { drawEpCard, type EpCardData } from './shareCard';

/**
 * 結算分享圖的資料（三種模式共用）。QR 掃了回到這款的首頁（帶語系），utm_campaign 是 equation-pyramid。
 * 只給 9:16 一種（同六角數字盤、騎士巡遊）。字用頁面的 --font-app。
 * 節目規則：「12 : 9」＋獲勝／惜敗／平手（一個人計分就只有分數）；每日一題、大金字塔：找到幾組／共幾組、用時、答錯。
 */
export function useEpShare({ isOpen, state, modeName }: { isOpen: boolean; state: GameState; modeName: string }) {
  const t = useTextTable<EpText>(TEXT);
  const m = useMessages();
  const g = useGameText();
  const locale = useLocale();
  const sum = totals(state.history);
  const show = state.config.mode === 'show';
  const vs = state.config.cpu !== null;
  const { me, cpu } = state.score;
  const mode = state.config.mode === 'daily' ? `${modeName}・${state.config.seed.replace(/^daily:/, '')}` : modeName;
  const data: Omit<EpCardData, 'font'> = {
    result: show ? (vs ? `${me} : ${cpu}` : `${me}`) : `${sum.me} / ${sum.answers}`,
    verdict: show && vs ? (me > cpu ? t.win : me < cpu ? t.lose : t.draw) : '',
    stats: show
      ? `${t.found} ${sum.me} / ${sum.answers}・${t.wrong} ${sum.wrongMe}`
      : `${t.time} ${clock(sum.ms)}・${t.wrong} ${sum.wrongMe}`,
    rounds: show ? state.history.map((r) => ({ me: r.me, answers: r.answers })) : [],
    last: { blocks: [...state.round.blocks], target: state.round.target },
    text: {
      name: t.subtitle ? `${t.title} ${t.subtitle}` : t.title,
      mode,
      targetLabel: t.target,
      brand: t.title,
      from: fill(g.share.cardFrom, { show: m.meta.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  };
  const font = typeof document === 'undefined' ? 'system-ui'
    : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const words = `${Object.values(data.text).join('')}${data.result}${data.verdict}${data.stats}0123456789/+−×÷:`;
  return useShareCard({
    isOpen,
    draw: drawEpCard({ ...data, font }),
    contentKey: JSON.stringify(data),
    fileName: 'equation-pyramid',
    homePath: localePath(locale, EQUATION_PYRAMID),
    campaign: 'equation-pyramid',
    layouts: ['story'],
    fonts: [{ font: `900 40px ${font}`, text: words }, { font: `700 40px ${font}`, text: words }],
  });
}
