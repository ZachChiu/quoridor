# 各款自己的分享圖

第二批五款一款一份 `<遊戲>.mjs`，`scripts/build-og-images.mjs` 會自動讀進來（2026-10-25，Zach：「各遊戲應該要有自己的 meta 圖」）。
一款一個檔案、比對表一頁一份（`public/og/copy/<頁>.json`），各款的分支只動自己的，合併不會撞。

```js
// scripts/og-games/nine-mens-morris.mjs
import { TEXT } from '../../app/games/nine-mens-morris/text.ts';

export default {
  // 頁面代號＝網址第一段：產出 public/og/nine-mens-morris-<語系>.png，trialGameMetadata 自動拿來用（規則頁、連線頁同一張）
  page: 'nine-mens-morris',
  // 底色、字色、膠囊底色、膠囊字色 —— 從那款的 palette 取，字色要在底色上過 4.5:1
  tone: { bg: '#4b4577', fg: '#eee0c4', pill: '#c54915', pillFg: '#eee0c4' },
  // 右邊的主視覺：裁成正方形（position 照 sharp 的寫法，預設置中）
  art: { file: 'public/games/nine-mens-morris/libro.webp', position: 'centre' },
  // 膠囊與標題。ctx.messages 是那個語系的 messages，ctx.brandName 是平台名
  copy: (locale, { brandName }) => ({ kicker: brandName(locale), title: [TEXT[locale].title, TEXT[locale].subtitle] }),
};
```

做好之後：`npm run og:build -- nine-mens-morris`（只重建這一款，要連網、要先跑過 `npm run font:subset` 與本機有 Chrome），
產物（六張 PNG ＋ `public/og/copy/nine-mens-morris.json`）跟程式一起 commit。改了標題相關的字，CI 的 `og:check` 會提醒重建。

`text.ts` 只能有 `import type`（Node 直接跑 .ts 時只剝型別，不解析 `@/` 別名）。
