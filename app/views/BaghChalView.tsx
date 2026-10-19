import BaghHub from '@/components/bagh-chal/BaghHub';
import PlatformCorner from '@/components/PlatformCorner';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/**
 * Bagh Chal 的遊戲首頁（六個語系共用）。角落是平台 logo 與聯絡／語言，中間是標題與選單，整頁塞得進一個畫面。
 *
 * 2026-10-20 換成印刷棋盤那一套識別（不再是 Wall Go 的奶油底撞色）：手工紙底色、
 * 標題下一條老虎追羊的飾帶、選單是 AI 畫的圓牌。桌機左邊多一張 AI 畫的整面棋盤，
 * 手機沒有位置放，只留飾帶。規則在自己的頁面（/bagh-chal/rules）。
 */
export default function BaghChalView({ locale }: { locale: Locale }) {
  const b = getMessages(locale).baghChal;
  return (
    <div className="flex h-dvh min-h-dvh flex-col items-center justify-center bg-[#f1e6cd] px-5 py-[max(1rem,3dvh)] font-[family-name:var(--font-app)]">
      <PlatformCorner locale={locale} />
      <div aria-hidden="true" className="hidden h-14 w-px shrink portrait:block" />
      <div className="flex w-full items-center justify-center gap-[clamp(2rem,5vw,5rem)]">
        {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，已是 webp */}
        <img src="/games/bagh-chal/board-art.webp" alt="" width={760} height={760}
          className="hidden aspect-square w-[min(560px,72dvh,45vw)] rounded-[28px] lg:block" />
        <main className="home-main flex w-full max-w-[420px] flex-col items-center">
          <header className="w-full text-center">
            <h1 className="mt-1 text-[clamp(2.25rem,7dvh,3.75rem)] font-black leading-[0.95] tracking-tight">
              {b.title}<br /><span className="text-[0.62em]">{b.subtitle}</span>
            </h1>
            <p className="mt-[max(0.5rem,1.5dvh)] text-sm font-bold text-ink-soft md:text-base">{b.tagline}</p>
            {/* 老虎追羊的飾帶：印刷棋盤外框那一圈，在這裡當標題下的分隔 */}
            <div aria-hidden="true" className="mx-auto mt-[max(0.75rem,2dvh)] h-[clamp(28px,5dvh,40px)] w-full max-w-[min(380px,calc(100dvh-22rem))] rounded-md border-2 border-[#5b6620] bg-[url('/games/bagh-chal/frieze.webp')] bg-[length:auto_100%] bg-repeat-x" />
          </header>
          <div className="home-grid mt-[max(1rem,3dvh)] w-full">
            <BaghHub />
          </div>
        </main>
      </div>
    </div>
  );
}
