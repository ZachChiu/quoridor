import type React from 'react';

/**
 * 虎羊棋的整頁畫框（2026-10-20 Zach 選的「整頁圖騰」平均版）：番紅花色的四邊飾帶圍著紙色面板，
 * 虎羊棋的每一頁都包在這裡面。
 *
 * 飾帶的長相照那張印刷棋盤（board-art.webp 的外框）：一整片連續的番紅花底色上，一隻隻完整的
 * 老虎、羊與花樹平均排開 —— 圖案是從 board-art 外框一隻隻摳出來的（去掉底色），
 * 組成橫條用（band-h：花、往右跑的老虎、小樹、跳羊）與直條用（band-v：花、直立的老虎、樹、跳羊）兩種圖塊，
 * 四個角各一株花（band-corner）。
 *
 * 先前是把整條插畫重複接起來、左右轉 90°，每段之間與四個角都有明顯的接線（Zach）。
 * 現在圖塊之間只有底色：background-repeat: space 只放整數個、多的空間平均分在中間，
 * 永遠不會切到半隻動物，任何畫面尺寸都一樣乾淨。
 *
 * 四邊繞著頁面追：上邊往右、下邊往左（鏡射）；左右兩邊的圖案是直立的，右邊鏡射讓動物面朝內。
 *
 * - hub：遊戲首頁、page：規則頁 —— 飾帶粗
 * - play：對局、選邊、連線 —— 飾帶細，把空間讓給棋盤
 *
 * 平台 logo 與聯絡／語言不疊在畫框上（Zach：不要直接埋在哪裡），放在面板裡的頂列（BaghHeader）。
 * 底色寫在 .bagh-root 上，globals.css 依它把 html／body 也換成番紅花，捲到底或回彈時才不會露出奶油色。
 */
export default function BaghFrame({ variant = 'hub', className = '', children }: {
  variant?: 'hub' | 'play' | 'page';
  className?: string;
  children: React.ReactNode;
}) {
  // 上下的粗細看畫面高、左右看畫面寬：手機很窄，兩側要細一點，面板才放得下對局頁頂排與狀態卡
  const play = variant === 'play';
  const row = play ? 'clamp(24px, 3.4dvh, 34px)' : 'clamp(34px, 5.4dvh, 52px)';
  const col = play ? 'clamp(16px, 4.4vw, 34px)' : 'clamp(24px, 6.6vw, 52px)';
  return (
    <div className="bagh-root flex min-h-dvh flex-col bg-[#e3a43c] p-[5px] font-[family-name:var(--font-app)] text-tile-ink">
      <div className="grid flex-1 overflow-hidden rounded-[18px] border-[3px] border-[#5b6620] bg-[#e3a43c]"
        style={{ gridTemplateColumns: `${col} minmax(0, 1fr) ${col}`, gridTemplateRows: `${row} 1fr ${row}` }}>
        <Corner />
        <Band dir="h" />
        <Corner />
        <Band dir="v" />
        <div className={`flex min-w-0 flex-col rounded-xl border-[3px] border-[#5b6620] bg-[#fbf4e1] ${className}`}>
          {children}
        </div>
        <Band dir="v" flip />
        <Corner />
        <Band dir="h" flip />
        <Corner />
      </div>
    </div>
  );
}

/**
 * 一條飾帶：番紅花底上平均排開的圖塊。橫條的圖塊高度佔 82%、直條的寬度佔 82%，
 * 沿著長邊方向 space（整數個、空間平均分配），另一個方向不重複。
 */
function Band({ dir, flip = false }: { dir: 'h' | 'v'; flip?: boolean }) {
  const style: React.CSSProperties = dir === 'h'
    ? { backgroundImage: 'url(/games/bagh-chal/band-h.webp)', backgroundSize: 'auto 82%', backgroundRepeat: 'space no-repeat', backgroundPosition: 'center' }
    : { backgroundImage: 'url(/games/bagh-chal/band-v.webp)', backgroundSize: '82% auto', backgroundRepeat: 'no-repeat space', backgroundPosition: 'center' };
  if (flip) style.transform = 'scaleX(-1)';
  return <div aria-hidden="true" className="min-h-0 min-w-0" style={style} />;
}

/** 四個角：一株花 */
function Corner() {
  // 角落不一定是正方形（左右與上下粗細不同），花用 contain 等比例縮放
  return <div aria-hidden="true" className="bg-[url('/games/bagh-chal/band-corner.webp')] bg-contain bg-center bg-no-repeat" />;
}
