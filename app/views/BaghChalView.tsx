import BaghHub from '@/components/bagh-chal/BaghHub';
import BaghFrame from '@/components/bagh-chal/BaghFrame';
import BaghHeader from '@/components/bagh-chal/BaghHeader';
import BaghWordmark from '@/components/bagh-chal/BaghWordmark';
import { getMessages } from '@/i18n';
import type { Locale } from '@/i18n/locales';

/**
 * Bagh Chal 的遊戲首頁（六個語系共用）：整頁包在番紅花畫框裡（四邊飾帶），紙色面板最上面一列是
 * 平台 logo 與聯絡／語言（BaghHeader），下面標題與四個按鈕（老虎、羊、本機對戰、連線對戰）。
 *
 * 桌機跟 Wall Go 首頁一樣只有手機寬度的一欄（Zach）：先前左邊多放一張 AI 畫的整面棋盤，
 * 畫風跟遊戲裡程式畫的棋盤不一樣，拿掉。
 * 標題是天城體字標（बाघचाल，尼泊爾文寫的 Bagh Chal），下面接各語系的名字（虎羊棋）。
 * 字標只放在這一頁 —— 原本每一頁都放（Zach：為什麼每一個都要放他），對局、規則、選邊頁只寫虎羊棋。
 */
export default function BaghChalView({ locale }: { locale: Locale }) {
  const b = getMessages(locale).baghChal;
  // 英文的名字（Tigers and Goats）比中日韓泰長很多，用同樣的大字、寬字距會斷成兩行：長的縮一號、字距收窄
  const long = b.subtitle.length > 10;
  return (
    <BaghFrame variant="hub">
      <BaghHeader locale={locale} />
      <div className="flex flex-1 justify-center px-4 pb-[max(1rem,3dvh)] pt-1">
        <main className="my-auto flex w-full max-w-[400px] flex-col items-center">
          <h1 className="flex flex-col items-center text-center">
            <span className="sr-only">{b.title}</span>
            <BaghWordmark className="h-auto w-[min(80%,300px,36dvh)]" />
            <span className={`mt-[max(0.25rem,1dvh)] font-black ${long ? 'text-[clamp(1.2rem,3.2dvh,1.6rem)] tracking-[0.04em]' : 'text-[clamp(1.4rem,4dvh,2rem)] tracking-[0.12em]'}`}>{b.subtitle}</span>
          </h1>
          <p className="mt-1.5 text-sm font-bold text-ink-soft">{b.tagline}</p>
          <div className="mt-[max(1rem,2.6dvh)] w-full">
            <BaghHub />
          </div>
        </main>
      </div>
    </BaghFrame>
  );
}
