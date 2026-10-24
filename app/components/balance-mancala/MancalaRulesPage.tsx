import Link from 'next/link';
import { LuHouse } from 'react-icons/lu';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { pickText } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { BALANCE_MANCALA } from '@/i18n/routes';
import { TEXT } from '@/games/balance-mancala/text';
import MancalaFrame from './MancalaFrame';
import { RulesStepsList } from './MancalaRulesSteps';
import { MCL_CORNER } from './styles';

/** 主視覺：克里夫蘭美術館的三件阿坎黃金砝碼（CC0），跟首頁同一張 */
const KEY_ART = '/games/balance-mancala/weights.webp';

/**
 * 平衡播棋的規則頁（/balance-mancala/rules，六個語系共用；2026-10-25 Zach：「怎麼玩最好跟 Wall Go 一樣圖配字」）。
 * 版面照 Wall Go 與尼泊爾虎棋的規則頁：置頂列（回這款首頁、名字、語言）＋ 一步一張圖的卡片 ＋ 一顆回首頁選玩法的鈕，
 * 最後是出處、名字的由來、圖示署名與外框 Adinkra 符號的意思（原本在說明彈窗裡）。
 * 整頁是同一塊 Adinkra 印花布（MancalaFrame，裝飾只有最外緣的布邊）；置頂列底下兩道梳線（同這款彈窗的標題）。
 * 這款裡面換頁不播轉場，連結一律是普通的 Link。
 */
export default function MancalaRulesPage({ locale }: { locale: Locale }) {
  const t = pickText(TEXT, locale);
  const home = localePath(locale, BALANCE_MANCALA);
  return (
    <MancalaFrame>
      <header className="sticky top-0 z-40 border-b-4 border-double border-[#201211]/55 bg-[#ebd2cb]">
        <div className="mx-auto grid max-w-[46rem] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2">
          {/* 跟右邊的語言鈕同一個大小與樣子（40px＋外擴的觸控範圍、切角淡布片） */}
          <Link href={home} aria-label={t.home}
            className={`relative grid size-10 place-items-center justify-self-start text-xl transition after:absolute after:-inset-0.5 after:content-[''] active:scale-95 ${MCL_CORNER.button}`}>
            <LuHouse aria-hidden="true" />
          </Link>
          <p className="truncate text-base font-black">{t.title}</p>
          <div className="justify-self-end"><LanguageSwitcher theme={MCL_CORNER} /></div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[46rem] px-4 pb-[max(3rem,6svh)] pt-7 sm:px-5">
        <header className="flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出的單張主視覺，不需要 next/image */}
          <img src={KEY_ART} alt="" aria-hidden="true" width={1000} height={264} className="block h-auto w-[min(100%,18rem)]" />
          <p className="mt-4 text-[11px] font-bold tracking-wide text-ink-soft">{t.showRef}</p>
          <h1 className="mt-1 text-balance text-[clamp(1.75rem,7vw,2.75rem)] font-black leading-[1.15] tracking-tight">{t.rulesTitle}</h1>
          <p className="mt-2 text-sm font-bold">{t.tagline}</p>
        </header>

        <div className="mt-8"><RulesStepsList /></div>

        <Link href={home} className="mcl-plaque mt-8 flex h-14 items-center justify-center gap-2 text-lg font-black active:scale-[0.99]">
          <LuHouse aria-hidden="true" className="text-xl" />{t.rulesCta}
        </Link>

        <div className="mt-10 flex flex-col gap-2 border-t-4 border-double border-[#201211]/55 pt-6 text-sm leading-relaxed text-ink-soft">
          <p>{t.showNote}</p>
          {/* 名字的由來（glossary〈遊戲名〉：每款的規則最後一段寫名字的由來） */}
          <p>{t.nameNote}</p>
          {/* 圖示署名＋外框三個 Adinkra 符號的意思（符號要照原意用，意思寫在這裡） */}
          <p className="text-xs">{t.credit}</p>
        </div>
      </div>
    </MancalaFrame>
  );
}
