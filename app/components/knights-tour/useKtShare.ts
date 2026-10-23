'use client';
import { useShareCard } from '@/components/ShareResultModal';
import { fill, useTextTable } from '@/i18n/gameText';
import { useGameText, useLocale, useMessages } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { KNIGHTS_TOUR } from '@/i18n/routes';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import { drawKtCard, KT_SERIF, type KtCardData, type KtPlate } from './shareCard';

/**
 * 結算分享圖的資料與畫法（節目挑戰、練習模式共用）。QR 掃了回到這款的首頁（帶語系），utm_campaign 是 knights-tour。
 * 字：中日韓用頁面的 --font-app（繁中、簡中、泰文是子集網路字型，要先載好），拉丁字與數字是系統襯線（同 .kt-serif）。
 */
export function useKtShare({ isOpen, plates, time, isNew, kicker, title }: {
  isOpen: boolean;
  plates: KtPlate[];
  time: string;
  isNew: boolean;
  kicker: string;
  title: string;
}) {
  const t = useTextTable<KnightsText>(TEXT);
  const m = useMessages();
  const g = useGameText();
  const locale = useLocale();
  const data: Omit<KtCardData, 'font'> = {
    plates, time, isNew,
    text: {
      name: t.title,
      subtitle: t.subtitle,
      kicker,
      title,
      timeLabel: t.elapsed,
      newBest: t.newBest,
      closed: t.closedTour,
      brand: t.subtitle ? `${t.title} ${t.subtitle}` : t.title,
      from: fill(g.share.cardFrom, { show: m.meta.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  };
  const font = typeof document === 'undefined' ? 'system-ui'
    : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const words = Object.values(data.text).join('');
  return useShareCard({
    isOpen,
    draw: drawKtCard({ ...data, font }),
    contentKey: JSON.stringify(data),
    fileName: 'knights-tour',
    homePath: localePath(locale, KNIGHTS_TOUR),
    campaign: 'knights-tour',
    fonts: [
      { font: `900 40px ${font}`, text: words },
      { font: `700 40px ${font}`, text: words },
      { font: `600 40px ${KT_SERIF}`, text: `0123456789:${time}` },
      { font: `italic 400 40px ${KT_SERIF}`, text: `Fig. Tab. I ${t.subtitle ?? ''}` },
    ],
  });
}
