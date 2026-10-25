# 各款在地名字的字

一款一份 `<遊戲>.mjs`，`scripts/build-name-lettering.mjs` 會自動讀進來（2026-10-25，Zach：「各語系有沒有辦法也找到一樣的字型」）。
一款一個檔案，各款的分支只動自己的，合併不會撞。

英文名本來就是那款自己的字（字標、舊式襯線）；這裡替中日韓泰的名字各挑一種**同一種風格**的字，轉成向量圖，
平台的小卡片、大卡片與那款首頁的標題都用它（`components/LocalName.tsx`）。

```js
// scripts/name-lettering/nine-mens-morris.mjs
import { TEXT } from '../../app/games/nine-mens-morris/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
// 哥德手抄本字 → 毛筆。可變字型用 axes 釘字重（例如 { wght: 900 }，泰文的寬度軸 { wdth: 100 }）
const BRUSH = { src: `${GF}/yujiboku/YujiBoku-Regular.ttf` };

const nineMensMorris = {
  // 產出 public/games/<id>/name/*.svg 與 app/games/<id>/nameLettering.ts
  id: 'nine-mens-morris',
  // 字距（em），跟那款首頁標題的 tracking 一樣
  tracking: 0.06,
  // 名字一律從 text.ts 拿，跟畫面上寫的是同一份；英文（與照英文寫的泰文）不用列
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: BRUSH },
    ja: { text: TEXT.ja.title, font: { src: `${GF}/zenantique/ZenAntique-Regular.ttf` } },
    // 預設在中間點後面、空格處可以換行；要在別的地方切就自己給 pieces（接起來要等於 text）
    // ja: { text: 'タイムオークション', pieces: ['タイム', 'オークション'], font: … },
  },
};

export default nineMensMorris;
```

做好之後：`npm run name:build -- <遊戲>`（要連網下載原始字型），產物（`app/games/<遊戲>/nameLettering.ts`，蓋掉平台先放的空檔）跟程式一起 commit，
平台卡片會自己依路徑查到（`games/nameLetterings.ts`）；各款首頁的標題換成 `LocalName`。

- **挑字**：照英文那套字的風格找各文字的對應（肥臉體 ↔ 粗宋、哥德手抄本 ↔ 毛筆、舊式襯線 ↔ 宋體／明朝），
  只用 OFL 授權的字。**繁中的字要用繁中字型**（日本的字型寫中文，有些字的寫法不對）；名字裡每個字的寫法兩邊一樣時才可以借用。
- **名字改了**：重跑 `name:build`。沒重跑時 `tests/components/nameLettering.test.ts` 會擋，畫面上退回一般文字。
- `text.ts` 只能有 `import type`（Node 直接跑 .ts 時只剝型別，不解析 `@/` 別名），跟 `scripts/og-games` 一樣。
