/**
 * 「連線中」—— 連線頁在拿到房間之前唯一的畫面。建房與進房共用同一個樣子。
 *
 * 跟接下來的等待畫面（WaitingRoom）同一塊紙色面板、同樣寬：連上之後面板不動、只換裡面的內容，
 * 不會從一行小字突然跳成一大塊。先前只有一顆小轉圈加一行字浮在頁面中央，看起來像還沒載完（Zach 10/22）。
 *
 * 紅、藍兩顆棋子輪流跳一下，像在等對方接球。動畫只是點綴 —— 開了「減少動態」就靜止（globals.css）。
 */
export default function Connecting({ label, kicker }: { label: string; kicker?: string }) {
  return (
    <div role="status" className="flex w-[min(22rem,90vw)] flex-col items-center gap-7 rounded-3xl bg-primary-50 px-8 py-10 text-center font-[family-name:var(--font-app)]">
      <div>
        {kicker && <p className="text-xs font-bold tracking-widest text-tile-purple">{kicker}</p>}
        <h2 className="mt-1 text-3xl font-black">{label}</h2>
      </div>
      <div className="flex h-16 items-end gap-5" aria-hidden="true">
        <span className="animate-connect-hop size-12 rounded-full" style={{ backgroundColor: 'var(--player-A)' }} />
        <span className="animate-connect-hop size-12 rounded-full [animation-delay:0.5s]" style={{ backgroundColor: 'var(--player-B)' }} />
      </div>
    </div>
  );
}
