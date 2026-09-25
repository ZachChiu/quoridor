'use client';
import { GiBrokenWall } from 'react-icons/gi';
import type { Messages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import StatusScreen, { BTN_PRIMARY, BTN_SECONDARY } from './StatusScreen';

/**
 * 執行期錯誤的畫面（俗稱 500）。兩個地方用：
 *
 * - 各語系 layout 底下的 `error.tsx` —— 錯誤發生在頁面裡，layout（字型、
 *   語系 Provider）還活著，這是絕大多數的情況
 * - `global-error.tsx` —— 連 root layout 都掛了，只剩這一層
 *
 * 圖示用裂開的牆 —— 這個遊戲裡「牆」就是一切，牆裂了是最直接的比喻。
 *
 * 「重新整理」用整頁重新載入而不是只重繪這一段：錯誤多半來自某個
 * 壞掉的狀態（或過期的 chunk），留在同一個 JS 環境裡重試很可能再壞一次。
 */
export default function ErrorScreen({ t, locale }: { t: Messages['error']; locale: Locale }) {
  return (
    <div className="bg-primary-50">
      <StatusScreen
        icon={GiBrokenWall}
        iconClass="text-tile-red"
        title={t.title}
        body={t.body}
        actions={<>
          <button type="button" onClick={() => window.location.reload()} className={BTN_PRIMARY}>{t.retry}</button>
          {/* 用 <a> 而不是 next/link：這裡的 client 狀態已經不可信，整頁載入最保險 */}
          <a href={localePath(locale, '/')} className={BTN_SECONDARY}>{t.home}</a>
        </>}
      />
    </div>
  );
}
