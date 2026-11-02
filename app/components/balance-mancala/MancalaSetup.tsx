'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuCircleHelp } from 'react-icons/lu';
import GameHomeBar from '@/components/GameHomeBar';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { BALANCE_MANCALA, trialOnline, trialRules } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';
import { MAX_SEATS, MIN_SEATS } from '@/games/balance-mancala/engine';
import type { Difficulty } from '@/games/balance-mancala/ai';
import { useMessages } from '@/i18n/LocaleProvider';
import { localSeats, type MatchSetup } from './match';
import { ONLINE_MAX, ONLINE_MIN } from './online';
import MancalaFrame from './MancalaFrame';
import { CLOTH, WOOD } from './palette';
import { MCL_CORNER } from './styles';
import { track } from '@/utils/analytics';

const SEAT_CHOICES = Array.from({ length: MAX_SEATS - MIN_SEATS + 1 }, (_, i) => MIN_SEATS + i);
const HUMAN_CHOICES = Array.from({ length: MAX_SEATS - 1 }, (_, i) => i + 2);
const ONLINE_CHOICES = Array.from({ length: ONLINE_MAX - ONLINE_MIN + 1 }, (_, i) => ONLINE_MIN + i);
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 主視覺：時禱書那頁下方的聖米迦勒秤靈魂（克里夫蘭美術館 1999.130，CC0），外面一道金線一道墨線，像頁上框起來的小插圖 */
const KEY_ART = '/games/balance-mancala/key-art.webp';

/**
 * 開局設定（這一頁同時是遊戲首頁）。整頁是一頁時禱書的羊皮紙（MancalaFrame）；上面是聖米迦勒秤靈魂的插圖與標題，
 * 下面選模式、席數、難度。有 AI 時按難度就開始；全部是真人時按「開始」。
 * 連線對戰選人數（4–7，全部是真人）、按「開房間」到 /balance-mancala/online#new=N 開房（不播轉場，這款裡面換頁直接換）。
 * 「怎麼玩」連到規則頁（/balance-mancala/rules，一步一張圖；2026-10-25 之前是開一個整面文字的彈窗），一樣不播轉場。
 * 選項照全站：選中的是墨、其餘是紙上一層淡墨，沒有框線；難度的點數用深金的小方塊（一個面板一個色相）。
 * 最上面一列是平台 logo、聯絡與語言（GameHomeBar，遊戲首頁才放），跟內容同寬、排在流裡（11/3 Zach：跟時間拍賣一樣、不要浮著）；
 * 那兩顆鈕與打開的彈窗用這款自己的樣子（MCL_CORNER：切角的淡墨片、亮羊皮紙面板、金箔）。
 */
