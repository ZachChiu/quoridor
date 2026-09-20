import type { Locale } from '../locales';

/**
 * 逐步教學的文字，四語系各一份。
 *
 * 盤面圖留在 tutorialSteps.ts —— 圖不分語言，跟著文字複製四份只會讓
 * 「改了圖忘記改另外三份」變成常態。這裡只放會變的部分。
 *
 * 用詞照 app/i18n/glossary.md。長度與非空由 tests/i18n/content.test.ts 鎖住。
 */
export type StepText = { title: string; body: string };

export const STEP_TEXT: Record<Locale, StepText[]> = {
  'zh-TW': [
    { title: '目標：圍出最大的地盤',
      body: '用牆把區域封閉起來。封閉區域裡只有你的棋子，那塊地就是你的。最後地盤格數最多的人獲勝。' },
    { title: '開局：輪流放棋子',
      body: '兩人局各有 4 顆棋子，其中 2 顆已在盤上，其餘依「紅、藍、藍、紅」的蛇形順序擺放，先後手才公平。三人局則是每人 2 顆，全部自己擺。' },
    { title: '移動：每回合走 0 到 2 格',
      body: '選一顆自己的棋子，上下左右移動 0 到 2 格。兩格可以是直線，也可以轉彎走 L 形。灰點就是走得到的位置 —— 不想動也可以，直接築牆。' },
    { title: '築牆：移動後一定要築一道',
      body: '移動結束後，必須在那顆棋子的相鄰邊築一道牆。這是強制的，不能跳過。半透明的預覽就是可以築的位置，滑過去會變成實心。' },
    { title: '牆不分敵我',
      body: '任何人築的牆，所有人都擋。你用來圍自己地盤的牆，同時也可能封死自己的退路 —— 每一手都是算計與取捨。棋盤的外圍本身也算牆。' },
    { title: '圍地：區域裡只能有你的棋子',
      body: '被牆完全封閉的區域，如果裡面只有你的棋子，整塊都算你的。若裡面沒有棋子、或同時有別人的棋子，就是中立區，誰都不計分。' },
    { title: '結束與勝負',
      body: '當所有棋子都被封閉在各自的區域裡，遊戲結束。地盤格數最多的人獲勝；同分則並列。三人局每人另有一次破牆機會，可以拆掉一道相鄰的牆再繼續移動。' },
  ],
  en: [
    { title: 'The goal: enclose the most ground',
      body: 'Use walls to seal off an area. If the only pieces inside are yours, the whole area is your territory. Whoever ends up with the most squares wins.' },
    { title: 'Opening: take turns placing pieces',
      body: 'In a 2-player game each side has 4 pieces, 2 of which start on the board. The rest go down in a snake order — red, blue, blue, red — so neither side gains from going first. In a 3-player game everyone places all 2 of their pieces.' },
    { title: 'Moving: 0 to 2 squares per turn',
      body: 'Pick one of your pieces and move it up, down, left or right, 0 to 2 squares. Two squares can be a straight line or an L-shaped turn. The grey dots show where you can reach — and staying put is a legal move, if you only want to build.' },
    { title: 'Walls: you must build one after moving',
      body: 'Once the piece has moved, you must build a wall on one of the four edges of the square it finished on. This is compulsory, not optional. The faded previews show where a wall can go; hover one and it becomes solid.' },
    { title: 'Walls block everyone',
      body: "A wall blocks every player, including whoever built it. The wall you use to close off your own territory may also seal off your own escape route — every turn is a trade-off. The outer edge of the board counts as a wall too." },
    { title: 'Territory: only your pieces inside',
      body: 'When an area is completely enclosed by walls and the only pieces inside are yours, the whole area counts as your territory. If the area is empty, or contains pieces from more than one player, it is neutral and scores for nobody.' },
    { title: 'Ending and scoring',
      body: 'The game ends once every piece is sealed inside an enclosed area. The player with the most squares wins; equal scores share the win. In a 3-player game each player may also break one wall, once per game, and then carry on moving.' },
  ],
  ja: [
    { title: '目的：いちばん広い陣地を囲む',
      body: '壁で領域を囲みます。囲まれた領域の中に自分の駒しかなければ、その領域はすべて自分の陣地です。最後にマス数がいちばん多い人の勝ちです。' },
    { title: '配置：交互に駒を置く',
      body: '2人対戦では駒は各4個で、うち2個は最初から盤上にあります。残りは「赤・青・青・赤」の蛇行順で置くので、先手後手で不公平になりません。3人対戦では各2個をすべて自分で置きます。' },
    { title: '移動：毎ターン0〜2マス',
      body: '自分の駒を1つ選び、上下左右に0〜2マス動かします。2マスは直線でもL字に曲がってもかまいません。灰色の点が届く位置です。動かさずに壁だけ作ることもできます。' },
    { title: '壁：動いたあと必ず1枚作る',
      body: '移動が終わったら、その駒がいるマスの隣接する辺に壁を1枚作らなければなりません。これは必須で、飛ばせません。半透明のプレビューが作れる位置で、カーソルを合わせると実線になります。' },
    { title: '壁は敵味方を区別しない',
      body: '誰が作った壁でも、全員を等しく止めます。自分の陣地を囲むための壁が、自分の逃げ道をふさぐこともあります。一手ごとに損得を計算することになります。盤の外周も壁として扱われます。' },
    { title: '陣地：中に自分の駒だけ',
      body: '壁で完全に囲まれた領域の中に自分の駒しかなければ、その領域はまるごと自分の陣地になります。中に駒がない場合や、複数のプレイヤーの駒がある場合は中立エリアとなり、誰の得点にもなりません。' },
    { title: '終了と勝敗',
      body: 'すべての駒がそれぞれの囲まれた領域に閉じ込められた時点で終了です。マス数がいちばん多い人の勝ち、同点なら引き分けです。3人対戦では各自1回だけ隣の壁を壊して、そのまま移動を続けられます。' },
  ],
  ko: [
    { title: '목표: 가장 넓은 영역 차지하기',
      body: '벽으로 구역을 둘러쌉니다. 둘러싸인 구역 안에 내 말만 있으면 그 구역 전체가 내 영역이 됩니다. 마지막에 칸 수가 가장 많은 사람이 이깁니다.' },
    { title: '배치: 번갈아 말 놓기',
      body: '2인전에서는 각자 말이 4개이고 그중 2개는 처음부터 판에 있습니다. 나머지는 빨강·파랑·파랑·빨강 순서로 놓기 때문에 선후공에 따른 유불리가 없습니다. 3인전에서는 각자 2개를 모두 직접 놓습니다.' },
    { title: '이동: 매 턴 0~2칸',
      body: '자기 말 하나를 골라 상하좌우로 0~2칸 움직입니다. 두 칸은 직선이어도 되고 ㄱ자로 꺾어도 됩니다. 회색 점이 갈 수 있는 자리입니다. 움직이지 않고 벽만 세워도 됩니다.' },
    { title: '벽: 이동 후 반드시 하나 세우기',
      body: '이동이 끝나면 그 말이 있는 칸의 인접한 변에 벽을 하나 세워야 합니다. 선택이 아니라 필수입니다. 반투명하게 보이는 것이 세울 수 있는 자리이고, 마우스를 올리면 진하게 바뀝니다.' },
    { title: '벽은 편을 가리지 않는다',
      body: '누가 세운 벽이든 모두를 똑같이 막습니다. 내 영역을 둘러싸려고 세운 벽이 내 퇴로를 막을 수도 있습니다. 매 수가 계산과 선택입니다. 판의 바깥 테두리도 벽으로 칩니다.' },
    { title: '영역: 안에 내 말만 있어야 한다',
      body: '벽으로 완전히 둘러싸인 구역 안에 내 말만 있으면 그 구역 전체가 내 영역이 됩니다. 말이 하나도 없거나 두 명 이상의 말이 섞여 있으면 중립 구역이 되어 아무의 점수도 되지 않습니다.' },
    { title: '종료와 승패',
      body: '모든 말이 각자 둘러싸인 구역에 갇히면 게임이 끝납니다. 칸 수가 가장 많은 사람이 이기고, 같으면 공동 승리입니다. 3인전에서는 각자 한 번씩 인접한 벽을 부수고 이어서 움직일 수 있습니다.' },
  ],
};
