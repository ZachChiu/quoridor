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
  players: { A: string; B: string; C: string };
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
    done: string; redo: string;
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
  status: { claimed: string };
  play: {
    noRoom: string; roomFull: string; playerName: string; connectFail: string;
    home: string; howToPlay: string; unfinished: string; connecting: string; backHome: string;
    badLink: string; badLinkBody: string; gameStart: string;
  };
};

/** 把 `{name}` 換成實際值。語序交給翻譯決定，不由程式相接。 */
export const fmt = (s: string, vars: Record<string, string | number>): string =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));

export const GAME_TEXT: Record<Locale, GameText> = {
  'zh-TW': {
    players: { A: '紅方', B: '藍方', C: '黃方' },
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
    step1: '① 移動', step2: '② 築牆', stepPlace: '放棋子', remain: '還可走 {n} 格', noMove: '不移動也可以', done: '完成這一步', redo: '重來這一步', moveUp: '往上移動', moveDown: '往下移動', moveLeft: '往左移動', moveRight: '往右移動', wallUp: '在上方築牆', wallDown: '在下方築牆', wallLeft: '在左方築牆', wallRight: '在右方築牆', hintMove: '先移動棋子（或不動）', hintWall: '再選一道牆', hintReady: '按 ✓ 完成這一步',
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
    surrender: {
      label: '投降', heading: '確定要投降嗎', kicker: '投降就算輸',
      cancel: '繼續下', confirm: '投降',
      body: '這一局到此結束，你判負。',
      bodyThree: '這一局到此結束，你判負。另外兩位照目前的地盤決定勝負。',
    },
    status: { claimed: '已佔領' },
    play: {
      noRoom: '不存在的對局', roomFull: '房間已滿，無法加入', playerName: '玩家 {id}',
      connectFail: '連線失敗，請重新整理後再試', home: '回首頁', howToPlay: '遊玩方式',
      unfinished: '未結束', connecting: '正在連線…', backHome: '返回首頁',
      badLink: '這個連結沒有指向任何對局', gameStart: '遊戲開始',
      badLinkBody: '邀請連結可能被截斷了。跟對方要一次完整的連結，或回首頁開一間新的。',
    },
  },
  en: {
    players: { A: 'Red', B: 'Blue', C: 'Yellow' },
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
    step1: '1 Move', step2: '2 Wall', stepPlace: 'Place a piece', remain: '{n} squares left', noMove: 'staying put is fine', done: 'Finish this turn', redo: 'Start this turn over', moveUp: 'Move up', moveDown: 'Move down', moveLeft: 'Move left', moveRight: 'Move right', wallUp: 'Build a wall above', wallDown: 'Build a wall below', wallLeft: 'Build a wall to the left', wallRight: 'Build a wall to the right', hintMove: 'Move your piece (or stay put)', hintWall: 'Now pick a wall', hintReady: 'Press ✓ to finish',
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
    surrender: {
      label: 'Resign', heading: 'Resign this game?', kicker: 'Resigning is a loss',
      cancel: 'Keep playing', confirm: 'Resign',
      body: 'The game ends here and you lose.',
      bodyThree: 'The game ends here and you lose. The other two are ranked by the territory they hold right now.',
    },
    status: { claimed: 'Territory' },
    play: {
      noRoom: 'No such game', roomFull: 'This room is full', playerName: 'Player {id}',
      connectFail: 'Could not connect — refresh and try again', home: 'Home', howToPlay: 'How to play',
      unfinished: 'unfinished', connecting: 'Connecting…', backHome: 'Back to home',
      badLink: 'This link does not point to a game', gameStart: 'Game start',
      badLinkBody: 'The invite link may have been cut short. Ask for the full link again, or go home and open a new room.',
    },
  },
  ja: {
    players: { A: '赤', B: '青', C: '黄' },
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
    step1: '① 移動', step2: '② 壁', stepPlace: '駒を置く', remain: 'あと {n} マス', noMove: '動かさなくてもよい', done: 'この手を確定', redo: 'この手をやり直す', moveUp: '上へ移動', moveDown: '下へ移動', moveLeft: '左へ移動', moveRight: '右へ移動', wallUp: '上に壁を作る', wallDown: '下に壁を作る', wallLeft: '左に壁を作る', wallRight: '右に壁を作る', hintMove: 'まず駒を動かす（動かさなくてもよい）', hintWall: '次に壁を選ぶ', hintReady: '✓ で確定',
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
      shareTitle: 'ウォールゴー Wall Go', shareText: '部屋を作りました。リンクからそのまま参加できます！',
      heading: '友だちを招待', kicker: 'オンライン対戦', copied: 'コピーしました', copyAria: 'リンクをコピー',
      copy: 'コピー', waiting: '待機中', body: 'リンクを友だちに送ると、開いただけでこの部屋に入れます。',
      share: 'リンクを共有',
    },
    waiting: { kicker: 'オンライン対戦', heading: '友だちを待っています', invite: '友だちを招待' },
    breakWall: {
      heading: 'この壁を壊しますか？', kicker: '1ゲームに1回だけ', cancel: 'やめる', confirm: '壊す',
      body: '壊したあともこの駒は動かせますが、壁を壊せる回数は0になります。この一局でもう一度は使えません。',
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
      connectFail: '接続できませんでした。再読み込みしてお試しください', home: 'ホーム', howToPlay: '遊び方',
      unfinished: '未完了', connecting: '接続中…', backHome: 'ホームに戻る',
      badLink: 'このリンクはどの対局も指していません', gameStart: 'ゲームスタート',
      badLinkBody: '招待リンクが途中で切れている可能性があります。完全なリンクをもう一度もらうか、ホームから新しい部屋を作ってください。',
    },
  },
  ko: {
    players: { A: '빨강', B: '파랑', C: '노랑' },
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
    step1: '① 이동', step2: '② 벽', stepPlace: '말 놓기', remain: '{n}칸 남음', noMove: '움직이지 않아도 됩니다', done: '이 수 완료', redo: '이 수 다시', moveUp: '위로 이동', moveDown: '아래로 이동', moveLeft: '왼쪽으로 이동', moveRight: '오른쪽으로 이동', wallUp: '위에 벽 세우기', wallDown: '아래에 벽 세우기', wallLeft: '왼쪽에 벽 세우기', wallRight: '오른쪽에 벽 세우기', hintMove: '먼저 말을 움직이세요 (안 움직여도 됩니다)', hintWall: '이제 벽을 고르세요', hintReady: '✓ 를 누르면 완료',
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
    surrender: {
      label: '기권', heading: '기권할까요?', kicker: '기권하면 패배입니다',
      cancel: '계속 두기', confirm: '기권',
      body: '이번 판은 여기서 끝나고 패배로 처리됩니다.',
      bodyThree: '이번 판은 여기서 끝나고 패배로 처리됩니다. 나머지 두 사람은 현재 영역으로 승부를 가립니다.',
    },
    status: { claimed: '영역' },
    play: {
      noRoom: '존재하지 않는 대국입니다', roomFull: '방이 가득 찼습니다', playerName: '플레이어 {id}',
      connectFail: '연결하지 못했습니다. 새로고침 후 다시 시도해 주세요', home: '홈', howToPlay: '플레이 방법',
      unfinished: '미완료', connecting: '연결 중…', backHome: '홈으로',
      badLink: '이 링크는 어떤 대국도 가리키지 않습니다', gameStart: '게임 시작',
      badLinkBody: '초대 링크가 중간에 잘렸을 수 있습니다. 전체 링크를 다시 받거나, 홈에서 새 방을 만들어 주세요.',
    },
  },
};
