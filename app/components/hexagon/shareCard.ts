import { CELL_POS, LINES } from '@/games/hexagon/engine';
import { drawBrand, drawQr, fitText, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { HX } from './palette';

/**
 * 結算分享圖（只有 9:16）：一面磁磚牆 —— 外緣一圈鈷藍邊磚＋一串釉白小六角（跟頁面的 .hx-frame 同一個圖樣）。
 * 由上而下：名字與模式、大大的分數、找到幾組／答錯幾次、每一回合一塊小六角（找完的上鈷藍）、
 * 最後一回合的盤面（數字面，找到的實線、沒找到的虛線，跟對局裡看答案時一樣），最底是站名、出處與 QR。
 */
export type HxCardData = {
  font: string;
  score: number;
  found: number;
  answers: number;
  wrong: number;
  rounds: { found: number; answers: number }[];
  last: { board: number[]; answers: number[]; found: number[] };
  text: { name: string; mode: string; scoreLine: string; stats: string; brand: string; from: string; host: string };
};

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (60 * k - 30);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

/** 一塊磁磚：鈷藍釉邊、青綠細線、釉白（或整片鈷藍） */
function tile(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, solid = false) {
  ctx.fillStyle = HX.cobalt; hexPath(ctx, cx, cy, r); ctx.fill();
  ctx.fillStyle = HX.teal; hexPath(ctx, cx, cy, r * 0.9); ctx.fill();
  ctx.fillStyle = solid ? HX.cobalt : HX.glaze; hexPath(ctx, cx, cy, r * 0.86); ctx.fill();
}

export function drawHxCard(d: HxCardData) {
  return (ctx: CanvasRenderingContext2D, _layout: CardLayout, a: ShareAssets) => {
    const W = 1080, H = 1920, B = 44;
    ctx.fillStyle = HX.glaze; ctx.fillRect(0, 0, W, H);
    // 外緣的邊磚與一串小六角
    ctx.fillStyle = HX.cobalt;
    ctx.fillRect(0, 0, W, B); ctx.fillRect(0, H - B, W, B); ctx.fillRect(0, 0, B, H); ctx.fillRect(W - B, 0, B, H);
    ctx.fillStyle = HX.glaze;
    const step = 44;
    for (let x = B / 2; x < W; x += step) { hexPath(ctx, x, B / 2, 8); ctx.fill(); hexPath(ctx, x, H - B / 2, 8); ctx.fill(); }
    for (let y = B / 2 + step; y < H - step / 2; y += step) { hexPath(ctx, B / 2, y, 8); ctx.fill(); hexPath(ctx, W - B / 2, y, 8); ctx.fill(); }
    ctx.strokeStyle = HX.teal; ctx.lineWidth = 3; ctx.strokeRect(B + 6, B + 6, W - 2 * B - 12, H - 2 * B - 12);

    const cx = W / 2, max = W - 2 * B - 120;
    fitText(ctx, d.font, d.text.name, cx, 210, { size: 84, color: HX.cobalt, align: 'center', max });
    fitText(ctx, d.font, d.text.mode, cx, 290, { size: 40, weight: 700, color: HX.ink, align: 'center', max, alpha: 0.8 });
    fitText(ctx, d.font, d.text.scoreLine, cx, 520, { size: 200, color: HX.ink, align: 'center', max });
    fitText(ctx, d.font, d.text.stats, cx, 610, { size: 44, weight: 700, color: HX.ink, align: 'center', max, alpha: 0.85 });

    // 每一回合一塊小六角：找完的整片鈷藍，其他的寫「找到／總數」
    const n = d.rounds.length;
    const r = n > 5 ? 44 : 56;
    const gap = r * 1.85;
    d.rounds.forEach((rd, i) => {
      const x = cx + (i - (n - 1) / 2) * gap;
      const y = 740;
      const all = rd.found === rd.answers;
      tile(ctx, x, y, r, all);
      ctx.font = `900 ${Math.round(r * 0.58)}px ${d.font}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = all ? HX.glaze : HX.ink;
      ctx.fillText(`${rd.found}/${rd.answers}`, x, y + 2);
    });
    ctx.textBaseline = 'alphabetic';

    // 最後一回合的盤面
    const s = 84, w = Math.sqrt(3) * s;
    const ox = cx - 2.5 * w, oy = 880;
    const center = (i: number) => {
      const { row, col } = CELL_POS[i];
      return { x: ox + (Math.abs(row - 2) * 0.5 + col + 0.5) * w, y: oy + row * 1.5 * s + s };
    };
    CELL_POS.forEach((_, i) => {
      const { x, y } = center(i);
      tile(ctx, x, y, s * 0.96);
      ctx.font = `900 ${Math.round(s * 0.78)}px ${d.font}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = HX.ink;
      ctx.fillText(String(d.last.board[i]), x, y + 3);
    });
    ctx.textBaseline = 'alphabetic';
    ctx.lineCap = 'round';
    d.last.answers.forEach((l) => {
      const [p, , q] = LINES[l].map(center);
      const found = d.last.found.includes(l);
      ctx.globalAlpha = found ? 0.78 : 0.95;
      ctx.strokeStyle = found ? HX.cobalt : HX.teal;
      ctx.lineWidth = found ? 16 : 10;
      ctx.setLineDash(found ? [] : [14, 18]);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    // 站名、出處、QR
    const qr = 200, y0 = H - B - 70 - qr, x0 = B + 70;
    drawBrand(ctx, d.font, a, d.text.brand, x0, y0 + qr / 2 - 12, { size: 44, color: HX.ink, max: W - 2 * B - 140 - qr - 30 });
    fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, x0, y0 + qr / 2 + 50, { size: 30, weight: 700, color: HX.ink, max: W - 2 * B - 140 - qr - 30, alpha: 0.7 });
    drawQr(ctx, a.qr, W - B - 70 - qr, y0, qr, HX.ink, HX.glaze, 0);
  };
}
