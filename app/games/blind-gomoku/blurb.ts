import type { TextTable } from '@/i18n/gameText';

/**
 * 平台首頁大卡片上的介紹（2026-10-25 Zach：「遊戲平台他們的描述補一下，上面大圖會用到」）。
 * meta：出自哪一季．幾人．免下載（同 Wall Go、尼泊爾虎棋的 heroMeta）；body：兩三句講怎麼玩，最後一句講可以怎麼玩。
 * 放在自己的資料夾、不進 messages/：各款分支只改自己這份，合併不會撞（寫法照 i18n/gameText.ts：兩格縮排、語系依序）。
 * 平台這條分支上這款還不能玩、大卡片不會放它；這份先寫好，那款的分支打開 catalog 那一行時就有字可以放。
 */
export const BLURB = {
  'zh-TW': {
    meta: '第 1 季．1–2 人．免下載',
    body: '五子棋，但黑白印在棋子底面 —— 盤上只看得到顏色，看不出哪顆是誰的。有人連成五子時全部翻開，才知道誰贏。可以跟電腦下、兩人同一台玩，或傳連結給朋友。',
  },
  en: {
    meta: 'Season 1 · 1–2 players · No download',
    body: 'Gomoku, except black and white are printed underneath — on the board you only see colours, never whose stone is whose. When someone makes five in a row, every stone flips over to reveal the winner. Play the computer, share one device, or send a link to a friend.',
  },
  ja: {
    meta: 'シーズン1・1〜2人・インストール不要',
    body: '五目並べ。ただし黒白は石の底にあって、盤上で見えるのは色だけ。どれが誰の石かは分かりません。5つ並んだ瞬間に全部ひっくり返して勝敗が分かります。コンピューターと対戦するか、1台で2人で、またはリンクを友だちに送って遊べます。',
  },
  ko: {
    meta: '시즌1 · 1~2인 · 설치 없음',
    body: '오목인데 흑백은 돌 밑면에 숨어 있어서, 판 위에서는 색깔만 보이고 누구 돌인지 알 수 없습니다. 다섯 개가 이어지는 순간 모든 돌을 뒤집어 승부를 가립니다. 컴퓨터와 두거나, 한 기기로 둘이서, 또는 친구에게 링크를 보내세요.',
  },
  'zh-Hans': {
    meta: '第 1 季·1–2 人·免下载',
    body: '五子棋，但黑白印在棋子底面 —— 盘上只看得到颜色，看不出哪颗是谁的。有人连成五子时全部翻开，才知道谁赢。可以跟电脑下、两人同一台玩，或把链接发给朋友。',
  },
  th: {
    meta: 'ซีซัน 1 · 1–2 คน · ไม่ต้องดาวน์โหลด',
    body: 'โกโมกุ แต่สีดำขาวซ่อนอยู่ใต้หมาก บนกระดานเห็นแค่สี ไม่รู้ว่าตัวไหนเป็นของใคร เมื่อมีคนเรียงครบห้า หมากทุกตัวจะพลิกเฉลยผู้ชนะ เล่นกับคอมพิวเตอร์ เล่นสองคนในเครื่องเดียว หรือส่งลิงก์ให้เพื่อน',
  },
} satisfies TextTable<{ meta: string; body: string }>;
