'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GiReturnArrow, GiStopwatch } from 'react-icons/gi';
import KnightSvg from './KnightSvg';
import { LuChevronRight } from 'react-icons/lu';
import LocalName, { letteringOf } from '@/components/LocalName';
import GameHomeBar from '@/components/GameHomeBar';
import { useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { KNIGHTS_TOUR, trialRules } from '@/i18n/routes';
import { canClose, SIZES } from '@/games/knights-tour/engine';
import { EULER_TOUR } from '@/games/knights-tour/euler';
import { NAME_LETTERING } from '@/games/knights-tour/nameLettering';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import KtFrame from './KtFrame';
import SizePicker from './SizePicker';
import TourBoard from './TourBoard';
import { closedKey, practiceKey, useBestTimes, type RecordKey } from './records';
import { KT_CORNER } from './styles';
import { formatTime, sizeLabel } from './ui';

/**
 * 騎士巡遊的首頁（選模式）。整頁是一張印了銅版插圖的紙（KtFrame：紙邊、雙線框、右下角 Tab. I.），
 * 主視覺是「Fig. 1」：歐拉 1759 年論文裡那條 8×8 走法，用對局同一個棋盤畫（深格斜線、舊式數字、紅粉筆路徑）——
 * 不用另外畫插圖，也跟點進去的棋盤是同一套東西。
 *
 * 模式是沒有框線的卡片：節目挑戰墨色（主要）、練習與封閉巡遊淡墨（次要），照 Wall Go 的兩種按鈕；規則放成文字連結，
 * 連到規則頁（/knights-tour/rules，2026-10-25 起不再開彈窗；一般的 Link，這款裡面換頁不播轉場）。
 * 節目挑戰是真的 `<a href="#show">`（新分頁開也對），點擊在當下交給上層 pushState（WebKit 的返回鍵規則）。
 * 字級、間距、插圖跟著畫面高度縮放時用 svh 不用 dvh：往下捲、工具列收起時 dvh 變大，字和圖會跟著放大。
 */
export default function KnightsTourMenu({ locale, onShow, onPractice, onClosed }: {
  locale: Locale;
  onShow: () => void;
  onPractice: (n: number) => void;
  onClosed: (n: number) => void;
}) {
  const t = useTextTable<KnightsText>(TEXT);
  // 中日韓泰的標題用同一種風格的字（宋體／明朝）寫成的字標，平台卡片用的是同一份；英文照舊用字型
  const lettering = letteringOf(NAME_LETTERING, locale, t.title);
  const best = useBestTimes();
  /** 選大小的彈窗：練習、回到原點共用同一個，只差單數邊能不能選（關的時候 sizeFor 不清，淡出時字不會跳回練習） */
  const [sizeOpen, setSizeOpen] = useState(false);
  const [sizeFor, setSizeFor] = useState<'practice' | 'closed'>('practice');
  const pickSize = (kind: 'practice' | 'closed') => { setSizeFor(kind); setSizeOpen(true); };
  const records = ([
    ['show', t.showMode],
    ...SIZES.map((n) => [practiceKey(n), sizeLabel(n)]),
    ...SIZES.filter(canClose).map((n) => [closedKey(n), `${t.closedMode} ${sizeLabel(n)}`]),
  ] as [RecordKey, string][])
    .flatMap(([key, name]) => { const ms = best[key]; return ms === undefined ? [] : [{ key, name, ms }]; });
  const card = 'flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]';

  return (
    <KtFrame className="items-center px-5 pb-[max(1rem,3svh)] pt-2">
      {/* 最上面一列：平台 logo、聯絡、語言（GameHomeBar），跟內容同寬、排在流裡（11/3 Zach：跟時間拍賣一樣、不要浮著）。
          圓鈕與打開的彈窗都是這款的圖版（KT_CORNER），不是 Wall Go 的奶油底 */}
      <GameHomeBar locale={locale} theme={KT_CORNER} className="max-w-[420px] lg:max-w-[900px]" />
      {/* 桌機兩欄：左邊標題、小字、Fig. 1，右邊模式卡片從 Fig. 1 的上緣開始排（11/7 Zach：「節目挑戰對齊左邊棋盤」）。
          header 在桌機拆成 grid 的三格（contents），卡片放在第三列、跟 Fig. 1 同一列、靠上 */}
      <main className="my-auto flex w-full max-w-[420px] flex-col items-center pt-4 lg:grid lg:max-w-[900px] lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-x-14 lg:pt-0">
        <header className="flex w-full flex-col items-center text-center lg:contents">
          <h1 className="flex w-full flex-col items-center text-center lg:col-start-1">
            {lettering ? (
              <>
                <span className="sr-only">{t.title}</span>
                <LocalName data={lettering} className="justify-center text-[clamp(2.1rem,6.5svh,3.5rem)]" />
              </>
            ) : (
              <span className="text-[clamp(2.1rem,6.5svh,3.5rem)] font-black leading-none tracking-[0.04em]">{t.title}</span>
            )}
            {t.subtitle && <span className="kt-serif mt-1 text-[clamp(1.1rem,3svh,1.6rem)] italic">{t.subtitle}</span>}
          </h1>
          <p className="mt-[max(0.4rem,1.2svh)] text-center text-sm font-bold opacity-80 md:text-base lg:col-start-1">{t.tagline}</p>
          {/* Fig. 1：歐拉的走法 */}
          {/* 出處：歐拉 1759 年論文裡的走法（自己畫的）。畫面上不寫出處（Zach 10/24：插圖不要說明） */}
          <div className="mt-[max(0.75rem,2.2svh)] flex w-full flex-col items-center gap-1.5 lg:col-start-1 lg:row-start-3">
            <div className="w-[min(100%,17rem,30svh)] lg:w-[min(100%,24rem)]">
              <TourBoard n={8} path={EULER_TOUR} showKnight={false} />
            </div>
          </div>
        </header>

        <div className="mt-[max(1rem,3svh)] flex w-full flex-col gap-2.5 lg:col-start-2 lg:row-start-3 lg:mt-[max(0.75rem,2.2svh)] lg:w-[380px]">
          <a href={`${localePath(locale, KNIGHTS_TOUR)}#show`} onClick={(e) => { e.preventDefault(); onShow(); }}
            className={`${card} kt-chalk`}>
            <GiStopwatch aria-hidden="true" className="shrink-0 text-3xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.showMode}</span>
              <span className="kt-serif mt-0.5 block text-sm opacity-80">{t.showKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-70" />
          </a>
          <button type="button" onClick={() => pickSize('practice')} className={`${card} kt-plate`}>
            {/* 對局裡那隻銅版畫騎士（11/1 Zach） */}
            <KnightSvg className="size-9 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.practiceMode}</span>
              <span className="kt-serif mt-0.5 block text-sm opacity-75">{t.practiceKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
          </button>
          {/* 封閉巡遊（先前叫「回到原點」）：走完每一格、最後一步跳回起點（docs/puzzle-reels.md B） */}
          <button type="button" onClick={() => pickSize('closed')} className={`${card} kt-plate`}>
            <GiReturnArrow aria-hidden="true" className="shrink-0 text-3xl" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black leading-tight">{t.closedMode}</span>
              <span className="kt-serif mt-0.5 block text-sm opacity-75">{t.closedKicker}</span>
            </span>
            <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
          </button>
          <Link href={localePath(locale, trialRules(KNIGHTS_TOUR))} className="self-center px-3 py-2 text-sm font-black underline decoration-1 underline-offset-4 opacity-80 transition before:mr-1.5 before:inline-block before:font-serif before:text-base before:italic before:content-['§'] hover:opacity-100">
            {t.rules}
          </Link>
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

      <SizePicker open={sizeOpen} closed={sizeFor === 'closed'} onClose={() => setSizeOpen(false)}
        onPick={(n) => { setSizeOpen(false); if (sizeFor === 'closed') onClosed(n); else onPractice(n); }} />
    </KtFrame>
  );
}
