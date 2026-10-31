import Link from 'next/link';
import { GiChessKnight } from 'react-icons/gi';
import { LuHouse } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import KtFrame from '@/components/knights-tour/KtFrame';
import { RulesStepsList } from '@/components/knights-tour/RulesSteps';
import { KT_CORNER } from '@/components/knights-tour/styles';
import { getMessages } from '@/i18n';
import { pickText } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { KNIGHTS_TOUR } from '@/i18n/routes';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';

/**
 * 騎士巡遊的規則頁（/knights-tour/rules，六個語系共用）。2026-10-25 Zach：「怎麼玩最好跟 Wall Go 一樣圖配字」。
 *
 * 整頁是書裡的第二張銅版圖版（KtFrame，右下角 Tab. II.）：一步一張圖（Fig. 1–6，對局用的棋盤畫的靜態局面）＋小標＋一段字，
 * 同一組步驟也在對局中的說明彈窗裡（一次一步，RulesSteps.tsx）。最後是出處、名字的由來、一顆回這款首頁選模式的鈕、署名。
 * 裝飾只有最外緣那圈雙線框；步驟之間只隔一道淡墨細線（書頁的分隔，不是框）。
 * 這款裡面換頁不播轉場：用一般的 Link（不是 TransitionLink）。
 */
export default function KnightsTourRulesView({ locale }: { locale: Locale }) {
  const t = pickText<KnightsText>(TEXT, locale);
  const m = getMessages(locale);
  const home = localePath(locale, KNIGHTS_TOUR);
  return (
    <KtFrame tab="Tab. II.">
      {/* 頂列：左邊回這款首頁、右邊語言（同首頁右上角那顆，KT_CORNER）。不寫標題 —— 大標就在下面 */}
      <div className="flex items-center justify-between px-3 pt-3 md:px-4 md:pt-4">
        {/* 40px，跟右邊語言那顆一樣大（對局裡的方鈕是 44px） */}
        <Link href={home} aria-label={m.nav.backHome} className="kt-plate grid size-10 shrink-0 place-items-center text-xl active:scale-95"><LuHouse aria-hidden="true" /></Link>
        <LanguageSwitcher theme={KT_CORNER} />
      </div>

      <main className="mx-auto w-full max-w-[46rem] px-5 pb-[max(3.5rem,7svh)] pt-4 md:pt-2">
        <header className="text-center">
          <h1 className="text-balance text-[clamp(1.9rem,7vw,3rem)] font-black leading-[1.15] tracking-[0.02em]">{t.rulesTitle}</h1>
          {t.subtitle && <p className="kt-serif mt-1 text-lg italic md:text-xl">{t.subtitle}</p>}
          <p className="mt-3 text-sm font-bold opacity-80 md:text-base">{t.tagline}</p>
        </header>

        <div className="mt-9"><RulesStepsList /></div>

        <section className="mt-2 border-t border-[#322e2a]/25 pt-6 text-sm leading-relaxed opacity-80">
          <p>{t.source}</p>
          {/* 名字的由來（Zach 10/24：遊戲名照 Netflix 版本，在規則裡介紹） */}
          <p className="mt-2">{t.nameNote}</p>
        </section>

        <Link href={home} className="kt-chalk mt-8 flex h-14 w-full items-center justify-center gap-2.5 px-4 text-base font-black active:scale-[0.99]">
          <GiChessKnight aria-hidden="true" className="shrink-0 text-2xl" />{t.rulesCta}
        </Link>

        <p className="mt-8 text-center text-[11px] leading-relaxed opacity-70">
          {m.credits.prefix}{' '}
          <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
          {m.credits.middle}{' '}
          <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
          {m.credits.suffix}
        </p>
      </main>
    </KtFrame>
  );
}
