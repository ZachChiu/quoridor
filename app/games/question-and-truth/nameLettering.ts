// 由 scripts/build-name-lettering.mjs 產生（npm run name:build -- question-and-truth），不要手改；各語系挑的字在 scripts/name-lettering/question-and-truth.mjs。
import type { NameLettering } from '@/types/lettering';

export const NAME_LETTERING: NameLettering = {
  'zh-TW': { text: '提問與真相', h: 0.998, gap: 0.04, lead: 0.102, fit: 5.17, pieces: [{ src: '/games/question-and-truth/name/zh-TW-0.svg', w: 5.16 }] },
  'zh-Hans': { text: '提问与真相', h: 0.998, gap: 0.04, lead: 0.102, fit: 5.17, pieces: [{ src: '/games/question-and-truth/name/zh-Hans-0.svg', w: 5.16 }] },
  ko: { text: '질문과 진실', h: 1.011, gap: 0.327, lead: 0.089, fit: 2.988, pieces: [{ src: '/games/question-and-truth/name/ko-0.svg', w: 3, mr: -0.022 }, { src: '/games/question-and-truth/name/ko-1.svg', w: 1.972 }] },
};
