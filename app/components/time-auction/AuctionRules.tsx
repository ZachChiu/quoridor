'use client';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { MODES, type Mode } from '@/games/time-auction/engine';
import { PRESS_WAIT_MS } from '@/games/time-auction/online';
import { TEXT } from '@/games/time-auction/text';

/**
 * 怎麼玩：編號的規則＋這個模式的差別＋操作方式。設定頁與對局中的說明彈窗共用。
 * 時間與倒數秒數照目前選的模式帶進去（快速局 2 分鐘／3 秒、節目局 10 分鐘／5 秒）。
 * 排成拍賣目錄的「拍賣條款」：羅馬數字編號（Didone 斜體）、條款之間一道點線；模式說明圈一道雙線框。
 * 最上面一行小字是名字由來（nameNote：節目第 2 季的遊戲、名字指的是什麼），跟虎羊棋規則頁的寫法一樣。
 * 連線局（online）在模式說明的框裡多一段：要等大家按住、沒按的人等多久、時間以伺服器為準。
 */
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export default function AuctionRules({ mode, online = false }: { mode: Mode; online?: boolean }) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const cfg = MODES[mode];
  const vars = { budget: fill(t.minutes, { n: cfg.budget / 600 }), countdown: cfg.countdownMs / 1000 };
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold leading-relaxed text-ink-soft">{t.nameNote}</p>
      <ol className="-mt-2 flex flex-col">
        {t.rules.map((rule, i) => (
          <li key={i} className="flex gap-3 border-b border-dotted border-[#35331c]/30 py-2 text-sm font-bold leading-relaxed last:border-b-0">
            <span aria-hidden="true" className="tau-display w-7 shrink-0 pt-0.5 text-right text-base font-bold italic">{ROMAN[i] ?? i + 1}.</span>
            <span>{fill(rule, vars)}</span>
          </li>
        ))}
      </ol>
      {/* 兩句分兩行：中日文句子之間不該夾一個半形空白 */}
      <div className="tau-box px-4 py-3 text-xs font-bold leading-relaxed text-ink-soft">
        <p>{cfg.showRemaining ? t.rulesQuick : t.rulesShow}</p>
        <p className="mt-1">{t.controls}</p>
        {online && <p className="mt-1">{fill(t.rulesOnline, { wait: PRESS_WAIT_MS / 1000 })}</p>}
      </div>
      <p className="text-center text-[11px] leading-relaxed text-ink-soft">
        {m.credits.prefix}{' '}
        <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
        {m.credits.middle}{' '}
        <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
        {m.credits.suffix}
      </p>
    </div>
  );
}