export default function MancalaSetup({ locale, initial, onStart }: { locale: Locale; initial: MatchSetup; onStart: (m: MatchSetup) => void }) {
  const t = useTextTable(TEXT);
  const router = useRouter();
  const [mode, setMode] = useState(initial.mode);
  const [seats, setSeats] = useState(initial.mode === 'solo' ? initial.seats : 4);
  const [humans, setHumans] = useState(initial.mode === 'local' ? initial.humans : 2);
  const [online, setOnline] = useState(ONLINE_MIN);
  const m = useMessages();
  const levelNames = [m.solo.level1, m.solo.level2, m.solo.level3];

  const total = mode === 'solo' ? seats : mode === 'online' ? online : localSeats(humans);
  const computers = mode === 'solo' ? seats - 1 : mode === 'online' ? 0 : total - humans;
  // GA：mode_select 是「想玩」（按下開始／難度、開房間），players 是一桌的席數（AI 也算），難度只有有 AI 時帶
  const start = (difficulty: Difficulty) => {
    track('mode_select', { game: 'balance-mancala', mode, players: total as 4 | 5 | 6 | 7, difficulty: computers > 0 ? difficulty : undefined, entry: 'home' });
    onStart({ mode, seats: total, humans: mode === 'solo' ? 1 : humans, difficulty });
  };
  const openRoom = () => {
    track('mode_select', { game: 'balance-mancala', mode: 'online', players: online as 4 | 5 | 6 | 7, entry: 'home' });
    router.push(`${localePath(locale, trialOnline(BALANCE_MANCALA))}#new=${online}`);
  };
  const choices = mode === 'solo' ? SEAT_CHOICES : mode === 'online' ? ONLINE_CHOICES : HUMAN_CHOICES;
  const value = mode === 'solo' ? seats : mode === 'online' ? online : humans;
  const setValue = mode === 'solo' ? setSeats : mode === 'online' ? setOnline : setHumans;
  const note = mode === 'solo' ? fill(t.seatsSolo, { n: computers })
    : mode === 'online' ? fill(t.onlineNote, { n: online })
    : computers > 0 ? fill(t.localFill, { n: computers }) : t.localNoFill;
  const modes = [['solo', t.modeSolo], ['local', t.modeLocal], ['online', t.modeOnline]] as const;

  // 選中的是金箔（切角），其餘是一條畫了格線的羊皮紙（上下各一道金線、一道墨線）—— globals.css 的 .mcl-*
  const chip = (on: boolean) => `h-12 text-lg font-black ${on ? 'mcl-plaque' : 'mcl-cloth'}`;

  return (
    <MancalaFrame className="items-center">
      <div className="w-full max-w-[460px] px-5 pt-2.5">
        <GameHomeBar locale={locale} theme={MCL_CORNER} className="mb-3" />
        <header className="flex flex-col items-center text-center">
          {/* 出處：1430 年代法蘭德斯的時禱書，克里夫蘭美術館（CC0）。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
          <div className="flex w-full flex-col items-center gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出的單張主視覺，不需要 next/image */}
            <img src={KEY_ART} alt="" aria-hidden="true" width={1000} height={560}
              className="block h-auto w-[min(100%,24rem,calc(19svh*1.79))]" />
          </div>
          <p className="mt-4 text-[11px] font-bold tracking-wide text-ink-soft">{t.showRef}</p>
          <h1 className="mt-1 text-[clamp(2rem,6svh,3.25rem)] font-black leading-[1.05] tracking-tight">{t.title}</h1>
          {t.altName && <p className="mt-1 text-sm font-bold text-ink-soft">{t.altName}</p>}
          <p className="mt-2 text-sm font-bold">{t.tagline}</p>
        </header>
      </div>

      <main className="flex w-full max-w-[460px] flex-col gap-5 p-5">
        <div className="mcl-cloth grid grid-cols-3 gap-1 px-1 py-2.5" role="radiogroup" aria-label={modes.map(([, label]) => label).join(' / ')}>
          {modes.map(([md, label]) => (
            <button key={md} type="button" role="radio" aria-checked={mode === md} onClick={() => setMode(md)}
              className={`min-h-11 px-1 text-sm font-black leading-tight ${mode === md ? 'mcl-plaque' : 'text-ink-soft fine:hover:text-[var(--mcl-ink)]'}`}>
              {label}
            </button>
          ))}
        </div>

        <section>
          <p className="text-sm font-bold text-ink-soft">{mode === 'solo' ? t.seats : t.humans}</p>
          <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${choices.length}, minmax(0, 1fr))` }} role="radiogroup"
            aria-label={mode === 'solo' ? t.seats : t.humans}>
            {choices.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={value === n} className={chip(value === n)} onClick={() => setValue(n)}>
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-ink-soft">
            {note}
            {total === MAX_SEATS && <span className="mcl-cut px-2 py-0.5 text-[10px]" style={{ background: WOOD, color: CLOTH }}>{t.showMode}</span>}
          </p>
        </section>

        {mode === 'online' ? (
          <button type="button" onClick={openRoom}
            className="mcl-plaque h-14 text-lg font-black active:scale-[0.98]">{t.openRoom}</button>
        ) : computers > 0 ? (
          <section>
            <p className="text-sm font-bold text-ink-soft">{t.level}</p>
            {/* 一條條羊皮紙；強度用深金的小方塊講：一塊、兩塊、三塊 */}
            <div className="mt-2 grid w-full grid-cols-3 gap-3">
              {LEVELS.map((d, i) => (
                <button key={d} type="button" onClick={() => start(d)}
                  className="mcl-cloth flex flex-col items-center gap-3 py-5 text-xl font-black active:scale-[0.97]">
                  <span className="flex h-[13px] gap-1" aria-hidden="true">
                    {Array.from({ length: i + 1 }, (_, k) => <span key={k} className="mcl-weight" />)}
                  </span>
                  {levelNames[i]}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <button type="button" onClick={() => start('normal')}
            className="mcl-plaque h-14 text-lg font-black active:scale-[0.98]">{t.start}</button>
        )}

        <Link href={localePath(locale, trialRules(BALANCE_MANCALA))}
          className="mcl-link mx-auto flex h-11 items-center justify-center gap-1.5 text-sm">
          <LuCircleHelp aria-hidden="true" />{t.howTo}
        </Link>
      </main>
    </MancalaFrame>
  );
}
