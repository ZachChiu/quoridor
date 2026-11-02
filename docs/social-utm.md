# 社群貼文的連結（第 3 季，2026-11）

照 `docs/social-assets.md` 第 3 節做的表。每個渠道一條，GA 用 `utm_source` 分得出每篇貼文帶來多少人（11/16 驗收看 Sessions 與 `game_start`）。

## 命名

- `utm_campaign=s3`：這一波（第 3 季開播）都是這個，下一波換新的。
- `utm_medium=social`：全部用同一個。GA4 預設的管道分組看 medium 是不是 `social`，是的話整批進「自然社群（Organic Social）」；
  寫成 `forum`、`blog` 會掉進「未指派」，PTT、Naver 的 source 又不在 GA 內建的社群網站清單裡。
- `utm_source`：渠道名，全小寫、不加空格：`threads`、`reddit`、`ptt`、`naver`、`youtube`、`instagram`。
- `utm_content`：同一個渠道貼了不同素材時才分：`video`（30 秒影片）、`cards`（規則圖卡）。只貼一種就可以不帶。
- 站上已經用掉的 source（不要撞名）：`pwa`（加到主畫面）、`result_card`（結算分享圖的 QR）。

## 連結

落地頁都是 Wall Go 首頁、各渠道讀者的語系。

| 渠道 | 語系 | 素材 | 網址 |
|---|---|---|---|
| Threads | 繁中 | 影片 | https://quoridorgame.com/wall-go/?utm_source=threads&utm_medium=social&utm_campaign=s3&utm_content=video |
| Threads | 繁中 | 圖卡 | https://quoridorgame.com/wall-go/?utm_source=threads&utm_medium=social&utm_campaign=s3&utm_content=cards |
| Reddit r/TheDevilsPlan | 英文 | 影片 | https://quoridorgame.com/en/wall-go/?utm_source=reddit&utm_medium=social&utm_campaign=s3&utm_content=video |
| Reddit r/TheDevilsPlan | 英文 | 圖卡 | https://quoridorgame.com/en/wall-go/?utm_source=reddit&utm_medium=social&utm_campaign=s3&utm_content=cards |
| PTT 韓綜板 | 繁中 | — | https://quoridorgame.com/wall-go/?utm_source=ptt&utm_medium=social&utm_campaign=s3 |
| Naver 部落格 | 韓文 | — | https://quoridorgame.com/ko/wall-go/?utm_source=naver&utm_medium=social&utm_campaign=s3 |
| YouTube Shorts（說明欄） | 繁中 | 影片 | https://quoridorgame.com/wall-go/?utm_source=youtube&utm_medium=social&utm_campaign=s3&utm_content=video |
| YouTube Shorts（說明欄） | 英文 | 影片 | https://quoridorgame.com/en/wall-go/?utm_source=youtube&utm_medium=social&utm_campaign=s3&utm_content=video |
| YouTube Shorts（說明欄） | 韓文 | 影片 | https://quoridorgame.com/ko/wall-go/?utm_source=youtube&utm_medium=social&utm_campaign=s3&utm_content=video |
| Instagram（個人檔案連結） | 繁中 | 影片／圖卡 | https://quoridorgame.com/wall-go/?utm_source=instagram&utm_medium=social&utm_campaign=s3 |

影片與圖卡上印的是不帶參數的 `quoridorgame.com`（看得懂、打得出來）；照著打進來的人在 GA 會是「直接」，這是預期的。

## 查過的事（2026-11-03）

- 舊網址 301 到 `/wall-go/` 後參數還在：`/rules/?utm_source=threads…` → `/wall-go/rules/?utm_medium=social&utm_campaign=s3&utm_source=threads`（CloudFront 換了參數順序，GA 不受影響）；`/wall-go`（沒斜線）、`/ko/rules/` 也一樣。
- 上表三個落地頁帶參數都回 200。canonical 不帶參數（`i18n/metadata.ts`），不會多出重複網址。
