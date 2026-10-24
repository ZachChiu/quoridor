import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getMessages } from '@/i18n';
import { pickText } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { NINE_MENS_MORRIS } from '@/i18n/routes';
import { TEXT } from '@/games/nine-mens-morris/text';
import { PieceGlyph } from './MorrisBoard';
import MorrisFrame from './MorrisFrame';
import { RulesStepsList } from './MorrisRules';
import MorrisWordmark from './MorrisWordmark';
import { MORRIS_CORNER } from './ui';

/**
 * 九子棋的規則頁（/nine-mens-morris/rules，六個語系共用；2026-10-25 Zach：「怎麼玩」要換成跟 Wall Go 一樣圖配字的頁面）。
 * 版面照 Wall Go 與虎羊棋的規則頁：置頂列（回九子棋首頁、字標、語言）＋ 一步一張附小棋盤的卡片，
 * 最後是名字的由來、一顆回首頁開一局的按鈕、圖示的署名。
 *
 * 整頁在《遊戲之書》的畫框裡（MorrisFrame：群青底、最外緣一圈朱紅框 —— 唯一的裝飾），卡片是首頁那種拱頂的羊皮紙。
 * 同一組步驟也在對局中的說明彈窗裡（一次一步、可以左右滑，MorrisRules.tsx）。
 * 回首頁用一般的 Link：九子棋裡面換頁不播轉場（CLAUDE.md）。
 */
export default function MorrisRulesPage({ locale }: { locale: Locale }) {
  const t = pickText(TEXT, locale);
  const m = getMessages(locale);
  const home = localePath(locale, NINE_MENS_MORRIS);

  return (
    <MorrisFrame>
      <header className="sticky top-0 z-40 border-b border-[#eee0c4]/15 bg-[#4b4577]/95 backdrop-blur">
        {/* 置頂列只放字標，名字寫在下面的大標（虎羊棋的教訓：同一排擠兩種文字的名字會亂） */}
        <div className="mx-auto grid max-w-[46rem] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2.5">
          <Link href={home} aria-label={t.home} title={t.home}
            className={`grid size-10 place-items-center justify-self-start rounded-full text-xl transition active:scale-95 ${MORRIS_CORNER.button}`}>
            <LuHouse aria-hidden="true" />
          </Link>
          <MorrisWordmark className="h-[1.15rem] w-auto text-[#eee0c4] sm:h-6" />
          <div className="justify-self-end"><LanguageSwitcher theme={MORRIS_CORNER} /></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[46rem] px-4 pb-[max(3rem,6svh)] pt-8 md:px-5">
        <p className="text-center text-xs font-bold tracking-wide text-[#eee0c4]/80">{t.tags}</p>
        <h1 className="mt-1.5 text-balance text-center text-[clamp(1.9rem,7vw,3rem)] font-black leading-[1.15] tracking-tight">{t.rulesTitle}</h1>

        <div className="mt-7"><RulesStepsList steps={t.steps} /></div>

        {/* 名字的由來與插圖出處（原本是說明彈窗的最後一段）。群青底上的段落符用羊皮紙色（朱紅疊群青只有 1.8:1） */}
        <p className="nmm-pilcrow mt-7 text-sm font-bold leading-relaxed text-[#eee0c4]/85 [--nmm-rubric:#eee0c4]">{t.nameNote}</p>

        <Link href={home} className="nmm-arch is-red mt-8 flex min-h-16 w-full items-center justify-center gap-3 px-4 pb-3 pt-4 text-lg font-black active:scale-[0.99]">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eee0c4]"><PieceGlyph side="black" className="size-6" /></span>
          {t.rulesCta}
        </Link>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-[#eee0c4]/80">
          {m.credits.prefix}{' '}
          <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
          {m.credits.middle}{' '}
          <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
          {m.credits.suffix}
        </p>
      </main>
    </MorrisFrame>
  );
}
