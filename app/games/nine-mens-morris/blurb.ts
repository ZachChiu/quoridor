import type { TextTable } from '@/i18n/gameText';

/**
 * 平台首頁大卡片上的介紹（2026-10-25 Zach：「遊戲平台他們的描述補一下，上面大圖會用到」）。
 * meta：出自哪一季．幾人．免下載（同 Wall Go、尼泊爾虎棋的 heroMeta）；body：兩三句講怎麼玩，最後一句講可以怎麼玩。
 * 放在自己的資料夾、不進 messages/：各款分支只改自己這份，合併不會撞（寫法照 i18n/gameText.ts：兩格縮排、語系依序）。
 * 平台這條分支上這款還不能玩、大卡片不會放它；這份先寫好，那款的分支打開 catalog 那一行時就有字可以放。
 */
export const BLURB = {
  'zh-TW': {
    meta: '第 1 季決賽．2 人．免下載',
    body: '雙方各 9 顆子，輪流放上棋盤、再沿線移動。三顆連成一線，就拿掉對方一顆；對方只剩 2 顆就贏了。可以跟電腦下、兩人同一台玩，或傳連結給朋友。',
  },
  en: {
    meta: 'Season 1 final · 2 players · No download',
    body: 'Nine pieces each: place them on the board, then slide them along the lines. Line up three to take one of your opponent\'s pieces; leave them with two and you win. Play the computer, share one device, or send a link to a friend.',
  },
  ja: {
    meta: 'シーズン1決勝・2人・インストール不要',
    body: '9個ずつの駒を盤に置き、線に沿って動かします。3つ並べたら相手の駒を1つ取り、相手を残り2個にすれば勝ち。コンピューターと対戦するか、1台で2人で、またはリンクを友だちに送って遊べます。',
  },
  ko: {
    meta: '시즌1 결승 · 2인 · 설치 없음',
    body: '각자 말 9개를 판에 놓은 뒤 선을 따라 움직입니다. 한 줄에 3개를 맞추면 상대 말 하나를 가져오고, 상대를 2개로 만들면 승리. 컴퓨터와 두거나, 한 기기로 둘이서, 또는 친구에게 링크를 보내세요.',
  },
  'zh-Hans': {
    meta: '第 1 季决赛·2 人·免下载',
    body: '双方各 9 枚棋子，轮流放上棋盘、再沿线移动。三枚连成一线，就拿掉对方一枚；对方只剩 2 枚就赢了。可以跟电脑下、两人同一台玩，或把链接发给朋友。',
  },
  th: {
    meta: 'ซีซัน 1 รอบชิงชนะเลิศ · 2 คน · ไม่ต้องดาวน์โหลด',
    body: 'แต่ละฝ่ายมีหมาก 9 ตัว วางลงบนกระดานแล้วเดินไปตามเส้น เรียงได้สามตัวในแนวเดียวกันก็หยิบหมากของอีกฝ่ายออกหนึ่งตัว เหลือให้อีกฝ่ายแค่ 2 ตัวก็ชนะ เล่นกับคอมพิวเตอร์ เล่นสองคนในเครื่องเดียว หรือส่งลิงก์ให้เพื่อน',
  },
} satisfies TextTable<{ meta: string; body: string }>;
