import type { Locale } from '../locales';

/**
 * 規則頁的常見問題，四語系各一份。
 *
 * 每一則都對應真實會被搜尋的疑問，不是為了塞關鍵字而寫的。
 * 同一份資料同時餵給畫面與 FAQPage 結構化資料 —— 分成兩份遲早會不一致，
 * 而 Google 對「結構化資料與頁面內容不符」的處理是直接不採用。
 */
export type FaqItem = { q: string; a: string };

export const FAQ_TEXT: Record<Locale, FaqItem[]> = {
  'zh-TW': [
    { q: '牆壁圍棋和 Quoridor 有什麼不同？',
      a: '兩者都會在格線上放牆，但目標完全相反。Quoridor 是賽跑——先走到對面就贏，牆只是用來擋路。牆壁圍棋是圈地——用牆把區域封閉起來，封閉區域裡只有自己的棋子時那塊地才算你的，最後比誰的地盤格數多。另外牆壁圍棋每回合「一定」要蓋一道牆，Quoridor 的牆有數量上限且可以選擇不放。' },
    { q: '牆壁圍棋出自哪裡？',
      a: '出自 Netflix 實境節目《魔鬼的計謀：死亡密室》。節目中作為對決項目之一登場，規則簡單但變化很深，播出後有不少人在找線上版。' },
    { q: '一個人可以玩嗎？',
      a: '可以，有單人對戰模式，電腦對手分三級。電腦會評估每一格由誰先到得了（Voronoi 分割）來決定下法，不是隨機亂下。' },
    { q: '要下載或註冊嗎？',
      a: '都不用。打開網頁就能玩，本機對戰與單人對戰完全離線可用。連線對戰會用匿名身分建立房間，把連結傳給朋友就能一起玩，同樣不需要註冊。' },
    { q: '幾個人可以玩？',
      a: '2 人或 3 人。兩人局每人 4 顆棋子，三人局每人 2 顆。三人局多一個「破牆」機制，每人整局限用一次，可以拆掉一道已經存在的牆。' },
    { q: '如果輪到我但棋子動不了怎麼辦？',
      a: '系統會自動跳過。當你所有棋子都被封在自己的地盤裡、做什麼都不會改變結果時，回合會直接交給下一位。所有棋子都被封住時遊戲就結束、開始計分。' },
  ],
  en: [
    { q: 'How is Wall Go different from Quoridor?',
      a: 'Both place walls on a grid, but the goals are opposites. Quoridor is a race — first to the far side wins, and walls exist to slow people down. Wall Go is about claiming ground — you seal areas off with walls, and an area counts as yours only if the pieces inside are all yours. Whoever holds the most squares wins. Wall Go also makes building compulsory every single turn, whereas in Quoridor walls are limited in number and optional.' },
    { q: 'Where does Wall Go come from?',
      a: "It appeared on the Netflix series The Devil's Plan: Death Room as one of the challenges. The rules are simple but the play is deep, and a lot of people went looking for an online version after it aired." },
    { q: 'Can I play on my own?',
      a: 'Yes — there is a solo mode with three levels of computer opponent. The computer works out which squares each side would reach first (a Voronoi split) and plays from that, rather than moving at random.' },
    { q: 'Do I need to download or sign up?',
      a: 'Neither. It runs in the browser, and local and solo play work fully offline. Online play creates a room under an anonymous identity — send the link to a friend and you can play together, still with no sign-up.' },
    { q: 'How many people can play?',
      a: '2 or 3. In a 2-player game each side has 4 pieces; in a 3-player game each has 2. The 3-player game adds a wall break: once per game, a player may remove an existing wall.' },
    { q: 'What if it is my turn but my pieces cannot move?',
      a: 'Your turn is skipped automatically. Once all your pieces are sealed inside your own territory and nothing you do can change the result, play passes straight to the next person. When every piece is sealed in, the game ends and scores are counted.' },
  ],
  ja: [
    { q: 'ウォールゴーとコリドール（Quoridor）は何が違うの？',
      a: 'どちらも盤に壁を置きますが、目的は正反対です。コリドールは競走で、先に向こう側へ着いた人の勝ち。壁は足止めの道具です。ウォールゴーは陣取りで、壁で領域を囲み、その中に自分の駒しかなければその領域が自分のものになります。最後にマス数が多い人の勝ちです。またウォールゴーでは毎ターン必ず壁を作りますが、コリドールの壁は枚数制限があり、置かない選択もできます。' },
    { q: 'ウォールゴーはどこで登場したの？',
      a: 'Netflix の『デビルズプラン：デスルーム』に対決種目のひとつとして登場しました。ルールは単純ですが展開が深く、放送後にオンライン版を探す人が増えました。' },
    { q: 'ひとりでも遊べる？',
      a: '遊べます。CPU戦が3段階あります。CPUは「どのマスにどちらが先に届くか」（ボロノイ分割）を計算して指すので、ランダムな手は打ちません。' },
    { q: 'ダウンロードや登録は必要？',
      a: 'どちらも不要です。ブラウザで開くだけで遊べます。ローカル対戦とCPU戦はオフラインでも動きます。オンライン対戦は匿名のまま部屋を作り、リンクを友だちに送るだけ。こちらも登録は要りません。' },
    { q: '何人で遊べる？',
      a: '2人または3人です。2人対戦は各4個、3人対戦は各2個の駒を使います。3人対戦では「壁を壊す」が加わり、1ゲームにつき1回だけ既存の壁を1枚取り除けます。' },
    { q: '自分の番なのに駒が動かせないときは？',
      a: '自動でスキップされます。自分の駒がすべて自分の陣地に閉じ込められ、何をしても結果が変わらない状態になると、手番はそのまま次の人へ移ります。全員の駒が閉じ込められた時点で終了し、得点計算に入ります。' },
  ],
  ko: [
    { q: '월 고와 코리도(Quoridor)는 무엇이 다른가요?',
      a: '둘 다 판에 벽을 놓지만 목표가 정반대입니다. 코리도는 달리기입니다. 먼저 반대편에 닿으면 이기고, 벽은 상대를 늦추는 도구일 뿐입니다. 월 고는 영역 싸움입니다. 벽으로 구역을 둘러싸고, 그 안에 내 말만 있어야 내 영역이 됩니다. 마지막에 칸 수가 많은 사람이 이깁니다. 또 월 고는 매 턴 반드시 벽을 세워야 하지만, 코리도의 벽은 개수 제한이 있고 놓지 않아도 됩니다.' },
    { q: '월 고는 어디에서 나온 게임인가요?',
      a: '넷플릭스 『데블스 플랜: 데스룸』에 대결 종목 중 하나로 등장했습니다. 규칙은 단순하지만 수읽기가 깊어서, 방송 이후 온라인 버전을 찾는 사람이 많아졌습니다.' },
    { q: '혼자서도 할 수 있나요?',
      a: '가능합니다. 컴퓨터 대전이 3단계로 준비되어 있습니다. 컴퓨터는 각 칸에 누가 먼저 닿는지(보로노이 분할)를 계산해서 두기 때문에 아무렇게나 두지 않습니다.' },
    { q: '설치나 가입이 필요한가요?',
      a: '둘 다 필요 없습니다. 브라우저에서 바로 즐길 수 있고, 로컬 대전과 혼자 하기는 오프라인에서도 동작합니다. 온라인 대전은 익명으로 방을 만들고 링크만 친구에게 보내면 됩니다. 역시 가입은 필요 없습니다.' },
    { q: '몇 명이 할 수 있나요?',
      a: '2명 또는 3명입니다. 2인전은 각자 말 4개, 3인전은 각자 2개를 씁니다. 3인전에는 벽 부수기가 추가되어, 한 게임에 한 번 기존 벽 하나를 없앨 수 있습니다.' },
    { q: '제 차례인데 말이 움직일 수 없으면 어떻게 되나요?',
      a: '자동으로 넘어갑니다. 내 말이 모두 내 영역 안에 갇혀서 무엇을 해도 결과가 달라지지 않으면, 차례는 바로 다음 사람에게 넘어갑니다. 모든 말이 갇히면 게임이 끝나고 점수를 계산합니다.' },
  ],
};
