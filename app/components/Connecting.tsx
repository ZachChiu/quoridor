/** 「連線中…」—— 連線頁在拿到房間之前唯一的畫面。建房與進房共用同一個樣子。 */
export default function Connecting({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-lg" role="status">
      <div className="size-4 animate-spin rounded-full border-2 border-tile-ink border-t-transparent" aria-hidden="true" />
      {label}
    </div>
  );
}
