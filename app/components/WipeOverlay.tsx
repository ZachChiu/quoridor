'use client'
import React, { useEffect, useRef } from 'react';
import type { IconType } from 'react-icons';

export type WipePhase = 'cover' | 'uncover';

/**
 * 轉場的起點。
 *
 * 只有一種形式：你按的那個東西自己脹開成整個畫面，結束時再收回原本的形狀。
 * 一開始做了四種（色帶／快門／磁磚放大／圓形擴散），但同一套動作配上
 * 「起點來自你按的東西」就已經能表達所有情境，多的形式只是多的規則。
 *
 * `from` 帶的是那個東西在畫面上的實際矩形與圓角。有它的話，動畫的
 * 第一格會和那塊磁磚一模一樣 —— 包括圖示與文字 —— 然後才脹開；
 * 沒有的話（例如難度選單那種只有座標的呼叫點）就退回單純的圓。
 */
export type Wipe = {
  x: number;
  y: number;
  color: string;
  /** 起點在畫面上的矩形與圓角，單位 px */
  from?: { width: number; height: number; radius: number };
  /** 起點上的圖示與文字。展開時留在原位，讓人看得出「是從這塊打開的」 */
  icon?: IconType;
  /** 圖示在來源元素上的實際像素高度。用量到的值而不是猜 —— 見下方註解。 */
  iconSize?: number;
  label?: string;
  kicker?: string;
  /** 來源是橫向排列（寬磁磚是圖左字右）還是直向 */
  row?: boolean;
  iconColor?: string;
  fg?: string;
};

interface Props {
  phase: WipePhase;
  wipe: Wipe;
  onDone: () => void;
}

/** 沒有 `from` 時的預設圓直徑。 */
const BASE = 80;

const boxOf = (wipe: Wipe) => ({
  width: wipe.from?.width ?? BASE,
  height: wipe.from?.height ?? BASE,
  radius: wipe.from?.radius ?? BASE / 2,
});

/**
 * 要蓋滿整個視窗需要放大幾倍。
 *
 * 以起點矩形的兩軸分別算，取大的那個 —— 寬磁磚若只照寬度算，
 * 縱向會露出未覆蓋的邊。
 */
function coverScale(wipe: Wipe): number {
  if (typeof window === 'undefined') return 40;
  const { width, height } = boxOf(wipe);
  const dx = Math.max(wipe.x, window.innerWidth - wipe.x);
  const dy = Math.max(wipe.y, window.innerHeight - wipe.y);
  return Math.max((dx * 2) / width, (dy * 2) / height) * 1.08;
}

/**
 * 換頁的掃場動畫。
 *
 * 兩個階段分開驅動：`cover` 蓋滿（蓋滿後呼叫端才切路由），`uncover` 讓開。
 * 中間的路由切換由呼叫端負責，所以這個元件必須掛在 layout ——
 * 放在頁面裡換頁時會跟著被卸載，動畫只會播一半。
 *
 * anime.js 走動態 import：tree-shake 後約 15 KB gzip，只在換頁時用得到。
 */
