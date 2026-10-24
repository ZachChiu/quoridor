import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { RulesStepsList } from '@/components/time-auction/AuctionRulesSteps';
import TauFrame from '@/components/time-auction/TauFrame';
import TauWordmark from '@/components/time-auction/TauWordmark';
import { TAU_CORNER, roundBtn } from '@/components/time-auction/theme';
import { MODES, type Mode } from '@/games/time-auction/engine';
import { PRESS_WAIT_MS } from '@/games/time-auction/online';
import { TEXT } from '@/games/time-auction/text';
import { getMessages } from '@/i18n';
import { fill, pickText } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { TIME_AUCTION } from '@/i18n/routes';

/**
 * 時間拍賣的規則頁（/time-auction/rules，六個語系共用）。2026-10-25 Zach：「怎麼玩都沒有換新頁，最好跟 Wall Go 一樣圖配字」。
 *
 * 整頁是同一張拍賣傳單（TauFrame：報紙色的紙、最外緣紅色牛津角框，唯一的裝飾）。版面照 Wall Go／虎棋的規則頁：
 * sticky 置頂列（回這款首頁、字標、語言）＋ 七條規則一條一張圖（AuctionRulesSteps 的 RulesStepsList，對局中的說明彈窗是同一份）。
 * 條款寫成拍賣目錄的樣子：羅馬數字、條與條之間一道雙線。
 *
 * 時間照節目局寫（每人 10 分鐘、倒數 5 秒），頁首一句講明；快速局的差別、連線、名字由來、署名放在最後。
 * 最下面一顆紅色版塊回這款首頁去選模式開拍。這款裡面換頁不播轉場（Zach 10/24），所以是一般的 Link。
 */
const PAGE_MODE: Mode = 'show';

export default function TimeAuctionRulesView({ locale }: { locale: Locale }) {
  const t = pickText(TEXT, locale);
  const m = getMessages(locale);
  const home = localePath(locale, TIME_AUCTION);
  const show = MODES[PAGE_MODE];
  const latinTitle = t.nameEn === t.title;
  const modes = [
    { name: t.modeShow, note: t.modeShowNote, body: t.rulesShow },
    { name: t.modeQuick, note: t.modeQuickNote, body: t.rulesQuick },
  ];

  return (
    <TauFrame>
      <header className="sticky top-0 z-40 border-b-[3px] border-double border-[#35331c]/55 bg-[#ebe1b8]/95 backdrop-blur">
        <div className="mx-auto grid max-w-[46rem] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5">
          <Link href={home} aria-label={t.home} title={t.home} className={`${roundBtn} justify-self-start`}>
            <LuHouse aria-hidden="true" />
          </Link>
          <TauWordmark className="h-5 w-auto" />
          <div className="justify-self-end"><LanguageSwitcher theme={TAU_CORNER} /></div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[46rem] px-5 pb-[max(3rem,6svh)] pt-8">
        <header className="text-center">
          <p className="text-xs font-bold tracking-wide text-ink-soft">{t.tag}</p>
          <h1 className="mt-2 text-balance text-[clamp(1.75rem,7vw,2.75rem)] font-black leading-[1.15] tracking-tight">{t.rulesTitle}</h1>
          {!latinTitle && <p className="sr-only">{t.nameEn}</p>}
          <p className="mt-2 text-sm font-bold">{t.tagline}</p>
          <p className="mx-auto mt-4 max-w-lg text-sm font-bold leading-relaxed text-ink-soft">
            {fill(t.rulesAsShow, { budget: fill(t.minutes, { n: show.budget / 600 }), countdown: show.countdownMs / 1000 })}
          </p>
        </header>

        <div className="mt-8 border-b-[3px] border-double border-[#35331c]/55">
          <RulesStepsList mode={PAGE_MODE} />
        </div>

        {/* 兩種模式：節目局（上面用的）、快速局。墨色雙線的框，同設定頁的模式票但不能按 */}
        <section className="mt-10">
          <h2 className="tau-head text-ink-soft">{t.modeLabel}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {modes.map((md) => (
              <div key={md.name} className="tau-box px-5 py-4">
                <h3 className="text-lg font-black">{md.name}</h3>
                <p className="mt-0.5 text-xs font-bold text-ink-soft">{md.note}</p>
                <p className="mt-2 text-sm font-bold leading-relaxed">{md.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 邀請朋友（連線）：坐滿才開拍、等人按住的規則、時間以伺服器為準 */}
        <section className="mt-10">
          <h2 className="tau-head text-ink-soft">{t.onlineTitle}</h2>
          <p className="mt-4 text-sm font-bold leading-relaxed">{t.onlineSub}</p>
          <p className="mt-2 text-sm font-bold leading-relaxed">{fill(t.rulesOnline, { wait: PRESS_WAIT_MS / 1000 })}</p>
        </section>

        {/* 名字的由來（Zach 10/24：遊戲命名用 Netflix 版本，在規則裡介紹） */}
        <p className="mt-10 text-sm font-bold leading-relaxed text-ink-soft">{t.nameNote}</p>

        <Link href={home} className="tau-press mt-8 flex h-14 w-full items-center justify-center gap-2 text-lg font-black">
          {t.rulesCta}
        </Link>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-ink-soft">
          {m.credits.prefix}{' '}
          <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
          {m.credits.middle}{' '}
          <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
          {m.credits.suffix}
        </p>
      </main>
    </TauFrame>
  );
}
