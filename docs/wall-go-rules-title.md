# Wall Go 規則頁 title 對準大家搜的詞

大腦筋 11/5 寫。11/3 Zach：「我們現在要搶佔關鍵字 讓網站流量起來」。

## 為什麼

- 規則頁的 title 現在只有「Rules | Wall Go」「ルール | 壁囲碁 Wall Go」「遊戲規則 | 牆壁圍棋 Wall Go」，沒有大家實際搜的說法。
- Search Console 10/8～11/4（英文規則頁）：
  - 「wall go」61 次曝光、1 次點擊，排第 9.7 名。
  - 「wall go rules」20 次曝光，第 3.5 名。
  - 「how to play wall go」12 次曝光，第 4.2 名。
- 韓文規則頁已經寫成「벽바둑 규칙과 하는 법」（規則和玩法），其他語系照這個寫法補。
- 第 3 季 11/10 開播，大家會回頭找第 2 季的遊戲怎麼玩。

## 要改的（只改 `/wall-go/rules/` 六個語系的 title 和 description）

| 語系 | 建議 title |
|---|---|
| en | Wall Go Rules: How to Play (The Devil's Plan Season 2) |
| ja | 壁囲碁（Wall Go）のルールと遊び方｜悪魔の計略 シーズン2 |
| 繁中 | 牆壁圍棋規則、玩法教學（魔鬼的計謀 第二季 Wall Go） |
| 簡中 | 墙壁围棋规则、玩法教学（魔鬼的计谋 第二季 Wall Go） |
| ko | 벽바둑 규칙과 하는 법（데블스 플랜 시즌2 Wall Go） |
| th | กติกา Wall Go และวิธีเล่น（The Devil's Plan ซีซั่น 2） |

- 字數太長就把括號裡的節目名縮短，主要的詞（Wall Go Rules、壁囲碁 ルール、牆壁圍棋規則、벽바둑 규칙）一定要在最前面。
- description 第一句直接講規則重點（兩人、蓋牆、圍出最大的地盤這類），再說可以免費線上玩。
- 頁面上的 h1 如果也是只有「規則」兩個字，一起改成跟 title 前半一樣。
- 網址、內文、GA 都不動。

## 規則

- 開分支、做完跑檢查、**打版前先問 Zach**，這份 docs 一起 commit。
- 跟第 3 季頁可以一起打版，也可以分開。

## 驗收

- 上線當下：大腦筋看六個語系的 title、h1。
- 12/1：英文規則頁「wall go」「wall go rules」「how to play wall go」的名次、點擊，跟 10/8～11/4 比。
