import type { Locale } from '../locales';

/**
 * 遊戲內 UI 的字串，四語系各一份。
 *
 * 與 messages/ 分開：那邊是頁面與 metadata（SEO 相關、會跟著行銷文案改），
 * 這邊是操作介面（跟著功能改）。兩者的改動頻率與改動的人都不一樣。
 *
 * 帶變數的字串用 `{name}` 佔位符而不是字串相接 —— 語序在四個語言裡
 * 不一樣（「紅方的棋子」vs「red's piece」vs「빨강의 말」），
 * 相接的寫法在某個語言一定會變成怪句子。
 */
export type GameText = {
  /** and：列出多位勝方時的連接詞（「紅方、藍方」vs「Red & Blue」vs「ฝ่ายแดง และ ฝ่ายน้ำเงิน」） */
  players: { A: string; B: string; C: string; and: string };
  board: {
    label: string; cell: string; piece: string; territory: string; empty: string;
    canMove: string; canPlace: string; wallBelow: string; wallRight: string;
    breakBelow: string; breakRight: string;
    buildTop: string; buildBottom: string; buildLeft: string; buildRight: string;
  };
  pad: {
    heading: string; top: string; bottom: string; left: string; right: string;
    pick: string; pending: string; choose: string; confirm: string;
    step1: string; step2: string; stepPlace: string; remain: string; noMove: string;
    done: string; redo: string; pickPiece: string; switchPiece: string;
    moveUp: string; moveDown: string; moveLeft: string; moveRight: string;
    wallUp: string; wallDown: string; wallLeft: string; wallRight: string;
    hintMove: string; hintWall: string; hintReady: string;
    breakWall: string; breakPick: string; breakNone: string;
    breakUp: string; breakDown: string; breakLeft: string; breakRight: string;
    hintWait: string;
  };
  tips: {
    over: string; overWin: string; thinking: string; placing: string; moving: string;
    breakLeft: string; breakNone: string;
  };
  champion: {
    draw: string; win: string;
    matchOver: string; winner: string; feedback: string;
    seeBoard: string; playAgain: string; squares: string; seeResult: string;
  };
  /** 首頁右上角的「聯絡我們」：同一個回饋視窗，但不綁某一局（沒有棋譜、評分選填）。 */
  contact: { button: string; heading: string; kicker: string; ratingLabel: string; placeholder: string; note: string; sentBody: string };
  feedback: {
    bad: string; ok: string; good: string; sent: string; heading: string; kicker: string;
    sending: string; submit: string; ratingLabel: string; placeholder: string;
    contactPlaceholder: string; later: string; sentBody: string; messageLabel: string;
    contactLabel: string; note: string; failed: string;
  };
  share: {
    shareTitle: string; shareText: string; heading: string; kicker: string;
    copied: string; copyAria: string; copy: string; waiting: string; body: string; share: string;
  };
  waiting: { kicker: string; heading: string; invite: string };
  breakWall: { heading: string; kicker: string; cancel: string; confirm: string; body: string };
  surrender: { label: string; heading: string; kicker: string; cancel: string; confirm: string; body: string; bodyThree: string };
  leave: { heading: string; kicker: string; body: string; bodyOnline: string; cancel: string; confirm: string };
  status: { claimed: string };
  play: {
    noRoom: string; roomFull: string; playerName: string; connectFail: string;
    noRoomBody: string; roomFullBody: string; connectFailBody: string; reload: string;
    home: string; howToPlay: string; unfinished: string; connecting: string; backHome: string;
    badLink: string; badLinkBody: string; gameStart: string;
  };
};

/** 把 `{name}` 換成實際值。語序交給翻譯決定，不由程式相接。 */
export const fmt = (s: string, vars: Record<string, string | number>): string =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

