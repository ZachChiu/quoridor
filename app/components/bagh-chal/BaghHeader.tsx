import Link from 'next/link';
import PlatformMark from '@/components/PlatformMark';
import ContactButton from '@/components/ContactButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { BRAND } from '@/brand';
import { localePath, type Locale } from '@/i18n/locales';
import { BAGH_CORNER } from './styles';

/**
 * 虎羊棋首頁面板最上面那一列：左邊平台 logo（回平台首頁）、右邊聯絡我們與語言。
 *
 * Wall Go 首頁是把這三顆釘在畫面角落（PlatformCorner，fixed）。虎羊棋外面有一圈畫框，
 * 釘在角落就是疊在飾帶上 —— Zach：不要直接埋在哪裡。所以放進紙色面板裡、跟內容走在同一個流裡，
 * 圓鈕換成虎羊棋的樣子（紙色底、橄欖綠外圈），打開的彈窗也是虎羊棋的。
 */
export default function BaghHeader({ locale }: { locale: Locale }) {
  return (
    <div className="flex items-center justify-between px-3 pt-3">
      <Link href={localePath(locale, '/')} aria-label={BRAND} title={BRAND} className="transition hover:brightness-110 active:scale-95">
        <PlatformMark />
      </Link>
      <div className="flex gap-2">
        <ContactButton theme={BAGH_CORNER} />
        <LanguageSwitcher theme={BAGH_CORNER} />
      </div>
    </div>
  );
}
