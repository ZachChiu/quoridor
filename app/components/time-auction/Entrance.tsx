import { GiGavel } from 'react-icons/gi';
import type { EntranceScene } from '@/components/entrances';
import type { WipePhase } from '@/components/WipeOverlay';
import { KEY_ART } from './theme';
import TauWordmark from './TauWordmark';

/**
 * 時間拍賣的進場：一張拍賣傳單「啪」地拍下來，落定時中間蓋一個紅色木槌章；換好頁再整張往上撕走，露出遊戲。
 *
 * 傳單就是這款自己的樣子：報紙色的紙、紅色牛津角框（.tau-frame）、肥臉體的「TIME AUCTION」字標（向量，不載字型）、
 * Cruikshank〈Sales by Auction〉（1819）的拍賣場 —— 平台卡片用的就是這張圖，點進來時已經在快取裡。章跟對局裡得標的章同一種（紅框、斜 7°、印泥疊在紙上）。
 * 只動 transform／opacity（見 components/entrances.ts）。
 */

/**
 * 傳單還沒拍下來：剛好在畫面上緣外面、微微歪著。不能藏太高 —— 落下是先慢後快，藏高了點下去會有
 * 三分之一秒什麼都沒動（放慢錄影量到的），按起來像沒按到；貼著上緣的話影子跟一角馬上就探進來。
 */
const HIDDEN = 'translateY(-101%) rotate(-2.5deg)';
/** 撕走之後：往上、往左歪 */
const GONE = 'translateY(-112%) rotate(-3deg)';
const STAMP_TILT = 'rotate(-7deg)';

function Scene({ phase }: { phase: WipePhase }) {
  const covered = phase === 'uncover';
  return (
    <div
      data-bill
      className="tau-frame absolute inset-0 flex items-center justify-center bg-[#ebe1b8] shadow-[0_24px_48px_rgb(0_0_0/0.35)]"
      // 第一格就給對：拍下來之前在畫面外、撕走之前蓋滿（見 EntranceScene 的說明）
      style={{ transform: covered ? 'none' : HIDDEN, willChange: 'transform' }}
    >
      <div className="relative flex w-[min(84%,600px)] flex-col items-center gap-[2.2vh]">
        <TauWordmark className="w-full text-[#35331c]" />
        {/* 字標與版畫之間、版畫底下各一道雙線，跟拍賣目錄的分隔線同一種 */}
        <span className="block h-[5px] w-full border-y border-[#35331c]" />
        {/* eslint-disable-next-line @next/next/no-img-element -- 轉場層裡的裝飾圖，平台卡片已經載過 */}
        <img src={KEY_ART} alt="" decoding="sync" className="max-h-[46vh] w-full border border-[#35331c] object-contain mix-blend-multiply" />
        <span className="block h-[5px] w-full border-y border-[#35331c]" />
        <span
          data-stamp
          className="absolute bottom-[14%] right-[-5%] rounded-[6px] border-[3px] border-[#92383a] p-[5px] text-[clamp(52px,15vw,92px)] text-[#92383a] mix-blend-multiply"
          style={{ transform: STAMP_TILT, opacity: covered ? 0.92 : 0 }}
        >
          <span className="grid place-items-center rounded-[3px] border border-[#92383a] p-[0.12em]">
            <GiGavel aria-hidden="true" />
          </span>
        </span>
      </div>
    </div>
  );
}

function play(root: HTMLElement, phase: WipePhase): Animation[] {
  const bill = root.querySelector<HTMLElement>('[data-bill]');
  const stamp = root.querySelector<HTMLElement>('[data-stamp]');
  if (!bill || !stamp) return [];
  if (phase === 'cover') {
    return [
      // 加速落下 → 碰到底彈一下 → 停住：一張紙被拍在佈告欄上
      bill.animate([
        { transform: HIDDEN, easing: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)' },
        { transform: 'translateY(0) rotate(0deg)', offset: 0.74, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)' },
        { transform: 'translateY(-1.2%) rotate(0.25deg)', offset: 0.87, easing: 'cubic-bezier(0.6, 0, 0.8, 0.4)' },
        { transform: 'translateY(0) rotate(0deg)' },
      ], { duration: 520, fill: 'both' }),
      // 紙一落定就蓋章（同對局裡得標的章：從大壓到原大）
      stamp.animate([
        { transform: `${STAMP_TILT} scale(1.9)`, opacity: 0 },
        { transform: `${STAMP_TILT} scale(1)`, opacity: 0.92 },
      ], { duration: 220, delay: 380, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1.25)', fill: 'both' }),
    ];
  }
  // 停一拍讓章看得見，再整張往上撕走
  return [bill.animate([{ transform: 'translateY(0) rotate(0deg)' }, { transform: GONE }], { duration: 640, delay: 160, easing: 'cubic-bezier(0.5, 0, 0.3, 1)', fill: 'both' })];
}

const entrance: EntranceScene = { Scene, play };
export default entrance;