const WipeOverlay: React.FC<Props> = ({ phase, wipe, onDone }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let timeline: { pause: () => void } | null = null;

    (async () => {
      const { createTimeline } = await import('animejs');
      if (cancelled) return;

      const shape = root.querySelector<HTMLElement>('[data-shape]');
      if (!shape) { doneRef.current(); return; }
      const face = root.querySelector<HTMLElement>('[data-face]');

      const s = coverScale(wipe);
      const { radius } = boxOf(wipe);
      // 脹大之後圓角也跟著被放大，所以要先除掉 scale 才會看起來是正圓。
      const round = `${Math.max(boxOf(wipe).width, boxOf(wipe).height)}px`;

      const tl = createTimeline({
        defaults: { ease: 'inOut(3)' },
        onComplete: () => { if (!cancelled) doneRef.current(); },
      });

      if (phase === 'cover') {
        /*
          方塊 → 圓 → 蓋滿。圖示與文字留在原位不跟著放大，
          所以看起來是「那塊磁磚打開了」而不是「有東西蓋過來」。

          face 全程不動 opacity。第一版讓它在蓋滿前先淡出，結果進場尾段
          到離場開頭之間圖示整個不見，看起來像閃了一下 ——
          中間還夾著換路由，那段空白特別明顯。現在它從按下去到
          最後收掉為止都在，只有最後跟色塊一起消失。
        */
        tl.add(shape, { borderRadius: [`${radius}px`, round], duration: 200 }, 0);
        tl.add(shape, { scale: [1, s], duration: 540 }, 60);
      } else {
        /*
          圓 → 收成方塊 → 一路縮到不見。

          關鍵是「一路」：第一版縮到按鈕大小就停住，再用 opacity 淡出，
          於是看起來是兩件事 —— 先縮小，然後消失。現在 scale 直接走到 0，
          圖示與文字用同一條曲線同步縮，整個東西是連續地被收走的，
          中間沒有任何一幀是靜止的。

          圓角在 55% 左右就收完，所以下降的後半段是按鈕的形狀而不是圓，
          「它變回那顆按鈕然後被收起來」這件事才讀得出來。

          進場時 face 刻意不縮（要留在原地讓人看清楚按了什麼），
          離場才跟著一起走 —— 兩邊的目的不同，不必對稱。
        */
        const ease = 'inOut(2.6)';
        tl.add(shape, { scale: [s, 0], duration: 620, ease }, 0);
        tl.add(shape, { borderRadius: [round, `${radius}px`], duration: 240 }, 120);
        if (face) tl.add(face, { scale: [1, 0], duration: 620, ease }, 0);
      }

      timeline = tl;
    })();

    return () => {
      cancelled = true;
      timeline?.pause();
    };
  }, [phase, wipe]);

  const box = boxOf(wipe);
  const s = coverScale(wipe);
  const Icon = wipe.icon;

  /** 起點方塊的位置。圖示層與色塊層共用同一組座標，兩者才會完全疊合。 */
  const seat: React.CSSProperties = {
    left: wipe.x - box.width / 2,
    top: wipe.y - box.height / 2,
    width: box.width,
    height: box.height,
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[60] overflow-hidden"
      // 純裝飾，而且它蓋住整個畫面 —— 讀屏不該念它，焦點也不該跑進來
      aria-hidden="true"
    >
      <div
        data-shape
        className="absolute"
        style={{
          ...seat,
          background: wipe.color,
          transformOrigin: 'center',
          willChange: 'transform',
          borderRadius: phase === 'cover' ? box.radius : Math.max(box.width, box.height),
          transform: phase === 'cover' ? 'scale(1)' : `scale(${s})`,
        }}
      />

      {/* 磁磚的臉：圖示與文字。不跟著放大，所以展開時它就停在原地。 */}
      {(Icon || wipe.label) && (
        <div
          data-face
          className={`pointer-events-none absolute flex items-center justify-center ${
            wipe.row ? 'flex-row gap-3' : 'flex-col gap-2'
          }`}
          style={{ ...seat, color: wipe.fg, transformOrigin: 'center', willChange: 'transform' }}
        >
          {Icon && (
            /*
              尺寸用來源元素上量到的實際值，不是寫死的 text-7xl。

              寫死的話，48px 的回首頁鈕會頂著一顆 72px 的房子圖示 ——
              大得溢出按鈕本身，看起來就是「有個東西突然冒出來」
              而不是「這顆鈕打開了」。磁磚上的圖示也會對不準。
            */
            <Icon
              style={{
                fontSize: wipe.iconSize ? `${wipe.iconSize}px` : undefined,
                flexShrink: 0,
                ...(wipe.iconColor ? { fill: wipe.iconColor } : {}),
              }}
              aria-hidden="true"
            />
          )}
          {wipe.label && (
            <span className={`font-[family-name:var(--font-app)] leading-tight ${
              wipe.row ? 'text-lg font-black' : 'flex flex-col items-center'
            }`}>
              {!wipe.row && wipe.kicker && (
                <span className="text-xs font-bold opacity-75 md:text-sm">{wipe.kicker}</span>
              )}
              <span className={wipe.row ? '' : 'text-lg font-black md:text-xl'}>{wipe.label}</span>
            </span>
          )}
        </div>
      )}

    </div>
  );
};

export default WipeOverlay;
