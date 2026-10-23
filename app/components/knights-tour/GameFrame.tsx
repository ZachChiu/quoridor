'use client';
import type { ReactNode } from 'react';
import { LuCircleHelp, LuHouse, LuVolume2, LuVolumeX } from 'react-icons/lu';
import { useSound } from '@/hook/useSound';
import { useGameText } from '@/i18n/LocaleProvider';
import KtFrame from './KtFrame';
import { BTN, BTN_ROUND } from './styles';

export type Place = 'bar' | 'aside';

/**
 * 對局畫面的版面（節目挑戰與練習模式共用），照 BaghPlay：
 * - 手機：上方一排（回選單、標題、規則），下面狀態、棋盤、按鈕。棋盤吃掉剩下的高度，
 *   8×8 在 390 寬的手機上每格約 44px；寬度同時受畫面高度限制，矮的手機不會把按鈕擠出畫面
 * - 桌機（lg）與橫放的手機（short）：棋盤在左，右邊一欄放標題、狀態與有字的按鈕
 * status／controls 會在兩個位置各畫一次（另一個用 CSS 藏起來），所以收的是函式。
 *
 * 聲音開關（大鍵琴、鵝毛筆那一套，見 sounds.ts）跟全站共用同一個設定（useSound）：手機在右上、規則旁邊，
 * 桌機在標題右邊。掛著 useSound 才會在第一次點擊時把聲音解鎖。
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
  const g = useGameText();
  const { prefs, setPrefs } = useSound();
  const sound = (
    <button type="button" onClick={() => setPrefs({ sfx: !prefs.sfx })} aria-pressed={prefs.sfx} aria-label={g.sound.button} className={BTN_ROUND}>
      {prefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );
  return (
    <KtFrame className="items-center px-4 pb-4 pt-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-10 short:flex-row short:items-center short:justify-center short:gap-6 short:py-3">
      {/* 三欄：左邊一顆、右邊兩顆，兩側各佔 1fr 標題才會在正中間（同 BaghPlay） */}
      <div className="grid w-full max-w-[520px] grid-cols-[1fr_auto_1fr] items-center gap-2 lg:hidden short:hidden">
        <button type="button" onClick={onMenu} aria-label={menuLabel} className={`${BTN_ROUND} justify-self-start`}><LuHouse aria-hidden="true" /></button>
        <h1 className="truncate text-xl font-black">{title}</h1>
        <div className="flex gap-1.5 justify-self-end">
          {sound}
          <button type="button" onClick={onHelp} aria-label={helpLabel} className={BTN_ROUND}><LuCircleHelp aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-3 w-full max-w-[520px] lg:hidden short:hidden">{status('bar')}</div>

      <div className="flex w-full max-w-[min(520px,calc(100dvh-17.5rem))] flex-1 items-center py-2.5 lg:w-[min(620px,calc(100dvh-5rem))] lg:max-w-none lg:flex-none lg:py-0 short:w-[calc(100dvh-1.5rem)] short:max-w-none short:flex-none short:py-0">
        {board}
      </div>

      <div className="w-full max-w-[520px] lg:hidden short:hidden">{controls('bar')}</div>

      <aside className="hidden w-[320px] shrink-0 flex-col gap-4 lg:flex short:flex short:w-[300px] short:gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black leading-none short:text-2xl">{title}</h1>
            <p className="mt-1.5 text-sm font-bold opacity-75">{subtitle}</p>
          </div>
          {sound}
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
