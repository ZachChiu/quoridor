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
      </main>
    </div>
  );
}
