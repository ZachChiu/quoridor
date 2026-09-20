import HomeClient from "./HomeClient";

const SITE = process.env.SITE_URL || "https://quoridorgame.com";

export default function Home() {
  return (
    /*
      高度用 dvh 而不是 min-h-screen。

      iPhone 的 Safari 在捲動前會佔掉將近三成的高度（14 Pro 是
      393x852，實際可見大約只有 393x659），100vh 量的是「網址列收起來
      之後」的高度 —— 於是首屏永遠被裁掉一截，而那一截正好是最下面
      那兩塊磁磚。dvh 量的是當下真正看得到的高度。
    */
    <div className="flex min-h-dvh items-center justify-center px-5 py-[max(1rem,3dvh)] font-[family-name:var(--font-app)]">
      {/*
        沒有卡片、沒有外框、沒有陰影 —— 內容直接躺在奶油底上，
        視覺重量全部交給撞色磁磚。這是參考稿的作法：畫面上唯一的黑色
        是標題與圖示的線條，不是用來框住東西的。
      */}
      <main className="flex w-full max-w-[420px] flex-col items-center">
        <header className="text-center">
          {/* 字級隨可見高度縮放 —— 矮螢幕上標題先讓位，磁磚才是要按的東西 */}
          <h1 className="text-[clamp(2.25rem,7dvh,3.75rem)] font-black leading-[0.95] tracking-tight">
            牆壁圍棋
            <br />
            Wall Go
          </h1>
          <p className="mt-[max(0.5rem,1.5dvh)] text-sm font-bold text-ink-soft md:text-base">
            圍出最大的地盤 · 2–3 人對戰
          </p>
        </header>

        {/*
          磁磚的寬度由「剩下多少高度」反推，而不是只看寬度。

          磁磚是正方形，所以格線寬度直接決定它的高度：
            grid 高 = 2 x 磁磚 + 2 x 寬磁磚(約 68px) + 3 道間隙(12px)
          把可見高度扣掉標題與留白之後剩下的給它，就不會超出一個螢幕。
          380px 是寬度上的上限，桌機或高螢幕時照舊。
        */}
        <div
          className="mt-[max(1rem,3dvh)] w-full"
          style={{ maxWidth: 'min(380px, calc(100dvh - 22rem))' }}
        >
          <HomeClient />
        </div>

      </main>

      {/*
        VideoGame 結構化資料。讓搜尋結果知道這是「一個可以直接玩的遊戲」
        而不是一篇介紹文章 —— 兩者在結果頁的呈現方式不同。

        playMode 三個值對應站上真的做得到的三種玩法；寫了做不到的東西
        比不寫更糟，那是結構化資料被降權最常見的原因。
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'VideoGame',
            name: '牆壁圍棋 Wall Go',
            alternateName: 'Wall Go',
            url: SITE,
            description:
              'Netflix《魔鬼的計謀：死亡密室》裡的牆壁圍棋。移動棋子、築牆圈地，地盤大的人獲勝。',
            genre: ['Strategy', 'Board Game'],
            gamePlatform: 'Web browser',
            applicationCategory: 'Game',
            operatingSystem: 'Any',
            inLanguage: 'zh-TW',
            numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3 },
            playMode: ['SinglePlayer', 'CoOp', 'MultiPlayer'],
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
            isBasedOn: {
              '@type': 'TVSeries',
              name: '魔鬼的計謀：死亡密室',
              alternateName: "The Devil's Plan: Death Room",
            },
          }),
        }}
      />
    </div>
  );
}
