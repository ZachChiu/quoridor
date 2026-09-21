import type { Locale } from '../locales';

/**
 * 逐步教學的文字，四語系各一份。
 *
 * 盤面圖留在 tutorialSteps.ts —— 圖不分語言，跟著文字複製四份只會讓
 * 「改了圖忘記改另外三份」變成常態。這裡只放會變的部分。
 *
 * ── 寫法 ──────────────────────────────────────────────────────
 *
 * 這是操作說明，不是介紹文。所以：直述句、第二人稱、一句講一件事，
 * 不用破折號製造停頓，也不評論這個遊戲有多深 —— 那是玩過才有的感受，
 * 寫在教學裡只是在替讀者下結論。
 *
 * 兩人局與三人局規則不同的地方，一律標成「兩人：」「三人：」分行寫，
 * 不要混在同一句裡讓人自己分辨哪一句適用於自己。
 *
 * body 裡的換行是有意義的（分行、分段），渲染端用 whitespace-pre-line。
 *
 * 用詞照 app/i18n/glossary.md。長度與非空由 tests/i18n/content.test.ts 鎖住。
 */
export type StepText = { title: string; body: string };

export const STEP_TEXT: Record<Locale, StepText[]> = {
  'zh-TW': [
    { title: '目標：圍出最大的地盤',
      body: '用牆把一塊區域圍起來。區域裡只有你的棋子時，那塊地算你的。\n所有棋子都被圍住後開始計分，格數最多的人贏。' },
    { title: '開局：先把棋子放上盤',
      body: '兩人：每人 4 顆。其中 2 顆一開始就在盤上，剩下 2 顆依「紅、藍、藍、紅」的順序輪流放。\n三人：每人 2 顆，全部自己放。\n\n灰點是可以放的位置。' },
    { title: '移動：走 0 到 2 格',
      body: '選一顆自己的棋子，往上下左右走 0 到 2 格。兩格可以是直線，也可以轉彎。\n灰點是走得到的地方。不想動就走 0 格。' },
    { title: '築牆：走完一定要蓋一道',
      body: '移動結束後，在那顆棋子的四邊挑一邊蓋牆。這一步不能跳過。\n半透明的短線就是可以蓋的四個位置。' },
    { title: '牆擋所有人',
      body: '牆不分是誰蓋的，對所有人都有效，包括你自己。\n圍住自己地盤的那道牆，也可能把自己的路堵死。棋盤外圍算一圈牆。' },
    { title: '圍地：裡面只能有你的棋子',
      body: '一塊區域被牆完全圍住，而且裡面只有你的棋子，整塊算你的。\n裡面沒有棋子，或同時有別人的棋子，就是中立區，不算任何人的分。' },
    { title: '破牆：只有三人局才有',
      body: '三人：每人整局可以打破一道牆，限用一次。要打破的牆必須在自己棋子旁邊，打破後那顆棋子可以繼續走。\n鐵鎚記號就是可以打破的牆。\n\n兩人：沒有這個規則。' },
    { title: '結束與計分',
      body: '所有棋子都被圍在各自的區域裡時，遊戲結束。\n地盤格數最多的人贏，同分並列。' },
  ],
  en: [
    { title: 'The goal: claim the most ground',
      body: 'Wall off an area. If the only pieces inside are yours, that area counts as your territory.\nThe game scores once every piece is walled in, and the most squares wins.' },
    { title: 'Opening: put your pieces on the board',
      body: '2 players: 4 pieces each. Two start on the board; you place the other two in the order red, blue, blue, red.\n3 players: 2 pieces each, and you place all of them.\n\nGrey dots show where you can place.' },
    { title: 'Moving: 0 to 2 squares',
      body: 'Pick one of your pieces and move it up, down, left or right, 0 to 2 squares. Two squares can go straight or turn a corner.\nGrey dots show where you can reach. Moving 0 squares is allowed.' },
    { title: 'Walls: build one after every move',
      body: 'Once the piece has finished moving, build a wall on one of the four sides of the square it is on. You cannot skip this.\nThe short faded bars are the four places a wall can go.' },
    { title: 'Walls block everyone',
      body: 'A wall works against every player, including whoever built it.\nThe wall that closes off your territory can also block your own way out. The edge of the board counts as a wall.' },
    { title: 'Territory: only your pieces inside',
      body: 'An area fully enclosed by walls counts as yours if the only pieces inside are yours.\nIf it is empty, or holds pieces from more than one player, it is neutral and scores for nobody.' },
    { title: 'Breaking a wall: 3-player games only',
      body: '3 players: each player may break one wall, once per game. The wall has to be next to one of your pieces, and that piece can keep moving afterwards.\nThe hammer marks a wall you can break.\n\n2 players: this rule does not apply.' },
    { title: 'Ending and scoring',
      body: 'The game ends once every piece is enclosed in an area.\nWhoever holds the most squares wins; equal scores share the win.' },
  ],
  ja: [
    { title: '目的：いちばん広い陣地を取る',
      body: '壁で領域を囲みます。その中に自分の駒しかなければ、その領域は自分の陣地です。\nすべての駒が囲まれたら集計し、マス数がいちばん多い人の勝ちです。' },
    { title: '配置：まず駒を盤に置く',
      body: '2人：各4個。うち2個は最初から盤上にあり、残り2個を赤・青・青・赤の順で置きます。\n3人：各2個で、すべて自分で置きます。\n\n灰色の点が置ける場所です。' },
    { title: '移動：0〜2マス動かす',
      body: '自分の駒を1つ選び、上下左右に0〜2マス動かします。2マスは直線でも曲がってもかまいません。\n灰色の点が届く場所です。動かさない（0マス）のも選べます。' },
    { title: '壁：動いたら必ず1枚作る',
      body: '移動が終わったら、その駒がいるマスの四辺から1つ選んで壁を作ります。省略はできません。\n半透明の短い線が、作れる4か所です。' },
    { title: '壁は全員を止める',
      body: '壁は誰が作ったかに関係なく、全員に効きます。作った本人にもです。\n自分の陣地を囲む壁が、自分の出口をふさぐこともあります。盤の外周も壁として扱います。' },
    { title: '陣地：中に自分の駒だけ',
      body: '壁で完全に囲まれた領域の中に自分の駒しかなければ、その領域はすべて自分の陣地です。\n駒がない場合や、複数のプレイヤーの駒がある場合は中立エリアで、誰の得点にもなりません。' },
    { title: '壁を壊す：3人対戦のみ',
      body: '3人：1ゲームにつき1回だけ、壁を1枚壊せます。壊せるのは自分の駒の隣にある壁で、壊したあともその駒は動かせます。\nハンマーの印が壊せる壁です。\n\n2人：このルールはありません。' },
    { title: '終了と得点',
      body: 'すべての駒がそれぞれの領域に囲まれた時点で終了します。\nマス数がいちばん多い人の勝ち、同点なら引き分けです。' },
  ],
  ko: [
    { title: '목표: 가장 넓은 영역 차지하기',
      body: '벽으로 구역을 둘러쌉니다. 그 안에 내 말만 있으면 그 구역은 내 영역입니다.\n모든 말이 갇히면 점수를 세고, 칸 수가 가장 많은 사람이 이깁니다.' },
    { title: '배치: 먼저 말을 판에 놓기',
      body: '2인: 각자 4개. 그중 2개는 처음부터 판에 있고, 나머지 2개를 빨강·파랑·파랑·빨강 순서로 놓습니다.\n3인: 각자 2개를 모두 직접 놓습니다.\n\n회색 점이 놓을 수 있는 자리입니다.' },
    { title: '이동: 0~2칸 움직이기',
      body: '자기 말 하나를 골라 상하좌우로 0~2칸 움직입니다. 두 칸은 직선이어도 되고 꺾어도 됩니다.\n회색 점이 갈 수 있는 자리입니다. 움직이지 않는 것(0칸)도 됩니다.' },
    { title: '벽: 움직인 뒤 반드시 하나 세우기',
      body: '이동이 끝나면 그 말이 있는 칸의 네 변 중 하나에 벽을 세웁니다. 건너뛸 수 없습니다.\n반투명한 짧은 선이 세울 수 있는 네 자리입니다.' },
    { title: '벽은 모두를 막는다',
      body: '벽은 누가 세웠는지와 상관없이 모두에게 적용됩니다. 세운 사람에게도 마찬가지입니다.\n내 영역을 둘러싸는 벽이 내 출구를 막기도 합니다. 판의 바깥 테두리도 벽으로 칩니다.' },
    { title: '영역: 안에 내 말만 있어야 한다',
      body: '벽으로 완전히 둘러싸인 구역 안에 내 말만 있으면 그 구역 전체가 내 영역입니다.\n말이 없거나 여러 사람의 말이 섞여 있으면 중립 구역이라 아무의 점수도 되지 않습니다.' },
    { title: '벽 부수기: 3인전에만 있음',
      body: '3인: 한 게임에 한 번, 벽 하나를 부술 수 있습니다. 부술 벽은 내 말 옆에 있어야 하고, 부순 뒤에도 그 말은 계속 움직일 수 있습니다.\n망치 표시가 부술 수 있는 벽입니다.\n\n2인: 이 규칙은 없습니다.' },
    { title: '종료와 점수',
      body: '모든 말이 각자의 구역에 갇히면 게임이 끝납니다.\n칸 수가 가장 많은 사람이 이기고, 같으면 공동 승리입니다.' },
  ],
};
