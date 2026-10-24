import type { TextTable } from '@/i18n/gameText';

/**
 * 平台首頁大卡片上的介紹（2026-10-25 Zach：「遊戲平台他們的描述補一下，上面大圖會用到」）。
 * meta：出自哪一季．幾人．免下載（同 Wall Go、尼泊爾虎棋的 heroMeta）；body：兩三句講怎麼玩，最後一句講可以怎麼玩。
 * 放在自己的資料夾、不進 messages/：各款分支只改自己這份，合併不會撞（寫法照 i18n/gameText.ts：兩格縮排、語系依序）。
 * 平台這條分支上這款還不能玩、大卡片不會放它；這份先寫好，那款的分支打開 catalog 那一行時就有字可以放。
 */
export const BLURB = {
  'zh-TW': {
    meta: '第 2 季．2–6 人．免下載',
    body: '每人一樣多的時間，拍賣 19 回合：按住按鈕出價，按多久就付多久，最後放手的人得標。誰還按著、別人還剩多少，都看不到。可以跟電腦競買人玩，或開房間找朋友。',
  },
  en: {
    meta: 'Season 2 · 2–6 players · No download',
    body: 'Everyone gets the same bank of time for 19 auctions. Hold the button to bid — you pay for every second you hold, and the last to let go wins the lot. You never see who is still holding or how much time anyone has left. Play against computer bidders, or open a room for friends.',
  },
  ja: {
    meta: 'シーズン2・2〜6人・インストール不要',
    body: '全員同じ持ち時間で19回のオークション。ボタンを押し続けて入札し、押した分だけ時間を払い、最後に離した人が落札。誰がまだ押しているか、残り時間がいくつかは見えません。コンピューター相手に、または部屋を作って友だちと遊べます。',
  },
  ko: {
    meta: '시즌2 · 2~6인 · 설치 없음',
    body: '모두 같은 시간을 들고 19번의 경매를 합니다. 버튼을 누르고 있으면 입찰, 누른 만큼 시간을 내고, 마지막에 손을 뗀 사람이 낙찰. 누가 아직 누르고 있는지, 남은 시간이 얼마인지는 보이지 않습니다. 컴퓨터 입찰자와, 또는 방을 만들어 친구와 함께.',
  },
  'zh-Hans': {
    meta: '第 2 季·2–6 人·免下载',
    body: '每人一样多的时间，拍卖 19 回合：按住按钮出价，按多久就付多久，最后松手的人得标。谁还按着、别人还剩多少，都看不到。可以跟电脑竞买人玩，或开房间找朋友。',
  },
  th: {
    meta: 'ซีซัน 2 · 2–6 คน · ไม่ต้องดาวน์โหลด',
    body: 'ทุกคนมีเวลาเท่ากันสำหรับการประมูล 19 รอบ กดปุ่มค้างไว้เพื่อประมูล กดนานเท่าไรก็จ่ายเวลาเท่านั้น คนที่ปล่อยมือคนสุดท้ายชนะ ไม่มีใครรู้ว่าใครยังกดอยู่หรือเหลือเวลาเท่าไร เล่นกับผู้ประมูลคอมพิวเตอร์ หรือเปิดห้องเล่นกับเพื่อน',
  },
} satisfies TextTable<{ meta: string; body: string }>;
