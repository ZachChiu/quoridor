// 由 scripts/build-name-lettering.mjs 產生（npm run name:build -- hexagon），不要手改；各語系挑的字在 scripts/name-lettering/hexagon.mjs。
import type { NameLettering } from '@/types/lettering';

export const NAME_LETTERING: NameLettering = {
  'zh-TW': { text: '六角數字盤', h: 0.986, gap: 0.04, lead: 0.114, fit: 5.17, pieces: [{ src: '/games/hexagon/name/zh-TW-0.svg', w: 5.16 }] },
};
