import { isRedSuit, rankLabel, type Card } from '@/games/question-and-truth/engine';
import { drawBrand, drawQr, fillBox, fitText, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { QT } from './palette';

/**
 * 每日一手的結算分享圖（只有 9:16，同騎士巡遊、六角數字盤）：〈方塊 A 的老千〉的黑底、外緣一圈珍珠。
 * 由上而下：名字與日期、大大的枚數、問了幾題／說錯幾次、每一題一小張牌（寫題號，說錯真相是一張朱紅牌）—— 像 Wordle 那排格子，
 * 看得出問法但看不出答案；然後是翻開的那 8 張、電腦示範的枚數，最底是站名、出處與 QR。
 */
export type QtCardData = {
  font: string;
  /** 每一步：題號 1–11，或 0＝說錯的真相、-1＝說中 */
  steps: number[];
  hand: Card[];
  text: { name: string; date: string; spent: string; stats: string; demo: string | null; brand: string; from: string; host: string };
};

function pearls(ctx: CanvasRenderingContext2D, W: number, H: number, B: number) {
  const r = B * 0.3, step = B * 0.95;
  const pearl = (x: number, y: number) => {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, '#f1eed8'); g.addColorStop(0.55, QT.fg); g.addColorStop(1, '#756f58');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  for (let x = B / 2; x <= W - B / 2 + 1; x += step) { pearl(x, B / 2); pearl(x, H - B / 2); }
  for (let y = B / 2 + step; y < H - B / 2 - step / 2; y += step) { pearl(B / 2, y); pearl(W - B / 2, y); }
}

const SUIT_PATH = [
  'M12 2.5C9.2 6.3 4 9.2 4 13.4a3.9 3.9 0 0 0 6.6 2.8L9.6 21.5h4.8l-1-5.3A3.9 3.9 0 0 0 20 13.4c0-4.2-5.2-7.1-8-10.9z',
  'M12 21s-8.2-5.2-8.2-11.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8.2 2.6C20.2 15.8 12 21 12 21z',
  'M12 2.2l7.2 9.8-7.2 9.8-7.2-9.8z',
  'M12 2.8a3.7 3.7 0 0 0-3.3 5.4 3.7 3.7 0 1 0 1.7 6.4l-1 6.9h5.2l-1-6.9a3.7 3.7 0 1 0 1.7-6.4A3.7 3.7 0 0 0 12 2.8z',
];

function card(ctx: CanvasRenderingContext2D, font: string, c: Card, x: number, y: number, w: number) {
  const h = w * 1.4;
  fillBox(ctx, QT.paper, x, y, w, h, w * 0.08);
  const color = isRedSuit(c.suit) ? QT.red : QT.ink;
  ctx.font = `900 ${Math.round(w * 0.46)}px ${font}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
  ctx.fillText(rankLabel(c.rank), x + w / 2, y + h * 0.38);
  ctx.save();
  const s = w * 0.36 / 24;
  ctx.translate(x + w / 2 - 12 * s, y + h * 0.62);
  ctx.scale(s, s);
  ctx.fill(new Path2D(SUIT_PATH[c.suit]));
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

const CIRCLED = ['', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪'];

export function drawQtCard(d: QtCardData) {
  return (ctx: CanvasRenderingContext2D, _layout: CardLayout, a: ShareAssets) => {
    const W = 1080, H = 1920, B = 40;
    ctx.fillStyle = QT.page; ctx.fillRect(0, 0, W, H);
    pearls(ctx, W, H, B);
    const cx = W / 2, max = W - 2 * B - 120;
    // 整塊往下放一點，跟最底的站名之間不留一大片空（題目多到兩排時少放一點）
    const oy = d.steps.length > 8 ? 70 : 150;
    fitText(ctx, d.font, d.text.name, cx, 220 + oy, { size: 92, color: QT.fg, align: 'center', max });
    fitText(ctx, d.font, d.text.date, cx, 300 + oy, { size: 44, weight: 700, color: QT.gold, align: 'center', max });
    fitText(ctx, d.font, d.text.spent, cx, 540 + oy, { size: 190, color: QT.fg, align: 'center', max });
    fitText(ctx, d.font, d.text.stats, cx, 630 + oy, { size: 44, weight: 700, color: QT.fg, align: 'center', max, alpha: 0.85 });

    // 每一步一小張牌（一排最多 8 張）
    const n = d.steps.length;
    const per = 8, w = 86, gap = 18, rows = Math.ceil(n / per);
    d.steps.forEach((st, i) => {
      const row = Math.floor(i / per), inRow = Math.min(per, n - row * per);
      const x = cx - (inRow * w + (inRow - 1) * gap) / 2 + (i % per) * (w + gap);
      const y = 700 + oy + row * (w * 1.25 + gap);
      const solved = st === -1;
      fillBox(ctx, st === 0 ? QT.red : solved ? QT.gold : QT.paper, x, y, w, w * 1.25, 10);
      const mx = x + w / 2, my = y + w * 0.625;
      if (st > 0) {
        ctx.font = `900 50px ${d.font}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = QT.ink;
        ctx.fillText(CIRCLED[st], mx, my);
      } else {
        // 打勾／打叉用畫的（字型裡的 ✓ 在明朝體是一個歪的根號）
        ctx.save();
        ctx.strokeStyle = st === 0 ? '#f1eed8' : QT.ink; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        if (st === 0) { ctx.moveTo(mx - 16, my - 16); ctx.lineTo(mx + 16, my + 16); ctx.moveTo(mx + 16, my - 16); ctx.lineTo(mx - 16, my + 16); }
        else { ctx.moveTo(mx - 20, my); ctx.lineTo(mx - 6, my + 15); ctx.lineTo(mx + 20, my - 17); }
        ctx.stroke();
        ctx.restore();
      }
    });
    ctx.textBaseline = 'alphabetic';

    // 那一手（說中才翻開）
    const top = 700 + oy + rows * (w * 1.25 + gap) + 70;
    const cw = 104, cg = 12;
    const ox = cx - (8 * cw + 7 * cg) / 2;
    fillBox(ctx, QT.table, ox - 28, top - 28, 8 * cw + 7 * cg + 56, cw * 1.4 + 56, 18);
    d.hand.forEach((c, i) => card(ctx, d.font, c, ox + i * (cw + cg), top, cw));
    if (d.text.demo) fitText(ctx, d.font, d.text.demo, cx, top + cw * 1.4 + 110, { size: 42, weight: 700, color: QT.gold, align: 'center', max });

    const qr = 200, y0 = H - B - 70 - qr, x0 = B + 70;
    drawBrand(ctx, d.font, a, d.text.brand, x0, y0 + qr / 2 - 12, { size: 44, color: QT.fg, max: W - 2 * B - 140 - qr - 30 });
    fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, x0, y0 + qr / 2 + 50, { size: 30, weight: 700, color: QT.fg, max: W - 2 * B - 140 - qr - 30, alpha: 0.7 });
    drawQr(ctx, a.qr, W - B - 70 - qr, y0, qr, QT.ink, QT.paper, 0);
  };
}
