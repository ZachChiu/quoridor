import { LuHouse } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import Link from 'next/link';
import { RulesStepsList } from '@/components/bagh-chal/BaghRulesSteps';
import BaghFrame from '@/components/bagh-chal/BaghFrame';
import { BAGH_PRIMARY, BAGH_ROUND, BAGH_SECONDARY } from '@/components/bagh-chal/styles';
import { LocalToken, TigerToken } from '@/components/bagh-chal/tokens';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';

/**
 * Bagh Chal 的規則頁（六個語系共用），版面照 Wall Go 規則頁，整頁包在虎羊棋的畫框裡（BaghFrame）：
 * sticky 置頂列（回遊戲首頁、標題、語言）＋ 每一步一張附小棋盤的卡片，最後是開始玩的兩顆鈕。
 * 同一組步驟也在對局中的說明彈窗裡（一次一步）。
 */
export default function BaghRulesView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const b = t.baghChal;
  const cta = 'h-14 text-base';
  return (
    <BaghFrame variant="page">
      <header className="sticky top-0 z-40 border-b-2 border-[#4a2616]/10 bg-[#fbf4e1]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[46rem] items-center gap-3 px-4 py-2.5">
          {/* 虎羊棋裡面換頁不播轉場（開門特效只在平台進虎羊棋那一下），用一般的 Link */}
          <Link href={localePath(locale, baghChal())} aria-label={t.nav.backHome} className={BAGH_ROUND}>
            <LuHouse aria-hidden="true" />
          </Link>
          <span className="min-w-0 flex-1 truncate text-sm font-black">{b.subtitle} · {b.title}</span>
          <LanguageSwitcher skin="bagh" />
        </div>
      </header>

      <div className="mx-auto max-w-[46rem] px-5 pb-[max(3rem,6dvh)] pt-8">
        <p className="text-sm font-bold text-ink-soft">{b.title} · {b.tagline}</p>
        <h1 className="mt-1 text-[clamp(1.75rem,7vw,3rem)] font-black leading-[1.1] tracking-tight">{b.rulesMetaTitle}</h1>
        <div className="mt-6"><RulesStepsList rules={b.rules} /></div>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">{b.showNote}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href={localePath(locale, baghChal('/solo'))} className={`${BAGH_PRIMARY} ${cta}`}>
            <TigerToken className="text-[30px]" />{b.vsAi}
          </Link>
          <Link href={localePath(locale, baghChal('/local'))} className={`${BAGH_SECONDARY} ${cta}`}>
            <LocalToken className="text-[30px]" />{b.local}
          </Link>
        </div>
      </div>
    </BaghFrame>
  );
}