export const GAME_TEXT: Record<Locale, GameText> = {
  'zh-TW': {
    players: { A: '紅方', B: '藍方', C: '綠方', and: '、' },
    board: {
      label: '棋盤', cell: '第 {row} 列第 {col} 行', piece: '{player}棋子',
      territory: '{player}領地', empty: '空格', canMove: '可移動到這裡', canPlace: '可放置棋子',
      wallBelow: '下方有牆', wallRight: '右方有牆',
      breakBelow: '破壞下方的牆', breakRight: '破壞右方的牆',
      buildTop: '在上方築牆', buildBottom: '在下方築牆', buildLeft: '在左方築牆', buildRight: '在右方築牆',
    },
    pad: {
      heading: '築牆方向', top: '上方', bottom: '下方', left: '左方', right: '右方',
      pick: '選一個方向築牆', pending: '要在{side}築牆', choose: '選擇{side}', confirm: '確定築牆',
    step1: '① 移動', step2: '② 築牆', stepPlace: '放棋子', remain: '還可走 {n} 格', noMove: '不移動也可以', done: '完成這一步', pickPiece: '選一顆棋子', switchPiece: '換下一顆棋子', redo: '重來這一步', moveUp: '往上移動', moveDown: '往下移動', moveLeft: '往左移動', moveRight: '往右移動', wallUp: '在上方築牆', wallDown: '在下方築牆', wallLeft: '在左方築牆', wallRight: '在右方築牆', hintMove: '先移動棋子（或不動）', hintWall: '再選一道牆', hintReady: '按 ✓ 完成這一步',
    breakWall: '破牆', breakUp: '打破上方的牆', breakDown: '打破下方的牆', breakLeft: '打破左方的牆', breakRight: '打破右方的牆', breakPick: '選一道要打破的牆', breakNone: '這一局的破牆已經用掉了', hintWait: '等對手下',
    },
    tips: {
      over: '遊戲結束！', overWin: '遊戲結束！{names}勝利！', thinking: '{who} 思考中…',
      placing: '{who} · 放置棋子', moving: '{who} · 移動棋子',
      breakLeft: '還有一次破牆機會', breakNone: '沒有破牆機會',
    },
    champion: {
      draw: '平局', win: '{names}勝利',
      matchOver: '對局結束', winner: '勝方', feedback: '給點意見',
      seeBoard: '看看棋盤', playAgain: '再來一局', squares: '格', seeResult: '看結算',
    },
    contact: {
      button: '聯絡我們', heading: '聯絡我們', kicker: '給開發者的話',
      ratingLabel: '玩起來的感覺（選填）', placeholder: '想說什麼都可以：哪裡怪怪的、想要什麼功能，或單純打個招呼',
      note: '會一併送出你的裝置資訊（瀏覽器、螢幕大小），方便我重現問題。',
      sentBody: '每一則我都會讀。有留聯絡方式的話，我會回覆你。',
    },
    feedback: {
      bad: '很卡', ok: '還行', good: '很好玩', sent: '收到了，謝謝',
      heading: '這局玩起來如何？', kicker: '給開發者的話', sending: '送出中…', submit: '送出',
      ratingLabel: '這局的感覺', placeholder: '例如：三人局有人不能動的時候畫面卡住了',
      contactPlaceholder: 'email 或任何找得到你的地方', later: '先不要',
      sentBody: '你的這局棋譜也一起送出了，所以我看得到你當下的盤面 —— 不必再描述一次。',
      messageLabel: '哪裡怪怪的？或想說什麼都可以',
      contactLabel: '想被回覆的話留個聯絡方式（選填）',
      note: '送出時會一併附上這局的棋譜與裝置資訊，我才重現得出你遇到的狀況。',
      failed: '送不出去 —— 可能是網路斷了。再按一次送出試試。',
    },
    share: {
      shareTitle: '牆壁圍棋 Wall Go', shareText: '我開了一間房，點連結直接加入對局！',
      heading: '邀請朋友加入', kicker: '連線對戰', copied: '已複製', copyAria: '複製連結',
      copy: '複製', waiting: '等待中', body: '把連結傳給朋友，他們點開就會直接坐進這間房。',
      share: '分享連結',
    },
    waiting: { kicker: '連線對戰', heading: '等朋友進來', invite: '邀請朋友加入' },
    breakWall: {
      heading: '要打破這面牆嗎', kicker: '每人只有一次', cancel: '取消', confirm: '破牆',
      body: '打破後這顆棋子可以繼續移動，但你的破牆機會會歸零 —— 這一局不會再有第二次。',
    },
    leave: {
      heading: '要離開這一局嗎', kicker: '還沒下完', body: '離開之後，這一局不會保留。',
      bodyOnline: '你離開之後，對手會停在這一局等你。', cancel: '繼續下', confirm: '離開',
    },
    surrender: {
      label: '投降', heading: '確定要投降嗎', kicker: '投降就算輸',
      cancel: '繼續下', confirm: '投降',
      body: '這一局到此結束，你判負。',
      bodyThree: '這一局到此結束，你判負。另外兩位照目前的地盤決定勝負。',
    },
    status: { claimed: '已佔領' },
    play: {
      noRoom: '不存在的對局', roomFull: '房間已滿，無法加入', playerName: '玩家 {id}',
      connectFail: '連不上房間',
      noRoomBody: '這個房間不存在，可能是連結少了幾個字。跟對方要一次完整的連結，或回首頁開一間新的。',
      roomFullBody: '這一局的座位都坐滿了。回首頁開一間新的，再把連結傳給朋友。',
      connectFailBody: '可能是網路不穩。重新整理再試一次——已經下的每一手都存在房間裡。',
      reload: '重新整理', home: '回首頁', howToPlay: '遊玩方式',
      unfinished: '未結束', connecting: '正在連線…', backHome: '返回首頁',
      badLink: '這個連結沒有指向任何對局', gameStart: '遊戲開始',
      badLinkBody: '邀請連結可能被截斷了。跟對方要一次完整的連結，或回首頁開一間新的。',
    },
  },
  en: {
    players: { A: 'Red', B: 'Blue', C: 'Green', and: ' & ' },
    board: {
      label: 'Board', cell: 'Row {row}, column {col}', piece: '{player} piece',
      territory: '{player} territory', empty: 'empty', canMove: 'can move here', canPlace: 'can place a piece',
      wallBelow: 'wall below', wallRight: 'wall to the right',
      breakBelow: 'break the wall below', breakRight: 'break the wall to the right',
      buildTop: 'build a wall above', buildBottom: 'build a wall below',
      buildLeft: 'build a wall to the left', buildRight: 'build a wall to the right',
    },
    pad: {
      heading: 'Wall direction', top: 'above', bottom: 'below', left: 'the left', right: 'the right',
      pick: 'Pick a direction', pending: 'Building {side}', choose: 'Choose {side}', confirm: 'Build the wall',
    step1: '1 Move', step2: '2 Wall', stepPlace: 'Place a piece', remain: '{n} squares left', noMove: 'staying put is fine', done: 'Finish this turn', pickPiece: 'Pick a piece', switchPiece: 'Switch to your next piece', redo: 'Start this turn over', moveUp: 'Move up', moveDown: 'Move down', moveLeft: 'Move left', moveRight: 'Move right', wallUp: 'Build a wall above', wallDown: 'Build a wall below', wallLeft: 'Build a wall to the left', wallRight: 'Build a wall to the right', hintMove: 'Move your piece (or stay put)', hintWall: 'Now pick a wall', hintReady: 'Press ✓ to finish',
    breakWall: 'Break a wall', breakUp: 'Break the wall above', breakDown: 'Break the wall below', breakLeft: 'Break the wall to the left', breakRight: 'Break the wall to the right', breakPick: 'Pick a wall to break', breakNone: 'You have used your wall break', hintWait: 'Waiting for your opponent',
    },
    tips: {
      over: 'Game over', overWin: 'Game over — {names} wins!', thinking: '{who} is thinking…',
      placing: '{who} · place a piece', moving: '{who} · move a piece',
      breakLeft: 'One wall break left', breakNone: 'No wall break left',
    },
    champion: {
      draw: 'Draw', win: '{names} wins',
      matchOver: 'Match over', winner: 'Winner', feedback: 'Send feedback',
      seeBoard: 'Look at the board', playAgain: 'Play again', squares: 'squares', seeResult: 'See the result',
    },
    contact: {
      button: 'Contact', heading: 'Get in touch', kicker: 'A note to the developer',
      ratingLabel: 'How it feels to play (optional)', placeholder: 'Anything goes: something that looks off, a feature you want, or just hello',
      note: 'Your device details (browser, screen size) are sent along so I can reproduce problems.',
      sentBody: 'I read every message. If you left a way to reach you, I will reply.',
    },
    feedback: {
      bad: 'Rough', ok: 'Fine', good: 'Great fun', sent: 'Got it — thank you',
      heading: 'How was that game?', kicker: 'A note to the developer', sending: 'Sending…', submit: 'Send',
      ratingLabel: 'How the game felt', placeholder: 'e.g. the screen froze when a player could not move in a 3-player game',
      contactPlaceholder: 'Email, or anywhere else I can reach you', later: 'Not now',
      sentBody: 'Your game record went with it, so I can see the exact board you were looking at — no need to describe it.',
      messageLabel: 'What felt off? Anything else is welcome too',
      contactLabel: 'Leave a contact if you want a reply (optional)',
      note: 'Sending also attaches this game record and your device details, so I can reproduce what you ran into.',
      failed: 'That did not send — your connection may have dropped. Press send again.',
    },
    share: {
      shareTitle: 'Wall Go', shareText: 'I opened a room — tap the link to join the game!',
      heading: 'Invite a friend', kicker: 'Online play', copied: 'Copied', copyAria: 'Copy link',
      copy: 'Copy', waiting: 'Waiting', body: 'Send the link to a friend and they will drop straight into this room.',
      share: 'Share link',
    },
    waiting: { kicker: 'Online play', heading: 'Waiting for a friend', invite: 'Invite a friend' },
    breakWall: {
      heading: 'Break this wall?', kicker: 'Once per game', cancel: 'Cancel', confirm: 'Break it',
      body: 'This piece can keep moving afterwards, but your wall break is then gone — there is no second one this game.',
    },
    leave: {
      heading: 'Leave this game?', kicker: 'Not finished yet', body: "This game won't be kept once you leave.",
      bodyOnline: 'Your opponent will be left waiting in this game.', cancel: 'Keep playing', confirm: 'Leave',
    },
    surrender: {
      label: 'Resign', heading: 'Resign this game?', kicker: 'Resigning is a loss',
      cancel: 'Keep playing', confirm: 'Resign',
      body: 'The game ends here and you lose.',
      bodyThree: 'The game ends here and you lose. The other two are ranked by the territory they hold right now.',
    },
    status: { claimed: 'Territory' },
    play: {
      noRoom: 'No such game', roomFull: 'This room is full', playerName: 'Player {id}',
      connectFail: 'Could not reach the room',
      noRoomBody: 'This room does not exist — the link may be missing a few characters. Ask for the full link again, or go home and open a new room.',
      roomFullBody: 'Every seat in this game is taken. Go home, open a new room and send your friends the link.',
      connectFailBody: 'Your connection may be unstable. Reload and try again — every move so far is saved in the room.',
      reload: 'Reload', home: 'Home', howToPlay: 'How to play',
      unfinished: 'unfinished', connecting: 'Connecting…', backHome: 'Back to home',
      badLink: 'This link does not point to a game', gameStart: 'Game start',
      badLinkBody: 'The invite link may have been cut short. Ask for the full link again, or go home and open a new room.',
    },
  },
  ja: {
    players: { A: '赤', B: '青', C: '緑', and: '・' },
    board: {
      label: '盤面', cell: '{row}行 {col}列', piece: '{player}の駒',
      territory: '{player}の陣地', empty: '空きマス', canMove: 'ここへ動かせる', canPlace: '駒を置ける',
      wallBelow: '下に壁', wallRight: '右に壁',
      breakBelow: '下の壁を壊す', breakRight: '右の壁を壊す',
      buildTop: '上に壁を作る', buildBottom: '下に壁を作る',
      buildLeft: '左に壁を作る', buildRight: '右に壁を作る',
    },
    pad: {
      heading: '壁の向き', top: '上', bottom: '下', left: '左', right: '右',
      pick: '向きを選んでください', pending: '{side}に壁を作ります', choose: '{side}を選ぶ', confirm: '壁を作る',
    step1: '① 移動', step2: '② 壁', stepPlace: '駒を置く', remain: 'あと {n} マス', noMove: '動かさなくてもよい', done: 'この手を確定', pickPiece: '駒を選ぶ', switchPiece: '次の駒に切り替える', redo: 'この手をやり直す', moveUp: '上へ移動', moveDown: '下へ移動', moveLeft: '左へ移動', moveRight: '右へ移動', wallUp: '上に壁を作る', wallDown: '下に壁を作る', wallLeft: '左に壁を作る', wallRight: '右に壁を作る', hintMove: 'まず駒を動かす（動かさなくてもよい）', hintWall: '次に壁を選ぶ', hintReady: '✓ で確定',
    breakWall: '壁を壊す', breakUp: '上の壁を壊す', breakDown: '下の壁を壊す', breakLeft: '左の壁を壊す', breakRight: '右の壁を壊す', breakPick: '壊す壁を選ぶ', breakNone: '壁を壊す回数は使い切りました', hintWait: '相手の番です',
    },
    tips: {
      over: 'ゲーム終了', overWin: 'ゲーム終了 —— {names}の勝ち！', thinking: '{who} が考えています…',
      placing: '{who} · 駒を置く', moving: '{who} · 駒を動かす',
      breakLeft: '壁を壊せる回数：あと1回', breakNone: '壁を壊せる回数：なし',
    },
    champion: {
      draw: '引き分け', win: '{names}の勝ち',
      matchOver: '対局終了', winner: '勝者', feedback: '意見を送る',
      seeBoard: '盤面を見る', playAgain: 'もう一局', squares: 'マス', seeResult: '結果を見る',
    },
    contact: {
      button: 'お問い合わせ', heading: 'お問い合わせ', kicker: '開発者へのひとこと',
      ratingLabel: '遊んでみた感想（任意）', placeholder: '何でもどうぞ：おかしな所、ほしい機能、ひとことのあいさつでも',
      note: '問題を再現できるよう、端末の情報（ブラウザ、画面サイズ）も一緒に送られます。',
      sentBody: 'すべて目を通します。連絡先を書いてくれた方には返信します。',
    },
    feedback: {
      bad: 'いまいち', ok: 'まあまあ', good: 'とても面白い', sent: '受け取りました。ありがとう',
      heading: '今の一局はどうでしたか？', kicker: '開発者へのひとこと', sending: '送信中…', submit: '送信',
      ratingLabel: '今の一局の感想', placeholder: '例：3人対戦で動けない人が出たとき画面が止まった',
      contactPlaceholder: 'メールなど、連絡のつく場所', later: 'あとで',
      sentBody: '棋譜も一緒に送られたので、あなたが見ていた盤面をそのまま再現できます。説明し直す必要はありません。',
      messageLabel: '気になったところ、そのほか何でもどうぞ',
      contactLabel: '返信がほしい場合は連絡先を（任意）',
      note: '送信すると、この対局の棋譜と端末の情報も一緒に送られます。再現のために使います。',
      failed: '送信できませんでした。通信が切れたのかもしれません。もう一度お試しください。',
    },
    share: {
      shareTitle: '壁囲碁 Wall Go', shareText: '部屋を作りました。リンクからそのまま参加できます！',
      heading: '友だちを招待', kicker: 'オンライン対戦', copied: 'コピーしました', copyAria: 'リンクをコピー',
      copy: 'コピー', waiting: '待機中', body: 'リンクを友だちに送ると、開いただけでこの部屋に入れます。',
      share: 'リンクを共有',
    },
    waiting: { kicker: 'オンライン対戦', heading: '友だちを待っています', invite: '友だちを招待' },
    breakWall: {
      heading: 'この壁を壊しますか？', kicker: '1ゲームに1回だけ', cancel: 'やめる', confirm: '壊す',
      body: '壊したあともこの駒は動かせますが、壁を壊せる回数は0になります。この一局でもう一度は使えません。',
    },
    leave: {
      heading: 'この対局を抜けますか？', kicker: 'まだ終わっていません', body: '抜けると、この対局は残りません。',
      bodyOnline: 'あなたが抜けると、相手はこの対局で待ち続けることになります。', cancel: '続ける', confirm: '抜ける',
    },
    surrender: {
      label: '投了', heading: '投了しますか？', kicker: '投了は負けです',
      cancel: '続ける', confirm: '投了する',
      body: 'この一局はここで終わり、あなたの負けになります。',
      bodyThree: 'この一局はここで終わり、あなたの負けになります。残りの2人は今の陣地で勝敗を決めます。',
    },
    status: { claimed: '陣地' },
    play: {
      noRoom: 'その対局は存在しません', roomFull: 'この部屋は満員です', playerName: 'プレイヤー {id}',
      connectFail: '部屋に接続できませんでした',
      noRoomBody: 'この部屋は存在しません。リンクの一部が欠けている可能性があります。完全なリンクをもう一度もらうか、ホームから新しい部屋を作ってください。',
      roomFullBody: 'この対局の席はすべて埋まっています。ホームから新しい部屋を作って、友だちにリンクを送ってください。',
      connectFailBody: '通信が不安定な可能性があります。再読み込みしてもう一度お試しください。これまでの手はすべて部屋に保存されています。',
      reload: '再読み込み', home: 'ホーム', howToPlay: '遊び方',
      unfinished: '未完了', connecting: '接続中…', backHome: 'ホームに戻る',
      badLink: 'このリンクはどの対局も指していません', gameStart: 'ゲームスタート',
      badLinkBody: '招待リンクが途中で切れている可能性があります。完全なリンクをもう一度もらうか、ホームから新しい部屋を作ってください。',
    },
  },
  ko: {
    players: { A: '빨강', B: '파랑', C: '초록', and: ', ' },
    board: {
      label: '판', cell: '{row}행 {col}열', piece: '{player} 말',
      territory: '{player} 영역', empty: '빈 칸', canMove: '여기로 이동 가능', canPlace: '말을 놓을 수 있음',
      wallBelow: '아래에 벽', wallRight: '오른쪽에 벽',
      breakBelow: '아래 벽 부수기', breakRight: '오른쪽 벽 부수기',
      buildTop: '위에 벽 세우기', buildBottom: '아래에 벽 세우기',
      buildLeft: '왼쪽에 벽 세우기', buildRight: '오른쪽에 벽 세우기',
    },
    pad: {
      heading: '벽 방향', top: '위', bottom: '아래', left: '왼쪽', right: '오른쪽',
      pick: '방향을 고르세요', pending: '{side}에 벽을 세웁니다', choose: '{side} 선택', confirm: '벽 세우기',
    step1: '① 이동', step2: '② 벽', stepPlace: '말 놓기', remain: '{n}칸 남음', noMove: '움직이지 않아도 됩니다', done: '이 수 완료', pickPiece: '말 고르기', switchPiece: '다음 말로 바꾸기', redo: '이 수 다시', moveUp: '위로 이동', moveDown: '아래로 이동', moveLeft: '왼쪽으로 이동', moveRight: '오른쪽으로 이동', wallUp: '위에 벽 세우기', wallDown: '아래에 벽 세우기', wallLeft: '왼쪽에 벽 세우기', wallRight: '오른쪽에 벽 세우기', hintMove: '먼저 말을 움직이세요 (안 움직여도 됩니다)', hintWall: '이제 벽을 고르세요', hintReady: '✓ 를 누르면 완료',
    breakWall: '벽 부수기', breakUp: '위쪽 벽 부수기', breakDown: '아래쪽 벽 부수기', breakLeft: '왼쪽 벽 부수기', breakRight: '오른쪽 벽 부수기', breakPick: '부술 벽을 고르세요', breakNone: '벽 부수기를 이미 사용했습니다', hintWait: '상대 차례입니다',
    },
    tips: {
      over: '게임 종료', overWin: '게임 종료 —— {names} 승리!', thinking: '{who} 생각 중…',
      placing: '{who} · 말 놓기', moving: '{who} · 말 이동',
      breakLeft: '벽 부수기 1회 남음', breakNone: '벽 부수기 없음',
    },
    champion: {
      draw: '무승부', win: '{names} 승리',
      matchOver: '대국 종료', winner: '승자', feedback: '의견 보내기',
      seeBoard: '판 보기', playAgain: '다시 한 판', squares: '칸', seeResult: '결과 보기',
    },
    contact: {
      button: '문의하기', heading: '문의하기', kicker: '개발자에게 한마디',
      ratingLabel: '플레이해 본 느낌 (선택)', placeholder: '무엇이든 좋아요: 이상한 점, 원하는 기능, 간단한 인사도',
      note: '문제를 재현할 수 있도록 기기 정보(브라우저, 화면 크기)도 함께 보내집니다.',
      sentBody: '모든 메시지를 읽습니다. 연락처를 남겨 주시면 답장드릴게요.',
    },
    feedback: {
      bad: '답답함', ok: '괜찮음', good: '아주 재밌음', sent: '잘 받았습니다. 고맙습니다',
      heading: '이번 판 어떠셨나요?', kicker: '개발자에게 한마디', sending: '보내는 중…', submit: '보내기',
      ratingLabel: '이번 판의 느낌', placeholder: '예: 3인전에서 움직일 수 없는 사람이 생겼을 때 화면이 멈췄어요',
      contactPlaceholder: '이메일 등 연락 가능한 곳', later: '다음에',
      sentBody: '기보도 함께 보내져서 그때 보시던 판을 그대로 재현할 수 있습니다. 다시 설명하지 않으셔도 됩니다.',
      messageLabel: '이상했던 점이나 하고 싶은 말 무엇이든',
      contactLabel: '답변을 원하시면 연락처를 남겨주세요 (선택)',
      note: '보낼 때 이 판의 기보와 기기 정보도 함께 전송됩니다. 재현하는 데 사용합니다.',
      failed: '보내지 못했습니다. 연결이 끊겼을 수 있습니다. 다시 눌러보세요.',
    },
    share: {
      shareTitle: '벽바둑 Wall Go', shareText: '방을 만들었어요. 링크를 누르면 바로 들어올 수 있습니다!',
      heading: '친구 초대하기', kicker: '온라인 대전', copied: '복사됨', copyAria: '링크 복사',
      copy: '복사', waiting: '대기 중', body: '링크를 친구에게 보내면, 열자마자 이 방으로 들어옵니다.',
      share: '링크 공유',
    },
    waiting: { kicker: '온라인 대전', heading: '친구를 기다리는 중', invite: '친구 초대하기' },
    breakWall: {
      heading: '이 벽을 부술까요?', kicker: '한 게임에 한 번만', cancel: '취소', confirm: '부수기',
      body: '부순 뒤에도 이 말은 계속 움직일 수 있지만, 벽 부수기 기회는 사라집니다. 이번 판에 다시는 쓸 수 없습니다.',
    },
    leave: {
      heading: '이 대국을 나갈까요?', kicker: '아직 끝나지 않았어요', body: '나가면 이 대국은 남지 않습니다.',
      bodyOnline: '나가면 상대는 이 대국에서 계속 기다리게 됩니다.', cancel: '계속하기', confirm: '나가기',
    },
    surrender: {
      label: '기권', heading: '기권할까요?', kicker: '기권하면 패배입니다',
      cancel: '계속 두기', confirm: '기권',
      body: '이번 판은 여기서 끝나고 패배로 처리됩니다.',
      bodyThree: '이번 판은 여기서 끝나고 패배로 처리됩니다. 나머지 두 사람은 현재 영역으로 승부를 가립니다.',
    },
    status: { claimed: '영역' },
    play: {
      noRoom: '존재하지 않는 대국입니다', roomFull: '방이 가득 찼습니다', playerName: '플레이어 {id}',
      connectFail: '방에 연결하지 못했습니다',
      noRoomBody: '이 방은 존재하지 않습니다. 링크 일부가 잘렸을 수 있습니다. 전체 링크를 다시 받거나 홈에서 새 방을 만드세요.',
      roomFullBody: '이 대국의 자리가 모두 찼습니다. 홈에서 새 방을 만들고 친구에게 링크를 보내세요.',
      connectFailBody: '네트워크가 불안정할 수 있습니다. 새로고침 후 다시 시도해 주세요. 지금까지의 수는 모두 방에 저장되어 있습니다.',
      reload: '새로고침', home: '홈', howToPlay: '플레이 방법',
      unfinished: '미완료', connecting: '연결 중…', backHome: '홈으로',
      badLink: '이 링크는 어떤 대국도 가리키지 않습니다', gameStart: '게임 시작',
      badLinkBody: '초대 링크가 중간에 잘렸을 수 있습니다. 전체 링크를 다시 받거나, 홈에서 새 방을 만들어 주세요.',
    },
  },
  'zh-Hans': {
    players: { A: '红方', B: '蓝方', C: '绿方', and: '、' },
    board: {
      label: '棋盘', cell: '第 {row} 行第 {col} 列', piece: '{player}棋子',
      territory: '{player}地盘', empty: '空格', canMove: '可以移动到这里', canPlace: '可以放棋子',
      wallBelow: '下方有墙', wallRight: '右侧有墙',
      breakBelow: '拆掉下方的墙', breakRight: '拆掉右侧的墙',
      buildTop: '在上方筑墙', buildBottom: '在下方筑墙', buildLeft: '在左侧筑墙', buildRight: '在右侧筑墙',
    },
    pad: {
      heading: '筑墙方向', top: '上方', bottom: '下方', left: '左侧', right: '右侧',
      pick: '选一个方向筑墙', pending: '要在{side}筑墙', choose: '选择{side}', confirm: '确定筑墙',
      step1: '① 移动', step2: '② 筑墙', stepPlace: '放棋子', remain: '还能走 {n} 格', noMove: '不移动也可以',
      done: '完成这一步', pickPiece: '选一枚棋子', switchPiece: '换下一枚棋子', redo: '重来这一步',
      moveUp: '向上移动', moveDown: '向下移动', moveLeft: '向左移动', moveRight: '向右移动',
      wallUp: '在上方筑墙', wallDown: '在下方筑墙', wallLeft: '在左侧筑墙', wallRight: '在右侧筑墙',
      hintMove: '先移动棋子（也可以不动）', hintWall: '再选一道墙', hintReady: '按 ✓ 完成这一步',
      breakWall: '破墙', breakUp: '拆掉上方的墙', breakDown: '拆掉下方的墙', breakLeft: '拆掉左侧的墙', breakRight: '拆掉右侧的墙',
      breakPick: '选一道要拆掉的墙', breakNone: '这一局的破墙机会已经用掉了', hintWait: '等对手下',
    },
    tips: {
      over: '游戏结束！', overWin: '游戏结束！{names}获胜！', thinking: '{who} 思考中…',
      placing: '{who} · 放棋子', moving: '{who} · 移动棋子',
      breakLeft: '还有一次破墙机会', breakNone: '没有破墙机会',
    },
    champion: {
      draw: '平局', win: '{names}获胜',
      matchOver: '对局结束', winner: '胜方', feedback: '提点意见',
      seeBoard: '看看棋盘', playAgain: '再来一局', squares: '格', seeResult: '看结果',
    },
    contact: {
      button: '联系我们', heading: '联系我们', kicker: '给开发者的话',
      ratingLabel: '玩起来感觉如何（选填）', placeholder: '想说什么都行：哪里不对劲、想要什么功能，或者只是打个招呼',
      note: '会一并发送你的设备信息（浏览器、屏幕尺寸），方便复现问题。',
      sentBody: '每一条都会看。留了联系方式的话，会回复你。',
    },
    feedback: {
      bad: '很卡', ok: '还行', good: '很好玩', sent: '收到了，谢谢',
      heading: '这局玩得怎么样？', kicker: '给开发者的话', sending: '发送中…', submit: '发送',
      ratingLabel: '这局的感觉', placeholder: '比如：三人局有人不能动的时候画面卡住了',
      contactPlaceholder: '邮箱或任何能找到你的方式', later: '先不了',
      sentBody: '这局的棋谱也一起发过来了，能看到你当时的盘面，不用再描述一遍。',
      messageLabel: '哪里不对劲？或者想说什么都行',
      contactLabel: '想收到回复的话，留个联系方式（选填）',
      note: '发送时会附上这局的棋谱和设备信息，这样才能复现你遇到的情况。',
      failed: '发送失败，可能是网络断了。再点一次发送试试。',
    },
    share: {
      shareTitle: '墙壁围棋 Wall Go', shareText: '我开了个房间，点链接直接加入对局！',
      heading: '邀请朋友加入', kicker: '联机对战', copied: '已复制', copyAria: '复制链接',
      copy: '复制', waiting: '等待中', body: '把链接发给朋友，对方点开就会直接进入这个房间。',
      share: '分享链接',
    },
    waiting: { kicker: '联机对战', heading: '等朋友进来', invite: '邀请朋友加入' },
    breakWall: {
      heading: '要拆掉这道墙吗', kicker: '每人只有一次', cancel: '取消', confirm: '破墙',
      body: '拆掉后这枚棋子可以继续移动，但你的破墙机会就用完了，这一局不会再有第二次。',
    },
    leave: {
      heading: '要离开这一局吗', kicker: '还没下完', body: '离开之后，这一局不会保留。',
      bodyOnline: '你离开之后，对手会停在这一局等你。', cancel: '继续下', confirm: '离开',
    },
    surrender: {
      label: '认输', heading: '确定要认输吗', kicker: '认输就算输',
      cancel: '继续下', confirm: '认输',
      body: '这一局到此结束，判你输。',
      bodyThree: '这一局到此结束，判你输。另外两位按目前的地盘决定胜负。',
    },
    status: { claimed: '已占领' },
    play: {
      noRoom: '对局不存在', roomFull: '房间已满，无法加入', playerName: '玩家 {id}',
      connectFail: '连不上房间',
      noRoomBody: '这个房间不存在，可能是链接少了几个字。请对方再发一次完整的链接，或者回首页新开一个房间。',
      roomFullBody: '这一局的座位都坐满了。回首页新开一个房间，再把链接发给朋友。',
      connectFailBody: '可能是网络不稳定。刷新再试一次，已经下过的每一步都保存在房间里。',
      reload: '刷新', home: '返回首页', howToPlay: '玩法说明',
      unfinished: '未结束', connecting: '正在连接…', backHome: '返回首页',
      badLink: '这个链接没有指向任何对局', gameStart: '游戏开始',
      badLinkBody: '邀请链接可能被截断了。请对方再发一次完整的链接，或者回首页新开一个房间。',
    },
  },
  th: {
    players: { A: 'ฝ่ายแดง', B: 'ฝ่ายน้ำเงิน', C: 'ฝ่ายเขียว', and: ' และ ' },
    board: {
      label: 'กระดาน', cell: 'แถว {row} คอลัมน์ {col}', piece: 'หมากของ{player}',
      territory: 'พื้นที่ของ{player}', empty: 'ช่องว่าง', canMove: 'เดินมาที่นี่ได้', canPlace: 'วางหมากได้',
      wallBelow: 'มีกำแพงด้านล่าง', wallRight: 'มีกำแพงด้านขวา',
      breakBelow: 'ทำลายกำแพงด้านล่าง', breakRight: 'ทำลายกำแพงด้านขวา',
      buildTop: 'สร้างกำแพงด้านบน', buildBottom: 'สร้างกำแพงด้านล่าง',
      buildLeft: 'สร้างกำแพงด้านซ้าย', buildRight: 'สร้างกำแพงด้านขวา',
    },
    pad: {
      heading: 'ทิศทางกำแพง', top: 'ด้านบน', bottom: 'ด้านล่าง', left: 'ด้านซ้าย', right: 'ด้านขวา',
      pick: 'เลือกทิศที่จะสร้างกำแพง', pending: 'จะสร้างกำแพง{side}', choose: 'เลือก{side}', confirm: 'ยืนยันการสร้างกำแพง',
      step1: '① เดิน', step2: '② สร้างกำแพง', stepPlace: 'วางหมาก', remain: 'เดินได้อีก {n} ช่อง', noMove: 'ไม่เดินก็ได้',
      done: 'จบตานี้', pickPiece: 'เลือกหมาก', switchPiece: 'เปลี่ยนเป็นหมากตัวถัดไป', redo: 'เริ่มตานี้ใหม่',
      moveUp: 'เดินขึ้น', moveDown: 'เดินลง', moveLeft: 'เดินไปทางซ้าย', moveRight: 'เดินไปทางขวา',
      wallUp: 'สร้างกำแพงด้านบน', wallDown: 'สร้างกำแพงด้านล่าง', wallLeft: 'สร้างกำแพงด้านซ้าย', wallRight: 'สร้างกำแพงด้านขวา',
      hintMove: 'เดินหมากก่อน (หรือไม่เดินก็ได้)', hintWall: 'แล้วเลือกกำแพงหนึ่งด้าน', hintReady: 'กด ✓ เพื่อจบตานี้',
      breakWall: 'ทำลายกำแพง', breakUp: 'ทำลายกำแพงด้านบน', breakDown: 'ทำลายกำแพงด้านล่าง', breakLeft: 'ทำลายกำแพงด้านซ้าย', breakRight: 'ทำลายกำแพงด้านขวา',
      breakPick: 'เลือกกำแพงที่จะทำลาย', breakNone: 'ใช้สิทธิ์ทำลายกำแพงของเกมนี้ไปแล้ว', hintWait: 'รออีกฝ่ายเดิน',
    },
    tips: {
      over: 'จบเกม!', overWin: 'จบเกม! {names}ชนะ!', thinking: '{who} กำลังคิด…',
      placing: '{who} · วางหมาก', moving: '{who} · เดินหมาก',
      breakLeft: 'ยังทำลายกำแพงได้อีก 1 ครั้ง', breakNone: 'ไม่มีสิทธิ์ทำลายกำแพงแล้ว',
    },
    champion: {
      draw: 'เสมอ', win: '{names}ชนะ',
      matchOver: 'จบเกม', winner: 'ผู้ชนะ', feedback: 'ส่งความเห็น',
      seeBoard: 'ดูกระดาน', playAgain: 'เล่นอีกรอบ', squares: 'ช่อง', seeResult: 'ดูผล',
    },
    contact: {
      button: 'ติดต่อเรา', heading: 'ติดต่อเรา', kicker: 'ถึงผู้พัฒนา',
      ratingLabel: 'รู้สึกอย่างไรตอนเล่น (ไม่บังคับ)', placeholder: 'พูดอะไรก็ได้ เช่น ตรงไหนแปลก ๆ อยากได้ฟีเจอร์อะไร หรือแค่ทักทาย',
      note: 'ข้อมูลอุปกรณ์ของคุณ (เบราว์เซอร์ ขนาดหน้าจอ) จะถูกส่งไปด้วย เพื่อให้เราตรวจสอบปัญหาได้',
      sentBody: 'เราอ่านทุกข้อความ ถ้าฝากช่องทางติดต่อไว้ เราจะตอบกลับ',
    },
    feedback: {
      bad: 'แย่', ok: 'พอใช้', good: 'สนุกมาก', sent: 'ได้รับแล้ว ขอบคุณ',
      heading: 'เกมนี้เป็นอย่างไรบ้าง', kicker: 'ถึงผู้พัฒนา', sending: 'กำลังส่ง…', submit: 'ส่ง',
      ratingLabel: 'ความรู้สึกต่อเกมนี้', placeholder: 'เช่น ในเกม 3 คน หน้าจอค้างตอนที่มีคนเดินไม่ได้',
      contactPlaceholder: 'อีเมล หรือช่องทางไหนก็ได้ที่ติดต่อคุณได้', later: 'ไว้ก่อน',
      sentBody: 'บันทึกเกมนี้ถูกส่งมาด้วย เราจึงเห็นกระดานตอนนั้นได้ ไม่ต้องอธิบายซ้ำ',
      messageLabel: 'ตรงไหนแปลก ๆ หรืออยากบอกอะไรก็ได้',
      contactLabel: 'ถ้าอยากได้คำตอบ ฝากช่องทางติดต่อไว้ (ไม่บังคับ)',
      note: 'เมื่อกดส่ง จะแนบบันทึกเกมนี้และข้อมูลอุปกรณ์ไปด้วย เพื่อให้เราตรวจสอบปัญหาที่คุณเจอได้',
      failed: 'ส่งไม่สำเร็จ อาจเป็นเพราะอินเทอร์เน็ตหลุด ลองกดส่งอีกครั้ง',
    },
    share: {
      shareTitle: 'Wall Go', shareText: 'สร้างห้องไว้แล้ว กดลิงก์เพื่อเข้าร่วมเกมได้เลย!',
      heading: 'ชวนเพื่อนมาเล่น', kicker: 'เล่นออนไลน์', copied: 'คัดลอกแล้ว', copyAria: 'คัดลอกลิงก์',
      copy: 'คัดลอก', waiting: 'กำลังรอ', body: 'ส่งลิงก์ให้เพื่อน เพื่อนกดเปิดแล้วจะเข้าห้องนี้ได้ทันที',
      share: 'แชร์ลิงก์',
    },
    waiting: { kicker: 'เล่นออนไลน์', heading: 'รอเพื่อนเข้าห้อง', invite: 'ชวนเพื่อนมาเล่น' },
    breakWall: {
      heading: 'จะทำลายกำแพงนี้ไหม', kicker: 'ทำได้คนละครั้งเดียว', cancel: 'ยกเลิก', confirm: 'ทำลายกำแพง',
      body: 'เมื่อทำลายแล้ว หมากตัวนี้จะเดินต่อได้ แต่สิทธิ์ทำลายกำแพงของคุณจะหมดไป และจะไม่มีครั้งที่สองในเกมนี้',
    },
    leave: {
      heading: 'จะออกจากเกมนี้ไหม', kicker: 'ยังเล่นไม่จบ', body: 'ถ้าออกตอนนี้ เกมนี้จะไม่ถูกเก็บไว้',
      bodyOnline: 'ถ้าคุณออก อีกฝ่ายจะต้องรออยู่ในเกมนี้', cancel: 'เล่นต่อ', confirm: 'ออก',
    },
    surrender: {
      label: 'ยอมแพ้', heading: 'ยอมแพ้จริงไหม', kicker: 'ยอมแพ้ถือว่าแพ้',
      cancel: 'เล่นต่อ', confirm: 'ยอมแพ้',
      body: 'เกมนี้จบลงที่นี่ และคุณเป็นฝ่ายแพ้',
      bodyThree: 'เกมนี้จบลงที่นี่ และคุณเป็นฝ่ายแพ้ ส่วนอีกสองคนจะตัดสินแพ้ชนะจากพื้นที่ที่มีอยู่ตอนนี้',
    },
    status: { claimed: 'พื้นที่' },
    play: {
      noRoom: 'ไม่พบเกมนี้', roomFull: 'ห้องเต็มแล้ว เข้าร่วมไม่ได้', playerName: 'ผู้เล่น {id}',
      connectFail: 'เชื่อมต่อห้องไม่ได้',
      noRoomBody: 'ไม่มีห้องนี้อยู่ ลิงก์อาจขาดไปบางส่วน ขอลิงก์ฉบับเต็มจากอีกฝ่ายอีกครั้ง หรือกลับหน้าแรกเพื่อสร้างห้องใหม่',
      roomFullBody: 'ที่นั่งในเกมนี้เต็มแล้ว กลับหน้าแรกเพื่อสร้างห้องใหม่ แล้วส่งลิงก์ให้เพื่อน',
      connectFailBody: 'อินเทอร์เน็ตอาจไม่เสถียร ลองรีเฟรชอีกครั้ง ทุกตาที่เล่นไปแล้วถูกบันทึกไว้ในห้อง',
      reload: 'รีเฟรช', home: 'กลับหน้าแรก', howToPlay: 'วิธีเล่น',
      unfinished: 'ยังไม่จบ', connecting: 'กำลังเชื่อมต่อ…', backHome: 'กลับหน้าแรก',
      badLink: 'ลิงก์นี้ไม่ได้ชี้ไปยังเกมใด', gameStart: 'เริ่มเกม',
      badLinkBody: 'ลิงก์เชิญอาจถูกตัด ขอลิงก์ฉบับเต็มจากอีกฝ่ายอีกครั้ง หรือกลับหน้าแรกเพื่อสร้างห้องใหม่',
    },
  },
};
