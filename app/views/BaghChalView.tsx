import BaghHub from '@/components/bagh-chal/BaghHub';
import BaghFrame from '@/components/bagh-chal/BaghFrame';
import BaghWordmark from '@/components/bagh-chal/BaghWordmark';
import BaghHeader from '@/components/bagh-chal/BaghHeader';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/**
 * Bagh Chal 的遊戲首頁（六個語系共用）—— 「整頁圖騰」提案（2026-10-20 Zach 選的）：
 * 整頁包在番紅花畫框裡（四邊老虎追羊的飾帶），紙色面板最上面一列是平台 logo 與聯絡／語言（BaghHeader），
 * 下面天城體大字 बाघचाल、四個按鈕（老虎、羊、兩人同一台、連線對戰）。桌機多一張 AI 畫的整面印刷棋盤放在左邊。
 */
export default function BaghChalView({ locale }: { locale: Locale }) {
  const b = getMessages(locale).baghChal;
  return (
    <BaghFrame variant="hub">
      <BaghHeader locale={locale} />
      <div className="flex flex-1 justify-center gap-[clamp(2rem,5vw,4.5rem)] px-4 pb-[max(1rem,3dvh)] pt-1">
        {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，已是 webp */}
        <img src="/games/bagh-chal/board-art.webp" alt="" width={760} height={760}
          className="my-auto hidden aspect-square w-[min(500px,64dvh,40vw)] rounded-[24px] lg:block" />
        <main className="my-auto flex w-full max-w-[400px] flex-col items-center">
          <h1 className="flex flex-col items-center text-center">
            <span className="sr-only">{b.title}</span>
            <BaghWordmark className="h-auto w-[min(80%,300px,36dvh)]" />
            <span className="mt-[max(0.25rem,1dvh)] text-[clamp(1.4rem,4dvh,2rem)] font-black tracking-[0.12em]">{b.subtitle}</span>
          </h1>
          <p className="mt-1 text-sm font-bold text-ink-soft">{b.tagline}</p>
          <div className="mt-[max(1rem,2.6dvh)] w-full">
            <BaghHub />
          </div>
        </main>
      </div>
    </BaghFrame>
  );
}
