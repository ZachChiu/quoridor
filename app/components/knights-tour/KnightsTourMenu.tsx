'use client';
import { useState } from 'react';
import { GiChessKnight, GiStopwatch } from 'react-icons/gi';
import { LuChevronRight } from 'react-icons/lu';
import PlatformCorner from '@/components/PlatformCorner';
import { useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { KNIGHTS_TOUR } from '@/i18n/routes';
import { SIZES } from '@/games/knights-tour/engine';
import { EULER_TOUR } from '@/games/knights-tour/euler';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import HowToPlay from './HowToPlay';
import KtFrame from './KtFrame';
import SizePicker from './SizePicker';
import TourBoard from './TourBoard';
import { practiceKey, useBestTimes, type RecordKey } from './records';
import { KT_CORNER } from './styles';
import { formatTime, sizeLabel } from './ui';

/**
 * 騎士巡遊的首頁（選模式）。整頁是一張印了銅版插圖的紙（KtFrame：紙邊、雙線框、右下角 Tab. I.），
 * 主視覺是「Fig. 1」：歐拉 1759 年論文裡那條 8×8 走法，用對局同一個棋盤畫（深格斜線、舊式數字、紅粉筆路徑）——
 * 不用另外畫插圖，也跟點進去的棋盤是同一套東西。
 *
 * 模式是兩張沒有框線的卡片：節目挑戰墨色（主要）、練習淡墨（次要），照 Wall Go 的兩種按鈕；規則放成文字連結。
 * 節目挑戰是真的 `<a href="#show">`（新分頁開也對），點擊在當下交給上層 pushState（WebKit 的返回鍵規則）。
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
  const card = 'flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]';

  return (
    <KtFrame className="items-center justify-center px-5 py-[max(1rem,3dvh)]">
      {/* 右上角的聯絡、語言：圓鈕與打開的彈窗都是這款的圖版（KT_CORNER），不是 Wall Go 的奶油底 */}
      <PlatformCorner locale={locale} theme={KT_CORNER} offset="calc(clamp(6px, 1.6vw, 14px) + var(--kt-frame, 8px) + 6px)" />
      <main className="flex w-full max-w-[420px] flex-col items-center pt-10 lg:max-w-[900px] lg:flex-row lg:items-center lg:gap-14 lg:pt-0">
        <header className="flex w-full flex-col items-center text-center lg:flex-1">
          <h1 className="flex flex-col items-center">
            <span className="text-[clamp(2.1rem,6.5dvh,3.5rem)] font-black leading-none tracking-[0.04em]">{t.title}</span>
            {t.subtitle && <span className="kt-serif mt-1 text-[clamp(1.1rem,3dvh,1.6rem)] italic">{t.subtitle}</span>}
          </h1>
          <p className="mt-[max(0.4rem,1.2dvh)] text-sm font-bold opacity-80 md:text-base">{t.tagline}</p>
          {/* Fig. 1：歐拉的走法 */}
          {/* 出處：歐拉 1759 年論文裡的走法（自己畫的）。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
          <div className="mt-[max(0.75rem,2.2dvh)] flex w-full flex-col items-center gap-1.5">
            <div className="w-[min(100%,17rem,30dvh)] lg:w-[min(100%,24rem)]">
              <TourBoard n={8} path={EULER_TOUR} showKnight={false} />
            </div>
          </div>
        </header>

        <div className="mt-[max(1rem,3dvh)] flex w-full flex-col gap-2.5 lg:mt-0 lg:w-[380px]">
          <a href={`${localePath(locale, KNIGHTS_TOUR)}#show`} onClick={(e) => { e.preventDefault(); onShow(); }}
            className={`${card} kt-chalk`}>
            <GiStopwatch aria-hidden="true" className="shrink-0 text-3xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.showMode}</span>
              <span className="kt-serif mt-0.5 block text-sm opacity-80">{t.showKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-70" />
          </a>
          <button type="button" onClick={() => setSizeOpen(true)} className={`${card} kt-plate`}>
            <GiChessKnight aria-hidden="true" className="shrink-0 text-3xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.practiceMode}</span>
              <span className="kt-serif mt-0.5 block text-sm opacity-75">{t.practiceKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
          </button>
          <button type="button" onClick={() => setHelpOpen(true)} className="self-center px-3 py-2 text-sm font-black underline decoration-1 underline-offset-4 opacity-80 transition before:mr-1.5 before:inline-block before:font-serif before:text-base before:italic before:content-['§'] hover:opacity-100">
            {t.rules}
          </button>
          {records.length > 0 && (
            <section className="w-full">
              <h2 className="text-xs font-black opacity-70">{t.best}</h2>
              <dl className="mt-1.5 flex flex-wrap gap-1.5">
                {records.map(({ key, name, ms }) => (
                  <div key={key} className="kt-plate flex items-baseline gap-1.5 px-3 py-1.5">
                    <dt className="text-xs font-bold opacity-75">{name}</dt>
                    <dd className="kt-serif text-sm font-semibold tabular-nums">{formatTime(ms)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>
      </main>

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SizePicker open={sizeOpen} onClose={() => setSizeOpen(false)} onPick={(n) => { setSizeOpen(false); onPractice(n); }} />
    </KtFrame>
  );
}
