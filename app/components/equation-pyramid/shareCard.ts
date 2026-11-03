import { OP_GLYPH, LETTERS, rowsOf, type Block, type Size } from '@/games/equation-pyramid/engine';
import { drawBrand, drawQr, fitText, roundRect, type CardLayout, type ShareAssets } from '@/utils/shareCard';
import { EP } from './palette';

/**
 * 結算分享圖（只有 9:16）：一面彩陶牆 —— 外緣一圈小彩陶磚（跟頁面的 .ep-frame 同一個圖樣），石灰白的底。
 * 由上而下：名字與模式、大大的結果（節目規則是「12 : 9」＋獲勝／惜敗、找齊模式是「找到 7 / 7 組」）、一行統計、
 * 節目規則每一回合一塊小磚（寫那回合自己答對幾組）、最後一盤的金字塔（數字面）＋目標數，最底是站名、出處與 QR。
 */
export type EpCardData = {
  font: string;
  result: string;
  verdict: string;
  stats: string;
  /** 每一回合自己答對幾組／共幾組（節目規則才有） */
  rounds: { me: number; answers: number }[];
  last: { blocks: Block[]; target: number };
  text: { name: string; mode: string; targetLabel: string; brand: string; from: string; host: string };
};

/** 一塊彩陶磚：上緣圓、下緣方，上亮下深 */
function brick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, solid?: string) {
  const r = Math.min(w, h) * 0.2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  if (solid) ctx.fillStyle = solid;
  else {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, EP.light); g.addColorStop(0.46, EP.faience); g.addColorStop(1, EP.deep);
    ctx.fillStyle = g;
  }
  ctx.fill();
}

export function drawEpCard(d: EpCardData) {
  return (ctx: CanvasRenderingContext2D, _layout: CardLayout, a: ShareAssets) => {
    const W = 1080, H = 1920, B = 48;
    ctx.fillStyle = EP.lime; ctx.fillRect(0, 0, W, H);
    // 外緣一圈小磚
    const cols = [EP.deep, EP.faience, EP.light, EP.faience];
    let k = 0;
    const step = 48;
    for (let x = 0; x < W; x += step) { brick(ctx, x + 6, 6, step - 12, B - 12, cols[k++ % 4]); brick(ctx, x + 6, H - B + 6, step - 12, B - 12, cols[k++ % 4]); }
    for (let y = step; y < H - step; y += step) { brick(ctx, 6, y + 6, B - 12, step - 12, cols[k++ % 4]); brick(ctx, W - B + 6, y + 6, B - 12, step - 12, cols[k++ % 4]); }

    const cx = W / 2, max = W - 2 * B - 120;
    fitText(ctx, d.font, d.text.name, cx, 210, { size: 84, color: EP.deep, align: 'center', max });
    fitText(ctx, d.font, d.text.mode, cx, 290, { size: 40, weight: 700, color: EP.ink, align: 'center', max, alpha: 0.8 });
    fitText(ctx, d.font, d.result, cx, 500, { size: 190, color: EP.ink, align: 'center', max });
    let y = 590;
    if (d.verdict) { fitText(ctx, d.font, d.verdict, cx, y, { size: 56, color: EP.deep, align: 'center', max }); y += 70; }
    fitText(ctx, d.font, d.stats, cx, y, { size: 42, weight: 700, color: EP.ink, align: 'center', max, alpha: 0.85 });

    // 節目規則：每一回合一塊小磚，寫自己答對幾組；全部是自己答的上深釉
    const by = y + 50;
    if (d.rounds.length) {
      const n = d.rounds.length, bw = 78, gap = 12;
      const x0 = cx - (n * bw + (n - 1) * gap) / 2;
      d.rounds.forEach((r, i) => {
        const all = r.me === r.answers;
        brick(ctx, x0 + i * (bw + gap), by, bw, 70, all ? EP.deep : undefined);
        ctx.font = `900 30px ${d.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = EP.lime;
        ctx.fillText(`${r.me}/${r.answers}`, x0 + i * (bw + gap) + bw / 2, by + 38);
      });
      ctx.textBaseline = 'alphabetic';
    }

    // 最後一盤的金字塔
    const size = d.last.blocks.length as Size;
    const rows = rowsOf(size);
    const bw = size === 10 ? 170 : 140, bh = bw * 0.8, gp = 12;
    // 沒有回合那一排（找齊模式）就往上靠；最低不能壓到底下的站名與 QR
    const top = Math.min(d.rounds.length ? by + 130 : by + 40, 830);
    d.last.blocks.forEach((b, i) => {
      const r = rows.findIndex((_, rr) => i < ((rr + 1) * (rr + 2)) / 2);
      const c = i - (r * (r + 1)) / 2;
      const rowW = (r + 1) * bw + r * gp;
      const x = cx - rowW / 2 + c * (bw + gp), yy = top + r * (bh + gp);
      brick(ctx, x, yy, bw, bh);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(bw * 0.17)}px ${d.font}`; ctx.fillStyle = EP.glaze;
      ctx.fillText(LETTERS[i], x + bw * 0.16, yy + bh * 0.2);
      ctx.font = `900 ${Math.round(bw * 0.36)}px ${d.font}`; ctx.fillStyle = EP.lime;
      ctx.fillText(`${OP_GLYPH[b.op]}${b.n}`, x + bw / 2, yy + bh * 0.56);
    });
    ctx.textBaseline = 'alphabetic';
    const below = top + rows.length * (bh + gp) + 20;
    roundRect(ctx, cx - 150, below, 300, 92, 20); ctx.fillStyle = EP.deep; ctx.fill();
    fitText(ctx, d.font, `${d.text.targetLabel} ${d.last.target}`, cx, below + 64, { size: 46, color: EP.lime, align: 'center', max: 280 });

    // 站名、出處、QR
    const qr = 200, y0 = H - B - 70 - qr, x0 = B + 70;
    drawBrand(ctx, d.font, a, d.text.brand, x0, y0 + qr / 2 - 12, { size: 44, color: EP.ink, max: W - 2 * B - 140 - qr - 30 });
    fitText(ctx, d.font, `${d.text.from} · ${d.text.host}`, x0, y0 + qr / 2 + 50, { size: 30, weight: 700, color: EP.ink, max: W - 2 * B - 140 - qr - 30, alpha: 0.7 });
    drawQr(ctx, a.qr, W - B - 70 - qr, y0, qr, EP.ink, EP.lime, 0);
  };
}
