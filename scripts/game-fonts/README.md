# 各款整頁用的字

一款一份 `<遊戲>.mjs`，`scripts/build-game-fonts.mjs` 會自動讀進來（2026-10-25，Zach：「我以為是一個遊戲內會統一字體 / 結果是標題跟內容不同字體」）。
一款一個檔案，各款的分支只動自己的，合併不會撞。

標題的字標（`scripts/name-lettering/`）只管名字；這裡替那款的**其他所有字**（按鈕、說明、彈窗、分享圖）挑字，
原則是跟那個語系的標題同一套（標題是哥德字這種不能拿來排內文的，就挑一套讀得下去、同時代感的書體）。

```js
// scripts/game-fonts/time-auction.mjs
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
// 可變字型：axes.wght 給範圍就保留那一段字重（畫面用到 400–900 就給 400–900）；泰文的寬度軸釘在 100
const serif = (file) => ({ src: `${GF}/${file}`, axes: { wght: { min: 400, max: 900 } } });

const timeAuction = {
  // 收 app/games/<id>/、app/components/<id>/ 的字，產出 public/fonts/games/<id>/ 與 app/components/<id>/gameFont.css
  id: 'time-auction',
  // 那款最外層元件的 class：html:has(.<root>) 才換字
  root: 'tau-root',
  locales: {
    'zh-TW': serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    en: serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    th: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { wdth: 100, wght: { min: 400, max: 900 } } },
    // 靜態字型一個字重一個檔，列成陣列（weight 是 @font-face 的 font-weight）
    // 'zh-TW': [{ src: …Regular.ttf, weight: 400 }, { src: …Bold.ttf, weight: 700 }],
    // 沒列的語系照全站的黑體
  },
};

export default timeAuction;
```

做好之後：`node scripts/build-game-fonts.mjs <遊戲>`（要連網下載原始字型），把 `app/components/<遊戲>/gameFont.css`
在那款的外框元件 import 進來（`import './gameFont.css';`），產物跟程式一起 commit。

- **只用 OFL 授權的字**；繁中用繁中字型、簡中用簡中字型（同一個字兩邊寫法不一樣，見 `build-font-subset.mjs`）。
- **最粗只有 500 以下的字**（單一字重的、只到 Medium 的）會關掉瀏覽器的假粗體：`font-black` 的字照原本的粗細畫，不會糊成一團。
- **泰文字型只收泰文字**，泰文頁上的英數與符號由那款的 `en` 那份補上 —— 有 `th` 就要有 `en`。
- **文案改了**：重跑一次（`npm run font:subset` 會連全站的子集一起跑）。沒重跑時 CI 的 `font:check` 會擋，畫面上是新字掉到全站的黑體。
- 跑完會列出「字型裡沒有」的字：那些字會掉到全站的黑體，太多就換一套字。
- 檔案大小：中日韓一個語系約一百 KB（看字數與字重範圍；只留橫排用到的 OpenType 功能，見腳本裡的 FEATURES），英文約二十 KB，只有那款的頁面會下載。
