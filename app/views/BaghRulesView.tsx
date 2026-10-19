import { GiHut } from 'react-icons/gi';
import { LuBot, LuUsers } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import TransitionLink from '@/components/TransitionLink';
import { RulesStepsList } from '@/components/bagh-chal/BaghRulesSteps';
import { getMessages } from '@/i18n';
import { localePath, type Locale } from '@/i18n/locales';
import { baghChal } from '@/i18n/routes';

/**
 * Bagh Chal 的規則頁（六個語系共用），版面照 Wall Go 規則頁：
 * sticky 置頂列（回遊戲首頁、標題、語言）＋ 每一步一張附小棋盤的卡片，最後是開始玩的兩顆鈕。
 * 同一組步驟也在對局中的說明彈窗裡（一次一步）。
 */
export default function BaghRulesView({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const b = t.baghChal;
  const cta = 'flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-black transition hover:brightness-95 active:scale-[0.98]';
  return (
    <div className="min-h-dvh font-[family-name:var(--font-app)]">
      <header className="bg-primary/95 sticky top-0 z-40 border-b-2 border-tile-ink/[0.07] backdrop-blur">
        <div className="mx-auto flex max-w-[46rem] items-center gap-3 px-4 py-2.5">
          <TransitionLink href={localePath(locale, baghChal())} color="rgb(var(--tile-cream))" radius={24} aria-label={t.nav.backHome}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-50 text-xl text-tile-ink shadow-[0_1px_6px_rgba(20,16,16,0.12)] ring-2 ring-tile-ink/10 transition hover:brightness-95">
            <GiHut />
          </TransitionLink>
          <span className="min-w-0 flex-1 truncate text-sm font-black">{b.title} · {b.subtitle}</span>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="mx-auto max-w-[46rem] px-5 pb-[max(3rem,6dvh)] pt-8">
        <p className="text-sm font-bold text-ink-soft">{b.title} · {b.tagline}</p>
        <h1 className="mt-1 text-[clamp(1.75rem,7vw,3rem)] font-black leading-[1.1] tracking-tight">{b.rulesMetaTitle}</h1>
        <div className="mt-6"><RulesStepsList rules={b.rules} /></div>
        <p className="mt-6 text-sm leading-relaxed text-ink-soft">{b.showNote}</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <TransitionLink href={localePath(locale, baghChal('/solo'))} color="rgb(var(--tile-ink))" className={`${cta} bg-tile-ink text-tile-cream`}>
            <LuBot aria-hidden="true" />{b.vsAi}
          </TransitionLink>
          <TransitionLink href={localePath(locale, baghChal('/local'))} color="rgb(var(--tile-cream))" className={`${cta} bg-tile-ink/[0.07] text-tile-ink`}>
            <LuUsers aria-hidden="true" />{b.local}
          </TransitionLink>
        </div>
      </div>
    </div>
  );
}
