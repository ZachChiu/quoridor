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
  /**
   * 把文字放大成整個畫面的標題。
   *
   * 一般的轉場是「這塊磁磚脹開」，字維持磁磚上的大小才對得起來，而且它是
   * 色塊的子元素、會被色塊的形狀裁掉 —— 那正是「圖示被色塊吃掉」的效果。
   *
   * 原地閃一下的那種（連線房坐滿）沒有來源磁磚，文字就是主角本身。
   * 所以 big 的字畫在色塊**外面**：不被裁、不反向縮放，蓋滿之後才淡入。
   * 放在裡面的話會被那個只有幾十 px 的起點方框夾住，四個字斷成直排。
   */
  big?: boolean;
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
 * 關鍵是**形狀是橢圓不是矩形** —— 展開過程中 border-radius 已經跑到
 * 50%。用 `max(dx, dy)` 算出來的是「蓋住最遠的邊」需要的尺寸，
 * 但橢圓要蓋住的是**最遠的角**，那要大得多。
 *
 * 之前就是這樣算的，結果畫面四個角在最大的那一刻仍然露出底色，
 * 看起來像「還沒展開完就開始收回去」。
 *
 * 正確的條件是讓最遠的角落在橢圓內：
 *
 *     (dx / (w/2 · s))² + (dy / (h/2 · s))² ≤ 1
 *  →  s ≥ √( (2dx/w)² + (2dy/h)² )
 *
 * 正方形起點時會退化成 `2·hypot(dx,dy)/w`，也就是圓要碰到對角。
 */
function coverScale(wipe: Wipe): number {
  if (typeof window === 'undefined') return 40;
  const { width, height } = boxOf(wipe);
  const dx = Math.max(wipe.x, window.innerWidth - wipe.x);
  const dy = Math.max(wipe.y, window.innerHeight - wipe.y);
  return Math.hypot((2 * dx) / width, (2 * dy) / height) * 1.04;
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
      const big = root.querySelector<HTMLElement>('[data-big]');

      const s = coverScale(wipe);
      const { radius } = boxOf(wipe);
      const round = `${Math.max(boxOf(wipe).width, boxOf(wipe).height)}px`;

      const tl = createTimeline({
        defaults: { ease: 'inOut(3)' },
        onComplete: () => { if (!cancelled) doneRef.current(); },
      });

      /*
        圖示是色塊的**子元素**，色塊 overflow: hidden ——
        所以圖示永遠被色塊當下的實際形狀裁切，包含圓角。

        但子元素會跟著父層一起縮放，所以每一幀反向補償：
        父層 scale(s)、子層 scale(1/s)，相乘等於 1，圖示的視覺大小不變。

        效果上就是：色塊收小的時候圖示不跟著縮，而是**被色塊從外緣吃掉**。
        用 overflow 而不是自己算 clip-path，是因為圓角在收尾時會從圓變回
        方塊 —— 自己算就得跟著換形狀，用 overflow 則是瀏覽器直接照著
        border-radius 裁，永遠一致。

        1/s 在 s 趨近 0 時會爆掉，所以夾在 20 倍。那時色塊只剩原本的 5%
        （約 8px），圖示本來就幾乎看不見了。
      */
      const drive = { s: phase === 'cover' ? 1 : s };
      const apply = () => {
        shape.style.transform = `scale(${drive.s})`;
        if (face) face.style.transform = `scale(${Math.min(1 / Math.max(drive.s, 1e-4), 20)})`;
      };
      apply();

      if (phase === 'cover') {
        tl.add(shape, { borderRadius: [`${radius}px`, round], duration: 200 }, 0);
        tl.add(drive, { s: [1, s], duration: 540, onUpdate: apply }, 60);
        // 大標在色塊快蓋滿時才淡入 —— 早了會疊在還看得見的舊畫面上
        if (big) tl.add(big, { opacity: [0, 1], duration: 260 }, 360);
      } else {
        /*
          一段連續的縮小，不拆段。

          先前拆成「先收回磁磚大小、再收到 0」兩段，是為了讓「圖示被吃掉」
          有時間看見。但兩段的緩動都在接點收到速度 0 —— 於是它會在原本
          按鈕的大小上明顯停一下，再重新啟動。那個停頓比它想解決的問題還礙眼。

          改成單一 tween 配 out 緩動就同時滿足兩件事：開頭快、結尾慢。
          以 out(3) 計算，大約後 30% 的時間色塊都小於原本的按鈕 ——
          也就是圖示被吃掉的那段自然就慢下來了，不需要切成兩段。

          圓角在前半段收回方塊，所以吃掉的過程是方塊在吃，不是圓在吃。
        */
        tl.add(drive, { s: [s, 0], duration: 700, ease: 'out(3)', onUpdate: apply }, 0);
        tl.add(shape, { borderRadius: [round, `${radius}px`], duration: 220 }, 60);
        // 先把字收掉再讓色塊縮 —— 不然字會浮在越縮越小的色塊外面
        if (big) tl.add(big, { opacity: [1, 0], duration: 180 }, 0);
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

  /** 起點方塊在畫面上的位置與尺寸。圖示層是它的子元素，用 inset-0 貼齊。 */
  const seat: React.CSSProperties = {
    left: wipe.x - box.width / 2,
    top: wipe.y - box.height / 2,
    width: box.width,
    height: box.height,
  };

  return (
    <div
      ref={rootRef}
      className="cover-viewport z-[60] overflow-hidden"
      // 純裝飾，而且它蓋住整個畫面 —— 讀屏不該念它，焦點也不該跑進來
      aria-hidden="true"
    >
      <div
        data-shape
        className="absolute overflow-hidden"
        style={{
          ...seat,
          background: wipe.color,
          borderRadius: phase === 'cover' ? box.radius : Math.max(box.width, box.height),
          transformOrigin: 'center',
          willChange: 'transform',
          // 初始值要在 render 就給對。離場的第一幀若是 scale(1)（原本磁磚
          // 的大小），畫面會先閃一下小方塊，等 effect 跑起來才撐滿。
          transform: phase === 'cover' ? 'scale(1)' : `scale(${s})`,
        }}
      >
        {/* 磁磚的臉：圖示與文字。放在色塊**裡面**，所以會被色塊的形狀裁掉。
            大小靠每一幀的反向縮放維持不變（見上方 apply）。 */}
        {(Icon || (wipe.label && !wipe.big)) && (
          <div
            data-face
            className={`pointer-events-none absolute inset-0 flex items-center justify-center ${
              wipe.row ? 'flex-row gap-3' : 'flex-col gap-2'
            }`}
            style={{
              color: wipe.fg,
              transformOrigin: 'center',
              willChange: 'transform',
              transform: phase === 'cover' ? 'scale(1)' : `scale(${Math.min(1 / s, 20)})`,
            }}
          >
            {Icon && (
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

      {/* 整個畫面的大標。色塊的兄弟節點，所以不會被 overflow-hidden 裁掉，
          也不跟著反向縮放 —— 它不屬於任何一塊磁磚，本來就該是固定大小。 */}
      {wipe.big && wipe.label && (
        <div
          data-big
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
          style={{ color: wipe.fg, opacity: phase === 'cover' ? 0 : 1 }}
        >
          <span className="whitespace-nowrap text-center font-[family-name:var(--font-app)] text-4xl font-black tracking-tight md:text-6xl">
            {wipe.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default WipeOverlay;
