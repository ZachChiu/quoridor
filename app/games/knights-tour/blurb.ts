import type { TextTable } from '@/i18n/gameText';

/**
 * 平台首頁大卡片上的介紹（2026-10-25 Zach：「遊戲平台他們的描述補一下，上面大圖會用到」）。
 * meta：出自哪一季．幾人．免下載（同 Wall Go、尼泊爾虎棋的 heroMeta）；body：兩三句講怎麼玩，最後一句講可以怎麼玩。
 * 放在自己的資料夾、不進 messages/：各款分支只改自己這份，合併不會撞（寫法照 i18n/gameText.ts：兩格縮排、語系依序）。
 * 平台這條分支上這款還不能玩、大卡片不會放它；這份先寫好，那款的分支打開 catalog 那一行時就有字可以放。
 */
export const BLURB = {
  'zh-TW': {
    meta: '第 2 季．1 人．免下載',
    body: '騎士走「日」字，要把棋盤上每一格都踩過一次、不能重複。節目挑戰是 6×6、7×7、8×8 連續三關、限時 60 分鐘；也可以從 5×5 慢慢練。',
  },
  en: {
    meta: 'Season 2 · 1 player · No download',
    body: 'Move a chess knight in its L-shape and land on every square of the board exactly once. The show\'s challenge is three boards in a row — 6×6, 7×7, 8×8 — within 60 minutes; or warm up from 5×5 in practice mode.',
  },
  ja: {
    meta: 'シーズン2・1人・インストール不要',
    body: 'チェスのナイトの動きで、盤のすべてのマスを一度ずつ回ります。番組のチャレンジは 6×6・7×7・8×8 の3連続を60分以内に。練習モードなら 5×5 からじっくり。',
  },
  ko: {
    meta: '시즌2 · 1인 · 설치 없음',
    body: '체스 나이트의 움직임으로 판의 모든 칸을 한 번씩만 밟으세요. 방송 챌린지는 6×6, 7×7, 8×8 세 판을 60분 안에 연속으로. 연습 모드에서는 5×5부터 천천히 익힐 수 있습니다.',
  },
  'zh-Hans': {
    meta: '第 2 季·1 人·免下载',
    body: '骑士走“日”字，要把棋盘上每一格都踩过一次、不能重复。节目挑战是 6×6、7×7、8×8 连续三关、限时 60 分钟；也可以从 5×5 慢慢练。',
  },
  th: {
    meta: 'ซีซัน 2 · 1 คน · ไม่ต้องดาวน์โหลด',
    body: 'เดินม้าหมากรุกเป็นรูปตัว L ให้เหยียบทุกช่องบนกระดานช่องละครั้งเดียว ชาเลนจ์ในรายการคือ 6×6, 7×7, 8×8 ต่อกันสามด่านภายใน 60 นาที หรือเริ่มฝึกจาก 5×5 ก่อนก็ได้',
  },
} satisfies TextTable<{ meta: string; body: string }>;
