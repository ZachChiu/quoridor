import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getMessages } from '@/i18n';
import { pickText } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { BLIND_GOMOKU } from '@/i18n/routes';
import { TEXT } from '@/games/blind-gomoku/text';
import GomokuFrame from './GomokuFrame';
import { GMK_CORNER } from './palette';
import { RulesStepsList } from './RulesSteps';

/**
 * 盲五子棋的規則頁（/blind-gomoku/rules，六個語系共用）。2026-10-25 Zach：「後面那幾款『怎麼玩』都沒有換新頁，最好跟 Wall Go 一樣圖配字」。
 *
 * 版面照 Wall Go 的規則頁與虎棋的規則頁：置頂列（回這款首頁、名字、語言）＋ 一步一張卡片（圖配字）＋ 出處、名字的由來 ＋
 * 一顆回這款首頁選玩法的按鈕 ＋ 署名。整頁包在包袱巾的畫框裡（GomokuFrame：裝飾只有最外緣一圈布條），
 * 卡片與按鈕是這款自己的布（globals.css 的 .gmk-*）。同一組步驟也在對局中的說明彈窗裡（RulesSteps.tsx，一次一步、可以左右滑）。
 *
 * 這款裡面換頁不播轉場：回首頁用一般的 Link。置頂列不放平台 logo 與聯絡我們（那是遊戲首頁才有的，見 PlatformCorner）。
 */
export default function RulesPage({ locale }: { locale: Locale }) {
  const t = pickText(TEXT, locale);
  const m = getMessages(locale);
  const home = localePath(locale, BLIND_GOMOKU);
  return (
    <GomokuFrame>
      {/* 置頂列：底下一道平針縫跟內容隔開 */}
      <header className="sticky top-0 z-40 border-b-[1.5px] border-dashed border-[#2a2525]/25 bg-[#e4d6bb]">
        <div className="mx-auto grid max-w-[46rem] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5">
          <Link href={home} aria-label={m.nav.backHome}
            className="gmk-patch is-ramie grid size-11 place-items-center justify-self-start text-xl text-ink-soft active:scale-95">
            <LuHouse aria-hidden="true" />
          </Link>
          <span className="min-w-0 truncate text-base font-black">{t.title}</span>
          <div className="justify-self-end"><LanguageSwitcher theme={GMK_CORNER} /></div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[46rem] px-5 pb-[max(3rem,6svh)] pt-8">
        <header className="text-center">
          <p className="text-xs font-black tracking-wide text-ink-soft">{t.tags}</p>
          <h1 className="mt-1.5 text-balance text-[clamp(1.75rem,7vw,3rem)] font-black leading-[1.15] tracking-tight">{t.rulesTitle}</h1>
          <p className="mx-auto mt-3 max-w-[34rem] text-pretty text-base font-bold leading-relaxed">{t.rulesIntro}</p>
        </header>

        <div className="mt-8"><RulesStepsList steps={t.steps} /></div>

        {/* 出處，再一段名字的由來（glossary〈遊戲名〉：遊戲名照節目，在規則裡介紹） */}
        <p className="mt-8 text-sm leading-relaxed text-ink-soft">{t.showNote}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{t.nameNote}</p>

        {/* 讀完之後的出口：回這款首頁選玩法（同虎棋規則頁：一顆就好，不在這裡再列一次模式） */}
        <Link href={home} className="gmk-patch is-pieced mt-8 flex h-14 items-center justify-center gap-2 text-base font-black active:scale-[0.99]">
          <LuHouse aria-hidden="true" className="text-xl" />{t.rulesCta}
        </Link>

        {/* 署名：圖示（CC BY 3.0 要求署名）與主視覺、棋子顏色的出處 */}
        <p className="mt-8 text-center text-[11px] leading-relaxed text-ink-soft">
          {m.credits.prefix}{' '}
          <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
          {m.credits.middle}{' '}
          <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
          {m.credits.suffix}
        </p>
        <p className="mt-1 text-center text-[11px] leading-relaxed text-ink-soft">{t.artCredit}</p>
      </div>
    </GomokuFrame>
  );
}
