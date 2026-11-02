'use client';
import { useState } from 'react';
import Link from 'next/link';
import { GiPerspectiveDiceSixFacesRandom, GiRobotGolem, GiTabletopPlayers } from 'react-icons/gi';
import { LuChevronRight } from 'react-icons/lu';
import Modal from '@/components/Modal';
import ContactButton from '@/components/ContactButton';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import LocalName, { letteringOf } from '@/components/LocalName';
import PlatformMark from '@/components/PlatformMark';
import { brandName } from '@/brand';
import { useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { LEVELS, type Level } from '@/games/liars-dice/ai';
import { MAX_PLAYERS, MIN_PLAYERS } from '@/games/liars-dice/engine';
import { NAME_LETTERING } from '@/games/liars-dice/nameLettering';
import { TEXT } from '@/games/liars-dice/text';
import { useLatched } from '@/hook/useLatched';
import HowToModal from './HowToModal';
import LdFrame from './LdFrame';
import { MENU_CLASS, type DiceMode } from './modeHash';
import { LD_BAND, LD_CORNER, LD_PANEL } from './palette';

const PLAYER_COUNTS = Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => MIN_PLAYERS + i);

function ModeRow({ icon: Icon, title, desc, primary, onClick }: {
  icon: typeof GiRobotGolem; title: string; desc: string; primary?: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`ld-btn flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left ${primary ? 'is-ink' : 'is-soft'}`}>
      <Icon aria-hidden="true" className="shrink-0 text-3xl" />
      <span className="min-w-0 flex-1">
        <span className="block text-base leading-tight">{title}</span>
        <span className="mt-0.5 block text-xs font-bold leading-snug opacity-75">{desc}</span>
      </span>
      <LuChevronRight aria-hidden="true" className="shrink-0 text-xl opacity-60" />
    </button>
  );
}

/** 彈窗（棉線色的紙）裡的一組選項：選中的那個是深色布 */
function Choice({ on, onClick, children, className = '' }: { on: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`ld-btn min-h-11 px-3 py-2 text-sm ${on ? 'is-on' : 'is-paper'} ${className}`}>
      {children}
    </button>
  );
}

