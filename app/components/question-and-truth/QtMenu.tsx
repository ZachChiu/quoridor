'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GiCardAceDiamonds, GiCalendar, GiRobotGolem, GiSixEyes, GiTabletopPlayers } from 'react-icons/gi';
import { LuChevronRight } from 'react-icons/lu';
import Modal from '@/components/Modal';
import ContactButton from '@/components/ContactButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LocalName, { letteringOf } from '@/components/LocalName';
import PlatformMark from '@/components/PlatformMark';
import { brandName } from '@/brand';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { LEVELS, type Level } from '@/games/question-and-truth/ai';
import { localDate } from '@/games/question-and-truth/challenge';
import { NAME_LETTERING } from '@/games/question-and-truth/nameLettering';
import { TEXT } from '@/games/question-and-truth/text';
import { useLatched } from '@/hook/useLatched';
import HowToModal from './HowToModal';
import QtFrame from './QtFrame';
import { MENU_CLASS, type QtMode } from './modeHash';
import { QT_BAND, QT_CORNER, QT_PANEL } from './palette';
import { useDailyDone } from './records';

function ModeRow({ icon: Icon, title, desc, primary, onClick, badge }: {
  icon: typeof GiRobotGolem; title: string; desc: string; primary?: boolean; onClick: () => void; badge?: string | null;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`qt-btn flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left ${primary ? 'is-ink' : 'is-soft'}`}>
      <Icon aria-hidden="true" className="shrink-0 text-3xl" />
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-tight lg:text-lg">{title}</span>
        <span className="mt-0.5 block text-xs font-bold leading-snug opacity-75 lg:text-sm">{badge ?? desc}</span>
      </span>
      <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
    </button>
  );
}

/**
 * 選模式的畫面（/question-and-truth 沒帶 hash 時）。最上面一排平台 logo 與聯絡／語言，**排在頁面裡跟著捲**（11/3 Zach：各遊戲首頁的回饋與語系不要浮著）。
 * 主視覺就是〈方塊 A 的老千〉本身（羅浮宮，公有領域），出處寫在「怎麼玩」裡。
 * 兩組：節目版（對電腦、同一台兩人）、自己的挑戰（每日一手、六問一猜）。桌機左邊整幅畫、右邊選單，不留大片空底。
 */
export default function QtMenu({ locale, onStart }: { locale: Locale; onStart: (m: QtMode) => void }) {
  const t = useTextTable(TEXT);
  const [setup, setSetup] = useState(false);
  const shown = useLatched(setup ? true : null);
  const [howOpen, setHowOpen] = useState(false);
  const [level, setLevel] = useState<Level>('normal');
  const lettering = letteringOf(NAME_LETTERING, locale, t.title);
  const done = useDailyDone(localDate());

  return (
    <QtFrame className={`${MENU_CLASS} items-center px-4 pb-6 pt-3 lg:px-10 lg:pb-10`}>
      <div className="flex w-full max-w-[460px] items-center justify-between lg:max-w-[1240px]">
        <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition active:scale-95">
          <PlatformMark mono />
        </Link>
        <div className="flex gap-1">
          <ContactButton theme={QT_CORNER} />
          <LanguageSwitcher theme={QT_CORNER} />
        </div>
      </div>

      <main className="mt-3 flex w-full max-w-[460px] flex-1 flex-col lg:mt-6 lg:max-w-[1240px] lg:flex-row lg:items-stretch lg:gap-12">
        <div className="relative lg:min-h-[560px] lg:flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
          <img src="/games/question-and-truth/latour.webp" alt="" aria-hidden="true" width={1600} height={1161}
            className="h-[min(14rem,27svh)] w-full rounded-[3px] object-cover object-[50%_38%] lg:absolute lg:inset-0 lg:h-full" />
        </div>
        <div className="mt-4 flex flex-col lg:mt-0 lg:w-[420px] lg:shrink-0 lg:justify-center">
          <p className="text-xs font-black tracking-wide text-[var(--qt-gold)] lg:text-sm">{t.subtitle}</p>
          <h1 className="mt-1.5 text-[clamp(2.2rem,6.5svh,3.6rem)] font-black leading-[1.05] tracking-wide">
            {lettering ? <><span className="sr-only">{t.title}</span><LocalName data={lettering} /></> : t.title}
          </h1>
          <p className="mt-2 text-sm font-bold leading-relaxed lg:text-base">{t.tagline}</p>

          <nav aria-label={t.title} className="mt-5 flex flex-col gap-2.5">
            <p className="text-xs font-black tracking-wide text-[var(--qt-gold)]">{t.showLabel}</p>
            <ModeRow primary icon={GiRobotGolem} title={t.vsAi} desc={t.vsAiDesc} onClick={() => setSetup(true)} />
            <ModeRow icon={GiTabletopPlayers} title={t.local} desc={t.localDesc} onClick={() => onStart({ kind: 'local' })} />
            <p className="mt-2 text-xs font-black tracking-wide text-[var(--qt-gold)]">{t.challengeLabel}</p>
            <ModeRow icon={GiCalendar} title={t.daily} desc={t.dailyDesc} badge={done !== null ? fill(t.dailyDone, { n: done }) : null} onClick={() => onStart({ kind: 'daily' })} />
            <ModeRow icon={GiSixEyes} title={t.six} desc={t.sixDesc} onClick={() => onStart({ kind: 'six' })} />
          </nav>
          <button type="button" onClick={() => setHowOpen(true)}
            className="mt-3 self-center px-3 py-2 text-sm font-bold underline decoration-[var(--qt-gold)] decoration-2 underline-offset-4 opacity-85 lg:self-start">
            {t.howTo}
          </button>
        </div>
      </main>

      <Modal isOpen={setup} onClose={() => setSetup(false)} title={t.level} kicker={t.setupKicker} icon={GiCardAceDiamonds}
        band={QT_BAND} panelClassName={QT_PANEL}
        footer={<button type="button" onClick={() => { setSetup(false); onStart({ kind: 'ai', level }); }} className="qt-btn is-ink-on-paper flex-1 py-3.5 text-base">{t.start}</button>}>
        {shown && (
          <div role="radiogroup" aria-label={t.level} className="flex flex-col gap-1.5">
            {LEVELS.map((lv) => (
              <button key={lv} type="button" role="radio" aria-checked={level === lv} onClick={() => setLevel(lv)}
                className={`qt-btn flex flex-col items-start px-4 py-3 text-left ${level === lv ? 'is-on' : 'is-paper'}`}>
                <span className="text-base">{t.levels[lv].name}</span>
                <span className="mt-0.5 text-xs font-bold opacity-75">{t.levels[lv].desc}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <HowToModal open={howOpen} onClose={() => setHowOpen(false)} credit />
    </QtFrame>
  );
}
