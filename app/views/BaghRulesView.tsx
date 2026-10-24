import { LuHouse } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { RulesStepsList } from '@/components/bagh-chal/BaghRulesSteps';
import BaghFrame from '@/components/bagh-chal/BaghFrame';
import BaghWordmark from '@/components/bagh-chal/BaghWordmark';
import { BAGH_CORNER, BAGH_PRIMARY, BAGH_ROUND } from '@/components/bagh-chal/styles';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';

/**
 * Bagh Chal 的規則頁（六個語系共用），版面照 Wall Go 規則頁，整頁包在虎羊棋的畫框裡（BaghFrame）：
 * sticky 置頂列（回遊戲首頁、標題、語言）＋ 每一步一張附小棋盤的卡片，最後一顆鈕回遊戲首頁選玩法
 * （原本是「跟 AI 下」「本機對戰」兩顆，Zach 10/24：留一個按鈕導他回去首頁選就好）。
 * 同一組步驟也在對局中的說明彈窗裡（一次一步）。
 */
export default function BaghRulesView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const b = t.baghChal;
  return (
    <BaghFrame variant="page">
      <header className="sticky top-0 z-40 rounded-t-[9px] border-b-2 border-[#4a2616]/10 bg-[#fbf4e1]/95 backdrop-blur">
        {/* 置頂列只放字標（logo），名字寫在下面的大標 —— 同一排擠天城體＋中文、大標再一次中文＋英文，一眼三種文字（Zach 10/24：文案偏亂） */}
        <div className="mx-auto grid max-w-[46rem] grid-cols-[1fr_auto_1fr] items-center px-4 py-2.5">
          <Link href={localePath(locale, baghChal())} aria-label={t.nav.backHome} className={`${BAGH_ROUND} justify-self-start`}>
            <LuHouse aria-hidden="true" />
          </Link>
          <BaghWordmark className="h-6 w-auto" />
          <div className="justify-self-end"><LanguageSwitcher theme={BAGH_CORNER} /></div>
        </div>
      </header>

      <div className="mx-auto max-w-[46rem] px-5 pb-[max(3rem,6dvh)] pt-8">
        <h1 className="text-balance text-center text-[clamp(1.75rem,7vw,3rem)] font-black leading-[1.15] tracking-tight">{b.rulesTitle}</h1>
        <p className="mt-2 text-center text-sm font-bold text-ink-soft">{b.tagline}</p>
        <div className="mt-6"><RulesStepsList rules={b.rules} /></div>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">{b.showNote}</p>
        {/* 名字的由來（Zach 10/24：遊戲命名用 Netflix 版本，可以在遊戲規則裡面介紹） */}
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{b.nameNote}</p>
        <Link href={localePath(locale, baghChal())} className={`${BAGH_PRIMARY} mt-8 h-14 text-base`}>
          <LuHouse aria-hidden="true" className="text-xl" />{b.rulesCta}
        </Link>
      </div>
    </BaghFrame>
  );
}
