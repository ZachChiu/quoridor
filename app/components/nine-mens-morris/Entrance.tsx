import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import MorrisWordmark from './MorrisWordmark';

/**
 * 九子棋的進場：翻開《遊戲之書》—— 一頁手抄本從左邊書背那一側翻下來、平貼住畫面；
 * 換好頁再從右緣掀起、往左翻走，底下就是遊戲（遊戲首頁本身就是這一頁的樣子）。
 *
 * 那一頁是九子棋自己的樣子：最外緣朱紅框（.nmm-frame）、群青底撒細白點（.nmm-field）、哥德字標（向量）、
 * 《遊戲之書》（1283）的插圖 —— 平台卡片用的就是這張圖，點進來時已經在快取裡。
 * 頁面朝觀眾掀（右緣往前、往左），越掀越暗；書背那一側有一道摺痕的陰影。跟虎羊棋的窗門相反：窗門是往畫面裡推開。
 * 只動 transform／opacity（見 components/entrances.ts）。
 */

const ART = '/games/nine-mens-morris/libro.webp';
/** 掀起來的角度：過了 90° 背面朝外，backface-visibility 讓它消失；多轉一點收得乾淨 */
const LIFTED = 'rotateY(-100deg)';
const FLAT = 'rotateY(0deg)';
/** 掀到一半時那一頁有多暗 */
const SHADE = 0.5;

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    // 透視跟頁寬成比例：頁面朝觀眾掀，右緣會靠過來 —— 透視距離小於頁寬會穿過鏡頭、畫面爆開（桌機最明顯）；
    // 太大（先前用畫面高度的 2.4 倍）又看不出靠近，像被壓扁。2.2 倍頁寬時，掀到 60° 右緣放大約 1.6 倍
    <div className="absolute inset-0" style={{ perspective: 'calc(100vw * 2.2)' }}>
      <div
        data-page
        className="nmm-frame nmm-field absolute inset-0 flex flex-col items-center justify-center gap-[2.6vh] px-[8%] text-[#eee0c4]"
        // 第一格就給對：翻下來之前是掀著的、翻走之前是平貼的（見 EntranceScene 的說明）
        style={{ transformOrigin: 'left center', backfaceVisibility: 'hidden', willChange: 'transform', transform: covered ? FLAT : LIFTED }}
      >
        <MorrisWordmark className="h-auto w-[min(84%,26rem)]" />
        {/* eslint-disable-next-line @next/next/no-img-element -- 轉場層裡的裝飾圖，平台卡片已經載過 */}
        <img src={ART} alt="" decoding="sync" className="max-h-[48vh] w-[min(88%,560px)] object-contain" />
        {/* 書背的摺痕 */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[8%] bg-gradient-to-r from-black/30 to-transparent" />
        <div data-shade className="pointer-events-none absolute inset-0 bg-[#1e120a]" style={{ opacity: covered ? 0 : SHADE }} />
      </div>
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const page = root.querySelector<HTMLElement>('[data-page]');
  const shade = root.querySelector<HTMLElement>('[data-shade]');
  if (!page || !shade) return [];
  const o: KeyframeAnimationOptions = phase === 'cover'
    // 放下一頁紙：一開始慢、中段快、貼到紙面前輕輕收住
    ? { duration: 620, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both' }
    // 翻走：手指一撥就快，翻過去之後慢慢落下
    : { duration: 780, delay: 60, easing: 'cubic-bezier(0.35, 0, 0.25, 1)', fill: 'both' };
  const [from, to] = phase === 'cover' ? [LIFTED, FLAT] : [FLAT, LIFTED];
  const [s0, s1] = phase === 'cover' ? [SHADE, 0] : [0, SHADE];
  return [
    page.animate([{ transform: from }, { transform: to }], o),
    shade.animate([{ opacity: s0 }, { opacity: s1 }], o),
  ];
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
