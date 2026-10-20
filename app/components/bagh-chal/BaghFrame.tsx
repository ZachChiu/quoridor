import type React from 'react';

/**
 * 虎羊棋的整頁畫框（2026-10-20 Zach 選的「整頁圖騰」平均版）：番紅花色的四邊飾帶圍著紙色面板，
 * 虎羊棋的每一頁都包在這裡面。
 *
 * 飾帶的長相照那張印刷棋盤（board-art.webp 的外框）：一整片連續的番紅花底色上，一隻隻完整的
 * 老虎、羊與花樹平均排開 —— 圖案是從 board-art 外框一隻隻摳出來的（去掉底色，m-*.webp），
 * 四個角各一株花（band-corner）。見下方 Band 的說明。
 *
 * 先前是把整條插畫重複接起來、左右轉 90°，每段之間與四個角都有明顯的接線（Zach）。
 * 現在圖案之間只有底色，永遠不會切到半隻動物，任何畫面尺寸都一樣乾淨。
 *
 * - hub：遊戲首頁、page：規則頁 —— 飾帶粗
 * - play：對局、選邊、連線 —— 飾帶細，把空間讓給棋盤
 *
 * 平台 logo 與聯絡／語言不疊在畫框上（Zach：不要直接埋在哪裡），放在面板裡的頂列（BaghHeader）。
 * 三角形圖騰（.bagh-tri）只在整頁最外緣一層；面板四周是印刷棋盤內框那道橄欖綠雙線（.bagh-line）。
 * 先前面板、棋盤、彈窗也都套圖騰，一層套一層太花（2026-10-21 Zach：圖騰只能有一層在最外層，不能一堆）。
 * 底色寫在 .bagh-root 上，globals.css 依它把 html／body 也換成番紅花，捲到底或回彈時才不會露出奶油色。
 */
export default function BaghFrame({ variant = 'hub', className = '', children }: {
  variant?: 'hub' | 'play' | 'page';
  className?: string;
  children: React.ReactNode;
}) {
  // 上下的粗細看畫面高、左右看畫面寬。手機很窄：兩側的直條、外框與面板的三角邊都收細，
  // 上下兩條不佔寬度就維持 —— 畫框的熱鬧靠上下兩條撐，面板才不會被擠窄（Zach：手機板被壓到太窄）
  const play = variant === 'play';
  const row = play ? 'clamp(24px, 3.4dvh, 34px)' : 'clamp(34px, 5.4dvh, 52px)';
  const col = play ? 'clamp(12px, 3.4vw, 34px)' : 'clamp(14px, 4.2vw, 52px)';
  return (
    <div className="bagh-root flex min-h-dvh flex-col bg-[#e3a43c] font-[family-name:var(--font-app)] text-tile-ink md:p-[5px]">
      <div className="bagh-tri grid flex-1 overflow-hidden bg-[#e3a43c]"
        style={{ gridTemplateColumns: `${col} minmax(0, 1fr) ${col}`, gridTemplateRows: `${row} 1fr ${row}`, '--tri': 'clamp(6px, 1.6vw, 12px)' } as React.CSSProperties}>
        <Corner />
        <Band dir="h" size={row} />
        <Corner />
        <Band dir="v" size={col} />
        <div className={`bagh-line flex min-w-0 flex-col bg-[#fbf4e1] ${className}`} style={{ '--line': 'clamp(5px, 1.4vw, 8px)' } as React.CSSProperties}>
          {children}
        </div>
        <Band dir="v" size={col} flip />
        <Corner />
        <Band dir="h" size={row} flip />
        <Corner />
      </div>
    </div>
  );
}

/** 飾帶上的圖案（從 board-art 外框摳出來的），寬高是原圖像素，用來給 aspect-ratio */
const MOTIFS = [
  { name: 'tiger', w: 210, h: 104 },
  { name: 'flower', w: 73, h: 102 },
  { name: 'goat', w: 109, h: 108 },
  { name: 'tree', w: 49, h: 78 },
] as const;
/* 橫條由左到右：老虎、花、羊、樹 —— 羊在老虎前面（往右跑時羊在右邊），是老虎在追羊。
   直條往上跑，「前面」是上面，所以順序反過來；右邊那條轉 180° 之後又正回來。 */
const SEQ_H = Array.from({ length: 28 }, (_, i) => MOTIFS[i % MOTIFS.length]);
const SEQ_V = [...SEQ_H].reverse();

/**
 * 一條飾帶：番紅花底上一隻隻完整的圖案。
 *
 * 不用 background-repeat 鋪整塊圖塊 —— space 會把放不下的那一整塊長度平均分進空隙，
 * 出現一段段空白（Zach：中間會有空白）。改成一隻隻排：flex-wrap 讓放不下的那隻換到下一行
 * （被 overflow 藏起來），留下的這一行用 space-evenly 平均分空間，多出來的不到一隻寬，看不出空白。
 *
 * 直條的圖案是事先轉 90° 的（m-*-v.webp，往上跑、地面朝面板）——直立的那隻老虎看起來怪（Zach），
 * 改成跟橫條同一批會跑的動物、照印刷棋盤沿著邊跑。下邊左右鏡射（動物仍是正的、往左跑），
 * 右邊轉 180°（往下跑、地面朝面板）。
 */
function Band({ dir, size, flip = false }: { dir: 'h' | 'v'; size: string; flip?: boolean }) {
  const h = dir === 'h';
  return (
    <div aria-hidden="true"
      // contain: size —— 飾帶的大小完全由畫框的格線決定，裡面那 28 隻不能反過來把格線撐大
      // （不加的話，直條的內容高度會被算進中間那一列，桌機首頁被撐得比畫面還高、內容被推到下面）
      className={`flex min-h-0 min-w-0 flex-wrap content-start justify-evenly overflow-hidden [contain:size] ${h ? 'flex-row' : 'flex-col'}`}
      style={{
        padding: h ? `calc(${size} * 0.1) 0` : `0 calc(${size} * 0.1)`,
        gap: `calc(${size} * 0.22)`,
        transform: flip ? (h ? 'scaleX(-1)' : 'rotate(180deg)') : undefined,
      }}>
      {(h ? SEQ_H : SEQ_V).map((m, i) => (
        <span key={i} className="shrink-0 bg-contain bg-center bg-no-repeat"
          style={h
            ? { height: `calc(${size} * 0.8)`, aspectRatio: `${m.w} / ${m.h}`, backgroundImage: `url(/games/bagh-chal/m-${m.name}.webp)` }
            : { width: `calc(${size} * 0.8)`, aspectRatio: `${m.h} / ${m.w}`, backgroundImage: `url(/games/bagh-chal/m-${m.name}-v.webp)` }} />
      ))}
    </div>
  );
}

/** 四個角：一株花 */
function Corner() {
  // 角落不一定是正方形（左右與上下粗細不同），花用 contain 等比例縮放
  return <div aria-hidden="true" className="bg-[url('/games/bagh-chal/band-corner.webp')] bg-contain bg-center bg-no-repeat" />;
}
