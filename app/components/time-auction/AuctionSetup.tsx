'use client';
import { useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp, LuHouse } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import type { Mode } from '@/games/time-auction/engine';
import type { Difficulty } from '@/games/time-auction/ai';
import { TEXT } from '@/games/time-auction/text';
import AuctionRules from './AuctionRules';
import { KEY_ART, KEY_BG } from './theme';

export type Setup = { mode: Mode; opponents: 3 | 4 | 5; difficulty: Difficulty };

const MODE_KEYS: Mode[] = ['quick', 'show'];
const OPPONENTS: Setup['opponents'][] = [3, 4, 5];
const LEVELS: Difficulty[] = ['easy', 'normal', 'hard'];

/** 小圓鈕（回平台、說明）—— 跟 Bagh Chal 對局頁同一款 */
export const roundBtn = 'grid size-11 shrink-0 place-items-center rounded-full bg-tile-ink/[0.07] text-xl text-ink-soft transition fine:hover:bg-tile-ink/[0.12] disabled:opacity-35';

/**
 * 開局設定（docs/game-first-screen.md 的 B 版型）：上半是遊戲主色的海報頭（主視覺＋標題＋一句話），
 * 下半是單色的選項（選中的深墨、其餘中性灰），最後一顆深墨的「開始」。
 * 一個畫面只有酒紅一個色相；難度的點數也用酒紅，跟 Wall Go 用陶橘點數同一個做法。
 * 桌機（lg）改成左右兩欄：左邊海報頭、右邊選項。
 */
export default function AuctionSetup({ value, onChange, onStart, onHome }: {
  value: Setup;
  /** 只傳改了哪一項；由上層用 updater 合併，連點兩個選項也不會用到舊值 */
  onChange: (patch: Partial<Setup>) => void;
  onStart: () => void;
  onHome: () => void;
}) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const [helpOpen, setHelpOpen] = useState(false);
  const levelNames = [m.solo.level1, m.solo.level2, m.solo.level3];

  const option = (on: boolean) =>
    `rounded-2xl transition ${on ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-tile-ink fine:hover:bg-tile-ink/[0.12]'}`;
  const legend = 'mb-1.5 text-sm font-bold text-ink-soft';

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pb-6 pt-3 font-[family-name:var(--font-app)] lg:px-8">
      <div className="flex w-full max-w-[460px] items-center justify-between lg:max-w-[960px]">
        <button type="button" onClick={onHome} aria-label={t.home} className={roundBtn}><LuHouse aria-hidden="true" /></button>
        <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></button>
      </div>

      <main className="mt-3 flex w-full max-w-[460px] flex-col gap-4 lg:my-auto lg:max-w-[960px] lg:flex-row lg:items-center lg:gap-10">
        {/* 海報頭：主視覺用背景圖 —— 檔案還沒到位時就只是一塊酒紅，不會出現破圖。
            主視覺是唯一會隨畫面高度縮的東西（dvh），矮的手機上「開始」才不會被擠出畫面 */}
        <header className={`overflow-hidden rounded-3xl text-tile-cream ${KEY_BG} lg:flex-1`}>
          <div
            aria-hidden="true"
            className="h-[clamp(6rem,19dvh,13rem)] bg-cover bg-center lg:h-[clamp(14rem,40dvh,22rem)]"
            style={{ backgroundImage: `url(${KEY_ART})` }}
          />
          <div className="px-5 pb-4 pt-3.5">
            <p className="text-xs font-bold tracking-wide text-tile-cream/70">{t.tag}</p>
            <h1 className="mt-1.5 text-[clamp(2.25rem,5.5dvh,3.25rem)] font-black leading-none tracking-tight">{t.title}</h1>
            {t.nameEn !== t.title && <p className="mt-1 text-base font-black text-tile-cream/80">{t.nameEn}</p>}
            <p className="mt-2 text-sm font-bold">{t.tagline}</p>
          </div>
        </header>

        <section className="flex flex-col gap-4 lg:w-[400px] lg:shrink-0">
          <fieldset>
            <legend className={legend}>{t.modeLabel}</legend>
            <div role="radiogroup" aria-label={t.modeLabel} className="grid grid-cols-2 gap-2.5">
              {MODE_KEYS.map((key) => {
                const on = value.mode === key;
                return (
                  <button key={key} type="button" role="radio" aria-checked={on} onClick={() => onChange({ mode: key })}
                    className={`flex flex-col items-start gap-1 px-4 py-3 text-left ${option(on)}`}>
                    <span className="text-base font-black">{key === 'quick' ? t.modeQuick : t.modeShow}</span>
                    <span className={`text-xs font-bold leading-snug ${on ? 'text-tile-cream/75' : 'text-ink-soft'}`}>
                      {key === 'quick' ? t.modeQuickNote : t.modeShowNote}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legend}>{t.opponentsLabel}</legend>
            <div role="radiogroup" aria-label={t.opponentsLabel} className="grid grid-cols-3 gap-2.5">
              {OPPONENTS.map((n) => {
                const on = value.opponents === n;
                return (
                  <button key={n} type="button" role="radio" aria-checked={on} onClick={() => onChange({ opponents: n })}
                    className={`h-12 text-base font-black ${option(on)}`}>
                    {fill(t.opponentsUnit, { n })}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className={legend}>{t.levelLabel}</legend>
            <div role="radiogroup" aria-label={t.levelLabel} className="grid grid-cols-3 gap-2.5">
              {LEVELS.map((level, i) => {
                const on = value.difficulty === level;
                return (
                  <button key={level} type="button" role="radio" aria-checked={on} onClick={() => onChange({ difficulty: level })}
                    className={`flex flex-col items-center gap-2 py-2.5 text-base font-black ${option(on)}`}>
                    {/* 強度用點數講，不用三個色相（CLAUDE.md〈視覺〉） */}
                    <span className="flex gap-1.5" aria-hidden="true">
                      {LEVELS.map((_, dot) => (
                        <span key={dot} className={`size-2.5 rounded-full ${dot <= i ? (on ? 'bg-tile-cream' : KEY_BG) : on ? 'bg-tile-cream/25' : 'bg-tile-ink/15'}`} />
                      ))}
                    </span>
                    {levelNames[i]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <button type="button" onClick={onStart}
            className="mt-1 h-14 w-full rounded-2xl bg-tile-ink text-lg font-black text-tile-cream transition active:scale-[0.985] fine:hover:brightness-110">
            {t.start}
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} className="mx-auto text-sm font-bold text-ink-soft underline underline-offset-4">
            {t.howTo}
          </button>
        </section>
      </main>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.howTo} kicker={t.title}
        icon={GiRuleBook} band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}>
        <AuctionRules mode={value.mode} />
      </Modal>
    </div>
  );
}
