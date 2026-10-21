'use client';
import type { ReactNode } from 'react';
import { LuCircleHelp, LuHouse } from 'react-icons/lu';
import KtFrame from './KtFrame';

/**
 * 按鈕只有兩種（照 Wall Go）：主要是墨、次要是紙上一層淡墨，沒有框線。墨是 18 世紀銅版畫取樣的 #322e2a（palette.ts）。
 * hover 只給滑鼠（觸控會一直停在 :hover）
 */
export const BTN_ROUND = 'grid size-11 shrink-0 place-items-center rounded-full bg-[#322e2a]/[0.08] text-xl text-[#322e2a] transition fine:hover:bg-[#322e2a]/[0.14] disabled:opacity-35';
export const BTN = 'flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#322e2a]/[0.08] px-3 py-2 text-sm font-black leading-tight text-[#322e2a] transition active:scale-[0.98] fine:hover:bg-[#322e2a]/[0.14] disabled:pointer-events-none disabled:opacity-35';
export const BTN_PRIMARY = 'flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#322e2a] px-3 py-2 text-sm font-black leading-tight text-[#edddc7] transition active:scale-[0.98] fine:hover:brightness-125 disabled:pointer-events-none disabled:opacity-35';
/** 騎士巡邏的彈窗：紙色面板＋紅粉筆色帶（紙色字 5.1:1），一個面板一個色相 */
export const MODAL_PANEL = '!bg-[#edddc7]';
export const BAND_CHALK = { className: 'bg-[#834d36]', fg: 'text-[#edddc7]' };
export const BAND_INK = { className: 'bg-[#322e2a]', fg: 'text-[#edddc7]' };

export type Place = 'bar' | 'aside';

/**
 * 對局畫面的版面（節目挑戰與練習模式共用），照 BaghPlay：
 * - 手機：上方一排（回選單、標題、規則），下面狀態、棋盤、按鈕。棋盤吃掉剩下的高度，
 *   8×8 在 390 寬的手機上每格約 44px；寬度同時受畫面高度限制，矮的手機不會把按鈕擠出畫面
 * - 桌機（lg）與橫放的手機（short）：棋盤在左，右邊一欄放標題、狀態與有字的按鈕
 * status／controls 會在兩個位置各畫一次（另一個用 CSS 藏起來），所以收的是函式。
 */
export default function GameFrame({ title, subtitle, menuLabel, helpLabel, onMenu, onHelp, status, controls, board }: {
  title: string;
  subtitle: string;
  menuLabel: string;
  helpLabel: string;
  onMenu: () => void;
  onHelp: () => void;
  status: (place: Place) => ReactNode;
  controls: (place: Place) => ReactNode;
  board: ReactNode;
}) {
  return (
    <KtFrame className="items-center px-4 pb-4 pt-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-10 short:flex-row short:items-center short:justify-center short:gap-6 short:py-3">
      <div className="flex w-full max-w-[520px] items-center justify-between gap-2 lg:hidden short:hidden">
        <button type="button" onClick={onMenu} aria-label={menuLabel} className={BTN_ROUND}><LuHouse aria-hidden="true" /></button>
        <h1 className="truncate text-xl font-black">{title}</h1>
        <button type="button" onClick={onHelp} aria-label={helpLabel} className={BTN_ROUND}><LuCircleHelp aria-hidden="true" /></button>
      </div>
      <div className="mt-3 w-full max-w-[520px] lg:hidden short:hidden">{status('bar')}</div>

      <div className="flex w-full max-w-[min(520px,calc(100dvh-17.5rem))] flex-1 items-center py-2.5 lg:w-[min(620px,calc(100dvh-5rem))] lg:max-w-none lg:flex-none lg:py-0 short:w-[calc(100dvh-1.5rem)] short:max-w-none short:flex-none short:py-0">
        {board}
      </div>

      <div className="w-full max-w-[520px] lg:hidden short:hidden">{controls('bar')}</div>

      <aside className="hidden w-[320px] shrink-0 flex-col gap-4 lg:flex short:flex short:w-[300px] short:gap-3">
        <div>
          <h1 className="text-4xl font-black leading-none short:text-2xl">{title}</h1>
          <p className="mt-1.5 text-sm font-bold opacity-75">{subtitle}</p>
        </div>
        {status('aside')}
        {controls('aside')}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={onHelp} className={BTN}><LuCircleHelp aria-hidden="true" className="shrink-0" />{helpLabel}</button>
          <button type="button" onClick={onMenu} className={BTN}><LuHouse aria-hidden="true" className="shrink-0" />{menuLabel}</button>
        </div>
      </aside>
    </KtFrame>
  );
}
