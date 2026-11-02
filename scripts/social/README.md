# 社群素材（scripts/social/）

`docs/social-assets.md` 那批：Wall Go 的 30 秒直式教學影片、規則圖卡（4:5 五張）、三語（繁中、英、韓）。
**成品不進 repo、不放 public**（圖卡要放規則頁的話另開分支、照打版流程）；輸出到你指定的資料夾，交給 Zach 自己發文。

畫面全部是站上真的頁面：開發伺服器跑起來，用無頭 Chrome 在 `/wall-go/local/` 照一盤棋一步一步點（不是另外畫一套）。

```bash
npm run dev                                                  # 或 next dev --webpack -p 3381
node scripts/social/gen-game.mjs 7 > out/game.json          # 引擎＋電腦對手下完一盤（動作清單、每回合的 WGF、終局比分）
node scripts/social/record.mjs zh-TW out/game.json out/rec-zh-TW http://localhost:3000   # en、ko 各跑一次
node scripts/social/capture-boards.mjs out/game.json out/boards http://localhost:3000    # 圖卡用的盤面（不分語言）
node scripts/social/render.mjs out/game.json out/boards out/assets                       # 圖卡＋字幕＋片尾（三語）
node scripts/social/make-video.mjs zh-TW out/rec-zh-TW out/assets/zh-TW/overlay out/assets/zh-TW/wallgo-tutorial-zh-TW.mp4
```

- 文字在 `copy.mjs`（術語照 `app/i18n/glossary.md`，能用站上原句就用原句；disclaimer 是 `messages/*.ts` 的 `home.disclaimer`）。
- 需要：Google Chrome（`CHROME_PATH` 可覆寫）、Homebrew 的 ffmpeg、`node_modules/.cache/wallgo-fonts/NotoSansTC[wght].ttf`（跑過一次 `npm run og:build` 就有）。
- 錄影用 Chrome 原生的 2 倍縮放（`launch({ native: true })`）：screencast 不吃模擬的 deviceScaleFactor，模擬的話只錄得到 540×960。
- 對局中換頁會跳「確定要離開嗎」，`cdp.mjs` 會自動按掉，不然無頭 Chrome 會卡住。
- `gen-game.mjs` 的電腦對手有時間預算（牆鐘），同一個 seed 不保證每次同一盤；要重錄就沿用同一份 game.json。
- 新遊戲要錄：照 `record.mjs` 換成那款的頁面與點法，`make-video.mjs` 的剪法（照錄影時記下的時間點切）可以沿用。
