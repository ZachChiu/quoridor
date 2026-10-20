import type React from 'react';

/**
 * 虎羊棋的整頁背景與紙色面板。虎羊棋的每一頁都包在這裡面。
 *
 * 背景是一整幅滿版的米提拉圖騰（AI 畫的，手機直式、桌機橫式各一張，見 globals.css 的 .bagh-bg）。
 * 先前是四條「老虎追羊」飾帶圍成畫框，四個角與重複的地方接縫很明顯（Zach），
 * 改成一整幅圖、不重複不拼接，就沒有接縫可言。
 *
 * 背景層是 fixed、跟畫面一樣大（上下各多蓋一段，見 .cover-viewport）：規則頁這種長頁面
 * 背景也不會被拉大變糊，捲動時圖騰不動、只有面板在走。
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
    <div className={`bagh-root relative isolate flex min-h-dvh flex-col items-center font-[family-name:var(--font-app)] text-tile-ink ${pad}`}>
      <div aria-hidden="true" className="bagh-bg cover-viewport -z-10" />
      <div className={`flex w-full min-w-0 max-w-[1240px] flex-1 flex-col rounded-2xl border-[3px] border-[#5b6620] bg-[#fbf4e1] shadow-[0_0_0_6px_#fbf4e1] ${className}`}>
        {children}
      </div>
    </div>
  );
}
