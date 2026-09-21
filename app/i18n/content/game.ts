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
  };
  tips: {
    over: string; overWin: string; thinking: string; placing: string; moving: string;
    breakLeft: string; breakNone: string;
  };
  champion: {
    draw: string; win: string; drawBody: string; congrats: string; tied: string;
    took: string; matchOver: string; winner: string; feedback: string;
    seeBoard: string; playAgain: string; squares: string;
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
  status: { claimed: string };
  play: {
    noRoom: string; roomFull: string; playerName: string; connectFail: string;
    home: string; howToPlay: string; unfinished: string; connecting: string; backHome: string;
    badLink: string; badLinkBody: string;
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
    },
    tips: {
      over: '遊戲結束！', overWin: '遊戲結束！{names}勝利！', thinking: '{who} 思考中…',
      placing: '{who} · 放置棋子', moving: '{who} · 移動棋子',
      breakLeft: '還有一次破牆機會', breakNone: '沒有破牆機會',
    },
    champion: {
      draw: '平局', win: '{names}勝利', drawBody: '大家佔領的地盤一樣多，這局不分高下。',
      congrats: '恭喜{names}{suffix}', tied: '並列第一', took: '拿下這局',
      matchOver: '對局結束', winner: '勝方', feedback: '給點意見',
      seeBoard: '看看棋盤', playAgain: '再來一局', squares: '格',
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
    status: { claimed: '已佔領' },
    play: {
      noRoom: '不存在的對局', roomFull: '房間已滿，無法加入', playerName: '玩家 {id}',
      connectFail: '連線失敗，請重新整理後再試', home: '回首頁', howToPlay: '遊玩方式',
      unfinished: '未結束', connecting: '正在連線…', backHome: '返回首頁',
      badLink: '這個連結沒有指向任何對局',
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
    },
    tips: {
      over: 'Game over', overWin: 'Game over — {names} wins!', thinking: '{who} is thinking…',
      placing: '{who} · place a piece', moving: '{who} · move a piece',
      breakLeft: 'One wall break left', breakNone: 'No wall break left',
    },
    champion: {
      draw: 'Draw', win: '{names} wins', drawBody: 'Everyone holds the same amount of ground — nothing separates you this game.',
      congrats: 'Congratulations {names} — {suffix}', tied: 'tied for first', took: 'you took this one',
      matchOver: 'Match over', winner: 'Winner', feedback: 'Send feedback',
      seeBoard: 'Look at the board', playAgain: 'Play again', squares: 'squares',
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
    status: { claimed: 'Territory' },
    play: {
      noRoom: 'No such game', roomFull: 'This room is full', playerName: 'Player {id}',
      connectFail: 'Could not connect — refresh and try again', home: 'Home', howToPlay: 'How to play',
      unfinished: 'unfinished', connecting: 'Connecting…', backHome: 'Back to home',
      badLink: 'This link does not point to a game',
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
    },
    tips: {
      over: 'ゲーム終了', overWin: 'ゲーム終了 —— {names}の勝ち！', thinking: '{who} が考えています…',
      placing: '{who} · 駒を置く', moving: '{who} · 駒を動かす',
      breakLeft: '壁を壊せる回数：あと1回', breakNone: '壁を壊せる回数：なし',
    },
    champion: {
      draw: '引き分け', win: '{names}の勝ち', drawBody: '陣地の広さが同じでした。今回は差がつきませんでした。',
      congrats: 'おめでとう、{names}{suffix}', tied: '同率1位', took: 'この一局を取りました',
      matchOver: '対局終了', winner: '勝者', feedback: '意見を送る',
      seeBoard: '盤面を見る', playAgain: 'もう一局', squares: 'マス',
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
    status: { claimed: '陣地' },
    play: {
      noRoom: 'その対局は存在しません', roomFull: 'この部屋は満員です', playerName: 'プレイヤー {id}',
      connectFail: '接続できませんでした。再読み込みしてお試しください', home: 'ホーム', howToPlay: '遊び方',
      unfinished: '未完了', connecting: '接続中…', backHome: 'ホームに戻る',
      badLink: 'このリンクはどの対局も指していません',
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
    },
    tips: {
      over: '게임 종료', overWin: '게임 종료 —— {names} 승리!', thinking: '{who} 생각 중…',
      placing: '{who} · 말 놓기', moving: '{who} · 말 이동',
      breakLeft: '벽 부수기 1회 남음', breakNone: '벽 부수기 없음',
    },
    champion: {
      draw: '무승부', win: '{names} 승리', drawBody: '차지한 영역이 같습니다. 이번 판은 우열을 가리지 못했습니다.',
      congrats: '축하합니다, {names}{suffix}', tied: '공동 1위', took: '이번 판을 가져갔습니다',
      matchOver: '대국 종료', winner: '승자', feedback: '의견 보내기',
      seeBoard: '판 보기', playAgain: '다시 한 판', squares: '칸',
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
    status: { claimed: '영역' },
    play: {
      noRoom: '존재하지 않는 대국입니다', roomFull: '방이 가득 찼습니다', playerName: '플레이어 {id}',
      connectFail: '연결하지 못했습니다. 새로고침 후 다시 시도해 주세요', home: '홈', howToPlay: '플레이 방법',
      unfinished: '미완료', connecting: '연결 중…', backHome: '홈으로',
      badLink: '이 링크는 어떤 대국도 가리키지 않습니다',
      badLinkBody: '초대 링크가 중간에 잘렸을 수 있습니다. 전체 링크를 다시 받거나, 홈에서 새 방을 만들어 주세요.',
    },
  },
};
