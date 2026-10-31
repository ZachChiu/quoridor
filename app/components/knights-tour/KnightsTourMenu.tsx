'use client';
import { useState } from 'react';
import { GiChessKnight, GiRuleBook, GiStopwatch } from 'react-icons/gi';
import GameTile from '@/components/GameTile';
import PlatformCorner from '@/components/PlatformCorner';
import { useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { KNIGHTS_TOUR } from '@/i18n/routes';
import { SIZES } from '@/games/knights-tour/engine';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import HowToPlay from './HowToPlay';
import SizePicker from './SizePicker';
import { practiceKey, useBestTimes, type RecordKey } from './records';
import { formatTime, sizeLabel } from './ui';

/**
 * 騎士巡邏的首頁（選模式），版面照 Wall Go／Bagh Chal 的遊戲首頁：角落是平台 logo（回平台首頁）
 * 與聯絡／語言，中間是標題與模式磁磚（GameTile），整頁塞得進一個畫面（home-main／home-grid 管矮螢幕）。
 *
 * 磁磚配色：節目挑戰磚紅（限時、會整盤清空的那個）、練習琥珀（這款遊戲的顏色，棋盤上走過的格子也是琥珀）、
 * 規則照全站慣例森綠。
 */
export default function KnightsTourMenu({ locale, onShow, onPractice }: {
  locale: Locale;
  onShow: () => void;
  onPractice: (n: number) => void;
}) {
  const t = useTextTable<KnightsText>(TEXT);
  const best = useBestTimes();
  const [helpOpen, setHelpOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const records = ([['show', t.showMode], ...SIZES.map((n) => [practiceKey(n), sizeLabel(n)])] as [RecordKey, string][])
    .flatMap(([key, name]) => { const ms = best[key]; return ms === undefined ? [] : [{ key, name, ms }]; });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-[max(1rem,3dvh)] font-[family-name:var(--font-app)]">
      <PlatformCorner locale={locale} />
      <div aria-hidden="true" className="hidden h-14 w-px shrink portrait:block" />
      <main className="home-main flex w-full max-w-[420px] flex-col items-center">
        <header className="flex w-full flex-col items-center text-center">
          {/* 主視覺：AI 畫的包浩斯海報（騎士跳過棋盤），跟平台卡片同一張；磁磚也跟著用紅黃藍三原色 */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，已是 webp */}
          <img src="/games/knights-tour/key-art.webp" alt="" width={720} height={480}
            className="mb-[max(0.75rem,2dvh)] aspect-[3/2] max-h-[24dvh] w-full max-w-[380px] rounded-3xl object-cover short:hidden" />
          <h1 className="text-[clamp(2.25rem,7dvh,3.75rem)] font-black leading-[0.95] tracking-tight">
            {t.title}
            {t.subtitle && <><br /><span className="text-[0.5em] tracking-normal">{t.subtitle}</span></>}
          </h1>
          <p className="mt-[max(0.5rem,1.5dvh)] text-sm font-bold text-ink-soft md:text-base">{t.tagline}</p>
        </header>
        <div className="flex w-full flex-col items-center">
          <div className="home-grid relative z-20 mt-[max(1rem,3dvh)] grid w-full grid-cols-2 gap-3 md:gap-4">
            <GameTile icon={GiStopwatch} tone="red" kicker={t.showKicker} label={t.showMode}
              href={`${localePath(locale, KNIGHTS_TOUR)}#show`} onClick={onShow} />
            <GameTile icon={GiChessKnight} tone="amber" kicker={t.practiceKicker} label={t.practiceMode}
              onClick={() => setSizeOpen(true)} />
            <GameTile icon={GiRuleBook} tone="blue" label={t.rules} wide onClick={() => setHelpOpen(true)} />
          </div>
          {records.length > 0 && (
            <section className="mt-[max(0.75rem,2dvh)] w-full max-w-[380px]">
              <h2 className="text-xs font-black text-ink-soft">{t.best}</h2>
              <dl className="mt-1.5 flex flex-wrap gap-1.5">
                {records.map(({ key, name, ms }) => (
                  <div key={key} className="flex items-baseline gap-1.5 rounded-xl bg-tile-ink/[0.07] px-2.5 py-1">
                    <dt className="text-xs font-bold text-ink-soft">{name}</dt>
                    <dd className="text-sm font-black tabular-nums">{formatTime(ms)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </main>

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SizePicker open={sizeOpen} onClose={() => setSizeOpen(false)} onPick={(n) => { setSizeOpen(false); onPractice(n); }} />
    </div>
  );
}
