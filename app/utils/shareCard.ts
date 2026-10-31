import { CARD_SIZE, type CardLayout } from './resultCard';

/**
 * 各遊戲自己的結算分享圖的共用零件（Wall Go 的那張在 resultCard.ts，畫法不動）。
 *
 * Zach 10/24：「大家可以參考我希望 Wall Go 做的事 —— 遊戲音效、棋子之間的互動、結尾的可分享畫面，然後各自設計符合各自」。
 * 所以這裡只有「怎麼畫」的工具（canvas、字、QR），**長什麼樣子由各遊戲自己畫**：顏色、版面、裝飾都從那款的原件來。
 *
 * 版面座標一律以 1080 寬為準，縮放交給 ctx.scale（預覽另外照顯示大小畫一張，見 useShareCard）。
 */
export { CARD_SIZE, type CardLayout };

/** 畫好的圖要用到、但得先非同步載好的東西 */
export type ShareAssets = {
  /** QR code 的格子（uqr 的 encode().data），掃了到那款遊戲的首頁 */
  qr: boolean[][];
  /** 那款遊戲的 favicon（useShareCard 的 icon，預設 public/icon-192.png）。沒載到就是 undefined */
  icon?: HTMLImageElement;
  /** 那款遊戲要的其他圖（棋子圖、主視覺），照 useShareCard 的 images 順序，載不到的是 undefined */
  images: (HTMLImageElement | undefined)[];
};

export type ShareDraw = (ctx: CanvasRenderingContext2D, layout: CardLayout, assets: ShareAssets) => void;

/** 開一張這個比例的 canvas，畫完回傳。scale < 1 是畫面上的預覽 */
export function renderCard(draw: ShareDraw, layout: CardLayout, assets: ShareAssets, scale = 1): HTMLCanvasElement {
  const { w, h } = CARD_SIZE[layout];
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  draw(ctx, layout, assets);
  return canvas;
}

/** 圓角矩形的路徑。不用 ctx.roundRect —— iOS 15 的 Safari 沒有 */
export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

export function fillBox(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number, r = 0) {
  ctx.fillStyle = color;
  if (r) { roundRect(ctx, x, y, w, h, r); ctx.fill(); } else ctx.fillRect(x, y, w, h);
}

/**
 * 寫一行字，太長就縮小到放得下（最小 min）。回傳實際用的字級。
 * 標題在英文、泰文會比中文長很多，寫死字級一定有語系會爆出去。family 是完整的 CSS font-family。
 */
export function fitText(
  ctx: CanvasRenderingContext2D, family: string, s: string, x: number, y: number,
  o: { size: number; weight?: number | string; color: string; max?: number; min?: number; align?: CanvasTextAlign; alpha?: number; style?: string },
): number {
  let size = o.size;
  const weight = o.weight ?? 900;
  const font = (px: number) => `${o.style ? `${o.style} ` : ''}${weight} ${px}px ${family}`;
  ctx.font = font(size);
  if (o.max) {
    const min = o.min ?? Math.round(size * 0.5);
    while (size > min && ctx.measureText(s).width > o.max) {
      size -= 2;
      ctx.font = font(size);
    }
  }
  ctx.fillStyle = o.color;
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
  ctx.globalAlpha = 1;
  return size;
}

/** QR code：底色方塊（paper）上畫墨色的格子 */
export function drawQr(ctx: CanvasRenderingContext2D, qr: boolean[][], x: number, y: number, size: number, ink: string, paper: string, radius = size * 0.08) {
  const pad = size * 0.08;
  fillBox(ctx, paper, x, y, size, size, radius);
  const n = qr.length;
  const m = (size - pad * 2) / n;
  ctx.fillStyle = ink;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      // 稍微多畫一點點，相鄰的格子才不會在縮放後透出細縫
      if (qr[r][c]) ctx.fillRect(x + pad + c * m, y + pad + r * m, m + 0.5, m + 0.5);
    }
  }
}

/** 站的圖示＋站名，一行。回傳寫完後的右緣 x */
export function drawBrand(ctx: CanvasRenderingContext2D, family: string, assets: ShareAssets, brand: string, x: number, y: number, o: { size: number; color: string; max: number; weight?: number | string }) {
  let tx = x;
  if (assets.icon) {
    const side = Math.round(o.size * 1.25);
    ctx.drawImage(assets.icon, x, Math.round(y - o.size * 0.38 - side / 2), side, side);
    tx = x + side + Math.round(o.size * 0.3);
  }
  const size = fitText(ctx, family, brand, tx, y, { size: o.size, color: o.color, max: o.max - (tx - x), weight: o.weight });
  ctx.font = `${o.weight ?? 900} ${size}px ${family}`;
  return tx + ctx.measureText(brand).width;
}
