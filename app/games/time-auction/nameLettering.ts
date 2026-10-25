// 由 scripts/build-name-lettering.mjs 產生（npm run name:build -- time-auction），不要手改；各語系挑的字在 scripts/name-lettering/time-auction.mjs。
import type { NameLettering } from '@/types/lettering';

export const NAME_LETTERING: NameLettering = {
  'zh-TW': { text: '時間拍賣', h: 0.991, gap: 0.04, lead: 0.109, pieces: [{ src: '/games/time-auction/name/zh-TW-0.svg', w: 4.12 }] },
  'zh-Hans': { text: '时间拍卖', h: 0.997, gap: 0.04, lead: 0.103, pieces: [{ src: '/games/time-auction/name/zh-Hans-0.svg', w: 4.12 }] },
  ja: { text: 'タイムオークション', h: 0.919, gap: 0.04, lead: 0.181, pieces: [{ src: '/games/time-auction/name/ja-0.svg', w: 3.06 }, { src: '/games/time-auction/name/ja-1.svg', w: 6.18 }] },
  ko: { text: '시간 경매', h: 1.011, gap: 0.327, lead: 0.089, pieces: [{ src: '/games/time-auction/name/ko-0.svg', w: 1.994, mr: -0.022 }, { src: '/games/time-auction/name/ko-1.svg', w: 1.972 }] },
  th: { text: 'ประมูลเวลา', h: 1.105, gap: 0.04, lead: 0.08, pieces: [{ src: '/games/time-auction/name/th-0.svg', w: 5.495 }] },
};