function Toggle({ on, onClick, title, desc }: { on: boolean; onClick: () => void; title: string; desc: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[3px] py-1.5 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black">{title}</span>
        <span className="mt-0.5 block text-xs font-bold leading-snug opacity-70">{desc}</span>
      </span>
      {/* 開關是一小段階梯方格：開的時候黃的那格在右邊 */}
      <span aria-hidden="true" className={`flex h-6 w-11 shrink-0 items-center rounded-[3px] p-0.5 transition ${on ? 'bg-[#8a3536]' : 'bg-[#2e1822]/25'}`}>
        <span className={`block size-5 rounded-[2px] bg-[#d4b98f] transition ${on ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}

/**
 * 選模式的畫面（/liars-dice 沒帶 hash 時）。整頁包在披風畫框裡（LdFrame），最上面一排是平台 logo 與聯絡／語言 ——
 * 照時間拍賣，排在頁面裡、跟著捲，不是浮在畫面角落（11/3 Zach：各遊戲首頁的回饋與語系不要浮著）。
 * 主視覺就是那件披風本身（大都會博物館，CC0），出處寫在「怎麼玩」裡。
 * 開一桌的彈窗：人數 2–6（對電腦時自己以外都是電腦）、電腦強度、兩個規則開關。
 */
export default function DiceMenu({ locale, onStart }: { locale: Locale; onStart: (m: DiceMode) => void }) {
  const t = useTextTable(TEXT);
  const [setupFor, setSetupFor] = useState<'ai' | 'local' | null>(null);
  const shownFor = useLatched(setupFor);
  const [howOpen, setHowOpen] = useState(false);
  const [players, setPlayers] = useState(4);
  const [level, setLevel] = useState<Level>('normal');
  const [wild, setWild] = useState(true);
  const [exact, setExact] = useState(false);
  const lettering = letteringOf(NAME_LETTERING, locale, t.title);

  const begin = () => {
    const kind = setupFor;
    setSetupFor(null);
    if (kind === 'ai') onStart({ opponent: 'ai', players, level, wild, exact });
    else if (kind === 'local') onStart({ opponent: 'local', players, wild, exact });
  };

  return (
    <LdFrame className={`${MENU_CLASS} items-center px-4 pb-6 pt-3 lg:px-10 lg:pb-12`}>
      <div className="flex w-full max-w-[440px] items-center justify-between lg:max-w-[960px]">
        <Link href={localePath(locale, '/')} aria-label={brandName(locale)} title={brandName(locale)} className="transition active:scale-95">
          <PlatformMark mono />
        </Link>
        <div className="flex gap-1">
          <ContactButton theme={LD_CORNER} />
          <LanguageSwitcher theme={LD_CORNER} />
        </div>
      </div>

      <main className="mt-4 flex w-full max-w-[440px] flex-1 flex-col lg:my-auto lg:max-w-[960px] lg:flex-none lg:flex-row lg:items-center lg:gap-12">
        <div className="lg:flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，不需要 next/image */}
          <img src="/games/liars-dice/uncu.webp" alt="" aria-hidden="true" width={960} height={720}
            className="h-[min(13rem,26svh)] w-full rounded-[2px] object-cover lg:h-auto" />
        </div>
        <div className="mt-4 flex flex-col lg:mt-0 lg:w-[400px] lg:shrink-0">
          <p className="text-xs font-black tracking-wide opacity-70">{t.subtitle}</p>
          <h1 className="mt-1.5 text-[clamp(2.4rem,7svh,3.6rem)] font-black leading-[1.02] tracking-wide">
            {lettering ? <><span className="sr-only">{t.title}</span><LocalName data={lettering} /></> : t.title}
          </h1>
          <p className="mt-2 text-sm font-bold leading-relaxed lg:text-base">{t.tagline}</p>

          <nav aria-label={t.title} className="mt-5 flex flex-col gap-2.5">
            <ModeRow primary icon={GiRobotGolem} title={t.vsAi} desc={t.vsAiDesc} onClick={() => setSetupFor('ai')} />
            <ModeRow icon={GiTabletopPlayers} title={t.local} desc={t.localDesc} onClick={() => setSetupFor('local')} />
          </nav>
          <button type="button" onClick={() => setHowOpen(true)}
            className="mt-3 self-center px-3 py-2 text-sm font-bold underline decoration-[#c9b17b] decoration-2 underline-offset-4 opacity-85 lg:self-start">
            {t.howTo}
          </button>
        </div>
      </main>

      <Modal isOpen={setupFor !== null} onClose={() => setSetupFor(null)} title={t.setupKicker}
        kicker={shownFor === 'local' ? t.local : t.vsAi} icon={GiPerspectiveDiceSixFacesRandom}
        band={LD_BAND} panelClassName={LD_PANEL}
        footer={<button type="button" onClick={begin} className="ld-btn is-red flex-1 py-3.5 text-base">{t.start}</button>}>
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-1.5 text-sm font-black opacity-70">{t.players}</legend>
            <div role="radiogroup" aria-label={t.players} className="grid grid-cols-5 gap-1.5">
              {PLAYER_COUNTS.map((n) => <Choice key={n} on={players === n} onClick={() => setPlayers(n)}>{n}</Choice>)}
            </div>
          </fieldset>
          {shownFor !== 'local' && (
            <fieldset>
              <legend className="mb-1.5 text-sm font-black opacity-70">{t.level}</legend>
              <div role="radiogroup" aria-label={t.level} className="grid grid-cols-3 gap-1.5">
                {LEVELS.map((lv) => (
                  <Choice key={lv} on={level === lv} onClick={() => setLevel(lv)} className="flex flex-col items-center !py-2.5">
                    <span className="text-base">{t.levels[lv].name}</span>
                  </Choice>
                ))}
              </div>
              <p className="mt-1.5 text-xs font-bold opacity-70">{t.levels[level].desc}</p>
            </fieldset>
          )}
          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-black opacity-70">{t.rulesLabel}</legend>
            <Toggle on={wild} onClick={() => setWild((v) => !v)} title={t.wild} desc={t.wildDesc} />
            <Toggle on={exact} onClick={() => setExact((v) => !v)} title={t.exact} desc={t.exactDesc} />
          </fieldset>
        </div>
      </Modal>

      <HowToModal open={howOpen} onClose={() => setHowOpen(false)} credit />
    </LdFrame>
  );
}
