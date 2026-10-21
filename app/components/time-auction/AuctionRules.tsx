'use client';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { MODES, type Mode } from '@/games/time-auction/engine';
import { TEXT } from '@/games/time-auction/text';

/**
 * 怎麼玩：編號的規則＋這個模式的差別＋操作方式。設定頁與對局中的說明彈窗共用。
 * 時間與倒數秒數照目前選的模式帶進去（快速局 2 分鐘／3 秒、節目局 10 分鐘／5 秒）。
 * 彈窗的色帶是規則的森綠，所以這裡的編號用深墨，不再帶第二個色相。
 */
export default function AuctionRules({ mode }: { mode: Mode }) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const cfg = MODES[mode];
  const vars = { budget: fill(t.minutes, { n: cfg.budget / 600 }), countdown: cfg.countdownMs / 1000 };
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2.5">
        {t.rules.map((rule, i) => (
          <li key={i} className="flex gap-2.5 text-sm font-bold leading-relaxed">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#35331c] text-xs font-black text-[#ebe1b8]">{i + 1}</span>
            <span>{fill(rule, vars)}</span>
          </li>
        ))}
      </ol>
      {/* 兩句分兩行：中日文句子之間不該夾一個半形空白 */}
      <div className="rounded-xl bg-[#35331c]/[0.06] px-3 py-2.5 text-xs font-bold leading-relaxed text-ink-soft">
        <p>{cfg.showRemaining ? t.rulesQuick : t.rulesShow}</p>
        <p className="mt-1">{t.controls}</p>
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
