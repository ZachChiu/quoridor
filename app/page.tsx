import HomeClient from "./HomeClient";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10 font-[family-name:var(--font-app)]">
      {/*
        沒有卡片、沒有外框、沒有陰影 —— 內容直接躺在奶油底上，
        視覺重量全部交給撞色磁磚。這是參考稿的作法：畫面上唯一的黑色
        是標題與圖示的線條，不是用來框住東西的。
      */}
      <main className="flex w-full max-w-[420px] flex-col items-center">
        <header className="text-center">
          <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-6xl">
            牆壁圍棋
            <br />
            Wall Go
          </h1>
          <p className="mt-4 text-sm font-bold text-ink-soft md:text-base">
            圍出最大的地盤 · 2–3 人對戰
          </p>
        </header>

        <div className="mt-9 w-full md:mt-10">
          <HomeClient />
        </div>

        {/* CC BY 3.0 的署名是使用條件，不是禮貌 —— 不能拿掉。
            但它不必擋在每個玩家都會走一次的教學流程裡：放首頁底部，
            那是 credits 的常規位置，看一次就好。 */}
        <p className="mt-10 text-center text-[11px] leading-relaxed text-ink-soft">
          圖示來自{' '}
          <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">
            game-icons.net
          </a>
          （CC BY 3.0）與{' '}
          <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">
            Lucide
          </a>
          （ISC）
        </p>
      </main>
    </div>
  );
}
