'use client'
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '@/hook/useScrollLock';
import { useMessages } from '@/i18n/LocaleProvider';
import { GiCancel } from 'react-icons/gi';
import type { IconType } from 'react-icons';

/**
 * 所有 Modal 的共用外殼。
 *
 * 抽出來的原因是四個 Modal 原本各寫各的殼，值已經漂開了：圓角有 xl 有 2xl、
 * 寬度有 `max-w-md` 有 `min-w-80 max-w-md`，冠軍 Modal 還漏了 `inset-0`
 * 所以整塊定位是錯的。視覺要能「一起動」，殼就只能有一份。
 *
 * `band` 是標題列的底色，對應首頁磁磚的配色：規則森綠、連線靛藍、邀請朋友紫、破牆磚紅、
 * 冠軍用勝方的顏色。顏色因此帶有意義 —— 一眼知道自己在哪一塊功能裡。
 */
interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** 標題列圖示 */
  icon?: IconType;
  /** 標題上方的小字，例如「遊玩方式 · 3 / 7」 */
  kicker?: string;
  /** 標題列底色。`bg` 吃 Tailwind class 或 CSS 色值，`fg` 是文字色的 class。 */
  band: { className?: string; style?: React.CSSProperties; fg: string };
  children: React.ReactNode;
  /** 底部按鈕列。省略時不留空間。 */
  footer?: React.ReactNode;
  /** 額外的鍵盤處理，例如教學的左右方向鍵。 */
  onKeyDown?: (e: KeyboardEvent) => void;
  /** 面板額外的 class，例如矮螢幕上加寬 */
  panelClassName?: string;
  /** 內容區額外的 class */
  bodyClassName?: string;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

