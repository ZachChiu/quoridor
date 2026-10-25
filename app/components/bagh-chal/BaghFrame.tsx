import type React from 'react';

/**
 * 虎羊棋的整頁背景與紙色面板。虎羊棋的每一頁都包在這裡面。
 *
 * 背景是一整幅滿版的米提拉圖騰（AI 畫的，手機直式、桌機橫式各一張，見 globals.css 的 .bagh-bg）。
 * 先前是四條「老虎追羊」飾帶圍成畫框，四個角與重複的地方接縫很明顯（Zach），
 * 改成一整幅圖、不重複不拼接，就沒有接縫可言。
 *
 * 圖騰鋪在這一層本身（.bagh-bg，重複鋪的圖塊，長頁面也不會被拉大），跟著頁面一起捲。
 * 先前是另一層 fixed 的背景（捲動時圖騰不動），但 iOS 26 Safari 不把 fixed 的東西畫到狀態列與工具列底下，
 * 那兩條只剩番紅花色塊；跟著頁面捲的內容才會出現在那裡（2026-10-25 Zach：「圖騰改成鋪在頁面本身」）。
 * 停在最上面時那兩條還是只有番紅花：狀態列那條 Safari 26 一律只塗 html 的底色（viewport-fit=cover 沒用，
 * env(safe-area-inset-*) 都是 0），工具列那條試過往下多鋪一截圖騰（100lvh − 100svh）也沒接上 ——
 * 同一天 Zach：「好像無解，改回原來」，所以拿掉了。只有加到主畫面打開時頁面才畫得到狀態列底下。
 * 不掛在 html 上：Modal 打開時 body 會變成 fixed（useScrollLock），html 的背景會跳回頂端的位置。
 * 面板外一圈紙色襯邊，跟熱鬧的圖騰隔開；桌機限制寬度置中，兩側露出更多圖騰。
 *
 * - hub：遊戲首頁、page：規則頁 —— 四周留多一點
 * - play：對局、選邊、連線 —— 四周留少一點，把空間讓給棋盤
 *
 * 平台 logo 與聯絡／語言放在面板頂列（BaghHeader），不疊在背景上（Zach：不要直接埋在哪裡）。
 */
export default function BaghFrame({ variant = 'hub', className = '', children }: {
  variant?: 'hub' | 'play' | 'page';
  className?: string;
  children: React.ReactNode;
}) {
  const pad = variant === 'play' ? 'p-[clamp(12px,3vw,32px)]' : 'p-[clamp(16px,4.5vw,48px)]';
  return (
    <div className={`bagh-root bagh-bg relative isolate flex min-h-dvh flex-col items-center font-[family-name:var(--font-app)] text-tile-ink ${pad}`}>
      <div className={`flex w-full min-w-0 max-w-[1240px] flex-1 flex-col rounded-2xl border-[3px] border-[#5b6620] bg-[#fbf4e1] shadow-[0_0_0_6px_#fbf4e1] ${className}`}>
        {children}
      </div>
    </div>
  );
}
