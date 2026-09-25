import type { ReactNode } from 'react';
import type { IconType } from 'react-icons';

/**
 * 「這一頁走不下去」的共用版面：404、500、連線的各種錯誤。
 *
 * 大圖示（或大字）＋標題＋說明＋出口按鈕。先前連線錯誤只有一行紅字
 * 加一個底線連結，跟 404 放在一起像兩個不同的網站。
 *
 * 顏色：圖示帶一個色相（連線錯誤用連線的靛藍、執行期錯誤用破牆的磚紅），
 * 按鈕只有深墨與中性灰 —— 一個畫面一個色相（CLAUDE.md〈視覺〉）。
 *
 * 不標 'use client'：404 是 server component 也要用它，按鈕由呼叫端傳進來。
 */
export const BTN_PRIMARY =
  'rounded-2xl bg-tile-ink px-6 py-4 text-lg font-black text-tile-cream transition hover:brightness-110 active:scale-[0.98]';
export const BTN_SECONDARY =
  'rounded-2xl bg-tile-ink/[0.07] px-6 py-4 text-lg font-black text-tile-ink transition hover:bg-tile-ink/[0.12] active:scale-[0.98]';

export default function StatusScreen({ icon: Icon, iconClass, mark, title, body, actions, embedded = false }: {
  /** 大圖示；跟 mark 二選一 */
  icon?: IconType;
  iconClass?: string;
  /** 大字（例如 404）；跟 icon 二選一 */
  mark?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  actions: ReactNode;
  /**
   * 嵌在既有頁面裡（連線頁）：那一頁已經有自己的 <main> 與 <h1>，
   * 這裡就改用 <div> 與 <h2>，不撐滿視窗高度 —— 一頁兩個 main、兩個 h1
   * 會讓螢幕報讀器與搜尋引擎搞不清楚哪個才是主體。
   */
  embedded?: boolean;
}) {
  const Wrap = embedded ? 'div' : 'main';
  const Heading = embedded ? 'h2' : 'h1';
  return (
    <div className={`flex items-center justify-center px-6 font-[family-name:var(--font-app)] text-tile-ink ${embedded ? '' : 'min-h-dvh'}`}>
      <Wrap className="flex max-w-[26rem] flex-col items-center gap-5 text-center">
        {Icon && <Icon className={`text-[clamp(4rem,18vw,7rem)] ${iconClass ?? ''}`} aria-hidden="true" />}
        {mark && <p className="text-[clamp(4rem,18vw,7rem)] font-black leading-none tracking-tight text-tile-ink/15">{mark}</p>}
        <Heading className="text-[clamp(1.5rem,6vw,2.25rem)] font-black leading-tight tracking-tight">{title}</Heading>
        {body && <p className="text-base leading-relaxed text-ink-soft">{body}</p>}
        <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>
      </Wrap>
    </div>
  );
}