const Modal: React.FC<Props> = ({
  isOpen, onClose, title, icon: Icon, kicker, band, children, footer, onKeyDown, panelClassName = '', bodyClassName = '',
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Modal 打開時鎖住背景捲動 —— 手機上不鎖的話，滑動會穿透到後面的頁面。
  useScrollLock(isOpen);
  const t = useMessages();

  /*
    一律傳送到 <body> 底下渲染（portal）。

    fixed 定位只在「沒有祖先建立新的包含區塊」時才相對於視窗。只要某個祖先有
    backdrop-filter、filter、transform 之類的屬性，fixed 就改成相對那個祖先 ——
    規則頁的頂部列是毛玻璃（backdrop-blur），語言選單放在它裡面，
    整個 Modal 就被塞進那一條 60px 高的列裡（Zach 回報）。
    傳送到 body 之後，不管 Modal 被寫在哪個元件裡都不受祖先影響。

    第一次 render 仍然就地輸出，掛載後才換到 body：靜態 HTML 沒有 document，
    而且 hydration 時兩邊的結構必須一致。Modal 在那時都是關著的，換位置看不出來。
  */
  const [portalReady, setPortalReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 只在掛載時切一次，hydration 之後才有 document.body
  useEffect(() => setPortalReady(true), []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      // 焦點鎖在對話框內。沒有這段的話 Tab 會跑到背後的棋盤上，
      // 使用者會在一個看不見的畫面裡操作。
      if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
          .filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !panelRef.current.contains(active))) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault(); first.focus();
        }
        return;
      }
      onKeyDown?.(e);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // 開啟時把焦點移進來，關閉時還給原本那顆按鈕。
  useEffect(() => {
    if (isOpen) {
      restoreRef.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else {
      restoreRef.current?.focus?.();
      restoreRef.current = null;
    }
  }, [isOpen]);

  /*
    層級：頁面上的東西最高到 z-50（對局頁左上的按鈕、回放頁的控制列），
    換頁轉場是 z-[60]。Modal 夾在中間的 z-[55]。

    不能跟頁面元件同為 z-50：層級相同時看 DOM 順序，而 Modal 是 portal 到
    body 的 —— 站內換頁後 React 會把新頁面插到 body 最後面，排在 Modal 之後，
    於是對局頁左上那兩顆鈕蓋到了「遊玩方式」上面（Zach 截圖）。
  */
  const node = (
    <div
      /*
        上下一定留距離，而且不小於系統安全區（瀏海、底部橫條）。
        先前只有左右 px-4：手機瀏覽器底部有工具列時可視高度變小，
        高的 Modal（遊玩方式）會貼齊上下兩端、按鈕壓到工具列（Zach 回報）。
      */
      className={`fixed inset-0 z-[55] flex items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      } transition-opacity duration-300`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      /*
        關閉時要真的「不存在」。原本只有 opacity-0 + pointer-events-none ——
        那兩個都**不會**把內容從無障礙樹移除，所以螢幕閱讀器使用者一進遊戲頁
        就會聽到七步教學、破牆警告、結算文字全部混在一起（四個 Modal 都常駐 DOM）。
        inert 會一併擋掉焦點與讀屏；aria-hidden 是給還不支援 inert 的瀏覽器的保險。
      */
      {...(isOpen ? {} : { inert: true, 'aria-hidden': true })}
    >
      {/*
        遮罩撐到最大可視高度（見 globals.css 的 .cover-viewport）；面板仍置中在看得到的範圍。

        關閉時一定要 display: none（hidden），不能只靠外層的 opacity-0：
        iOS 26 的 Safari 不看 theme-color，改拿「貼著畫面邊緣的 fixed 元素」的
        background-color 染上下列 —— 而且**不管祖先的 opacity**。每頁都常駐好幾個
        關著的 Modal，於是 Safari 的上下列永遠被染成米色疊 50% 黑的 #73706b
        （Zach 回報「Safari 上下變灰色」，模擬器上量到）。開著的時候變暗是對的，
        跟整個畫面一起被遮住。
      */}
      <div className={`cover-viewport bg-black/50 ${isOpen ? '' : 'hidden'}`} onClick={onClose}></div>

      <div
        ref={panelRef}
        tabIndex={-1}
        // 最高就是可視高度；放不下時色帶與按鈕固定，只有中間的內容捲動
        className={`relative flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-primary font-[family-name:var(--font-app)] outline-none ${panelClassName}`}
      >
        {/* 色帶做成滿版（面板 overflow-hidden 負責切圓角），
            留白會讓它退化成一條「有底色的標題」，力道差很多。 */}
        <div
          className={`flex shrink-0 items-start justify-between gap-3 px-6 py-5 ${band.className ?? ''} ${band.fg}`}
          style={band.style}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="shrink-0 text-4xl" aria-hidden="true" />}
            <div>
              {kicker && <p className="text-xs font-bold tracking-widest opacity-80">{kicker}</p>}
              <h2 className="text-2xl font-black leading-tight">{title}</h2>
            </div>
          </div>
          <button
            type="button"
            aria-label={t.ui.close}
            onClick={onClose}
            // p-2 只有 40px，差一點到觸控目標的 44px。
            className="-mr-2 -mt-1 shrink-0 rounded-full p-2.5 text-2xl opacity-70 transition hover:opacity-100"
          >
            <GiCancel />
          </button>
        </div>

        <div className={`min-h-0 overflow-y-auto overscroll-contain p-6 ${bodyClassName}`}>{children}</div>

        {/*
          按鈕尺寸由這一列決定，不由 Button 自己。

          Button 的預設是給版面上那種單獨一顆的大 CTA 用的（lg 斷點會長到
          24px 字 + 20px padding）。同一組尺寸塞進 max-w-md 的面板裡、
          而且一次三顆，每顆只剩約 95px —— 中文四個字在 24px 下就是 96px，
          於是「給點意見」斷成兩行。

          面板寬度是固定的，所以這裡不跟著斷點放大。
        */}
        {footer && (
          <div className="flex shrink-0 gap-3 px-6 pb-6 [&_button]:p-3.5 [&_button]:text-base [&_button]:tracking-normal [&_button]:lg:p-4 [&_button]:lg:text-base">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return portalReady ? createPortal(node, document.body) : node;
};

export default Modal;
