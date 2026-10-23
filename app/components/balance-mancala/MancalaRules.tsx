import type { BalanceMancalaText } from '@/games/balance-mancala/text';

/**
 * 遊玩方式（說明彈窗的內容）：七條編號規則＋最終分數的例子＋出處、名字的由來（節目裡叫什麼、「播棋」是什麼；
 * glossary〈遊戲名〉：每款的規則最後一段寫名字的由來）、圖示署名與外框 Adinkra 符號的意思
 */
export default function MancalaRules({ t }: { t: BalanceMancalaText }) {
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2.5">
        {t.rules.map((rule, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed">
            <span aria-hidden="true" className="mcl-plaque is-small grid size-6 shrink-0 place-items-center text-xs font-black">{i + 1}</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
      <p className="mcl-cloth p-4 text-center text-base font-black">{t.example}</p>
      <p className="text-xs leading-relaxed text-ink-soft">{t.showNote}</p>
      <p className="text-xs leading-relaxed text-ink-soft">{t.nameNote}</p>
      <p className="text-[10px] leading-relaxed text-ink-soft">{t.credit}</p>
    </div>
  );
}
