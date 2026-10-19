/**
 * Time Auction 的主色：酒紅 #5a1422 —— 跟平台首頁的遊戲卡片、主視覺（key-art.webp 的底色）同一個色，
 * 從卡片點進來，落地還是同一塊顏色。
 *
 * 先寫成 Tailwind 的任意值：第二批五款同時開發，這一版不動共用的 globals.css／tailwind.config。
 * 正式上線前建議收進 globals.css（例如 --tile-burgundy），這裡改成 bg-tile-burgundy。
 *
 * 量過的數字：OKLCH L 0.32、彩度 0.10 —— 低於全站 0.125 的下限，跟森綠磁磚一樣是已知例外
 * （為了接上主視覺的底色）。米白字 12.6:1。深墨跟它只有 1.4:1，所以「按住中」與「可以按」
 * 不靠深墨對酒紅來分，改用按下去的縮放、外圈與文字。
 */
export const KEY_BG = 'bg-[#5a1422]';
export const KEY_TEXT = 'text-[#5a1422]';
export const KEY_RING = 'ring-[#5a1422]/20';

/** 主視覺（由平台那邊提供；檔案不在時色塊照樣成立，所以用背景圖而不是 <img>） */
export const KEY_ART = '/games/time-auction/key-art.webp';
