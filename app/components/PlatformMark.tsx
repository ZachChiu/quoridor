/**
 * 平台的標誌：長角的藍色骰子（「骰子惡魔 1」，2026-10-20 試套；品牌名還沒定）。
 *
 * 原圖是 AI 畫的點陣圖，描成向量放在 public/brand/die-mark.svg：點數是一層奶油色、
 * 墊在藍色骰子底下（藍色那層的點數是鏤空的），深底、奶油底上點數都是奶油色，
 * 小尺寸也不會在兩層之間露縫。
 *
 * 每一頁都在同一個位置（左上）、同一個樣子（Zach：平台名都同一邊一個 ICON）：
 * 遊戲首頁只放圖示（40px，跟右上角的圓鈕一樣大），平台首頁在圖示右邊多帶名字。
 * 骰子本身的剪影就夠辨認，所以不再墊圓底。
 *
 * `mono`：各遊戲頁用的單色版（2026-10-25 Zach 從「縮小／縮小＋單色／斜放」裡要「現在的大小＋單色」）——
 * 大小位置不變，換成灰階、半透明，不跟那款自己的配色搶。平台自己的頁面（首頁、季目錄、404）照舊是藍色。
 * 灰色是另一張圖 die-mark-gray.svg（顏色照比較圖上的 grayscale＋brightness＋contrast 算好寫死），
 * 不在 <img> 上加 filter —— iPhone 會漏畫（虎棋圓牌踩過）。
 */
export default function PlatformMark({ className = '', mono = false }: { className?: string; mono?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 靜態匯出、SVG，不需要 next/image
    <img src={mono ? '/brand/die-mark-gray.svg' : '/brand/die-mark.svg'} alt="" aria-hidden="true" width={40} height={40}
      className={`size-10 shrink-0 ${mono ? 'opacity-50' : ''} ${className}`} />
  );
}
