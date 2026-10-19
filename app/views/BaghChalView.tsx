import BaghHub from '@/components/bagh-chal/BaghHub';
import PlatformCorner from '@/components/PlatformCorner';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/**
 * Bagh Chal 的遊戲首頁（六個語系共用），版面照 Wall Go 首頁（HomeView）：
 * 角落是平台 logo 與聯絡／語言，中間是標題與模式磁磚，整頁塞得進一個畫面。
 * 規則在自己的頁面（/bagh-chal/rules），這裡只放一句節目裡的出處。
 */
export default function BaghChalView({ locale }: { locale: Locale }) {
  const b = getMessages(locale).baghChal;
  return (
    <div className="flex h-dvh min-h-dvh flex-col items-center justify-center px-5 py-[max(1rem,3dvh)] font-[family-name:var(--font-app)]">
      <PlatformCorner locale={locale} />
      <div aria-hidden="true" className="hidden h-14 w-px shrink portrait:block" />
      <main className="home-main flex w-full max-w-[420px] flex-col items-center">
        <header className="text-center">
          <h1 className="mt-1 text-[clamp(2.25rem,7dvh,3.75rem)] font-black leading-[0.95] tracking-tight">
            {b.title}<br /><span className="text-[0.62em]">{b.subtitle}</span>
          </h1>
          <p className="mt-[max(0.5rem,1.5dvh)] text-sm font-bold text-ink-soft md:text-base">{b.tagline}</p>
        </header>
        <div className="home-grid mt-[max(1rem,3dvh)] w-full">
          <BaghHub />
        </div>
      </main>
    </div>
  );
}
