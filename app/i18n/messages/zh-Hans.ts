import type { Messages } from './zh-TW';

/**
 * 简体中文。人工翻译，不是从繁中自动转换（Zach 的决定）——
 * 用词照大陆与新马的习惯改写：链接、刷新、屏幕、网络、人机对战……
 * 不只是换字形。
 *
 * 用词照 app/i18n/glossary.md。节目名跟繁中一样写「死亡密室」这个副标，
 * 维基百科的「魔鬼的计谋2：死亡密室」留在 keywords 里接住那样搜的人。
 */
const zhHans: Messages = {
  meta: {
    titleDefault: '墙壁围棋 Wall Go 在线免费玩 | 魔鬼的计谋：死亡密室',
    titleTemplate: '%s | 墙壁围棋 Wall Go',
    description:
      'Netflix 韩国真人秀《魔鬼的计谋：死亡密室》里的墙壁围棋，在线免费玩。在 7×7 棋盘上移动棋子、筑墙圈地，地盘最大的人获胜。支持 2–3 人对战、人机对战和在线联机，无需下载，无需注册。',
    keywords: ['墙壁围棋', 'Wall Go', '魔鬼的计谋', '魔鬼的计谋2', '死亡密室', '围棋变体', '圈地游戏', '在线桌游'],
    ogTitle: '墙壁围棋 Wall Go 在线免费玩',
    ogDescription:
      '《魔鬼的计谋：死亡密室》里的墙壁围棋。7×7 棋盘，筑墙圈地，地盘最大的人获胜。无需下载，无需注册。',
    ogAlt: '墙壁围棋 Wall Go —— 7×7 棋盘上红蓝双方用墙围出各自的地盘',
    showName: '魔鬼的计谋：死亡密室',
  },
  home: {
    titleLine1: '墙壁围棋',
    titleLine2: 'Wall Go',
    tagline: '围出最大的地盘',
    localKicker: '本地',
    onlineKicker: '联机',
    twoPlayers: '双人',
    threePlayers: '三人',
    solo: '人机对战',
    rules: '游戏规则',
  },
  rules: {
    kicker: '玩法说明',
    heading: '墙壁围棋 Wall Go 规则',
    intro:
      '墙壁围棋出自 Netflix《魔鬼的计谋：死亡密室》，是围棋的变体。7×7 棋盘，两到三人。\n每个回合做两件事：移动一枚棋子，然后筑一道墙。下面一步一图来讲。',
    metaTitle: '游戏规则',
    metaDescription:
      '墙壁围棋（Wall Go）完整规则：开局摆子、每回合走 0 到 2 格后必须筑一道墙、封闭区域怎么算地盘、三人局的破墙机制与胜负判定。出自 Netflix《魔鬼的计谋：死亡密室》。',
    ogTitle: '墙壁围棋 Wall Go 规则说明',
    ogDescription: '一步一图看懂墙壁围棋怎么玩：摆子、移动、筑墙、圈地、计分。',
    faqHeading: '常见问题',
    ctaPlay: '开始游戏',
    version: '版本',
    ctaSolo: '人机对战',
  },
  solo: {
    metaTitle: '人机对战',
    metaDescription:
      '一个人也能玩墙壁围棋。电脑对手分三级，会算出每一格谁先走得到再决定怎么下，不是随便乱走。无需下载，无需注册。',
    ogTitle: '墙壁围棋 Wall Go 人机对战',
    ogDescription: '一个人也能玩。电脑对手分三级，无需下载，无需注册。',
    pickLevel: '选择难度',
    level1: '一级',
    level2: '二级',
    level3: '三级',
    srHeading: '人机对战 | 墙壁围棋 Wall Go',
  },
  local: { metaTitle: '本地对战', srHeading: '本地对战 | 墙壁围棋 Wall Go' },
  online: { metaTitle: '联机对战', srHeading: '联机对战 | 墙壁围棋 Wall Go' },
  replay: { metaTitle: '棋谱回放', metaDescription: '一步一步重看整局墙壁围棋，可以前后跳转。', srHeading: '棋谱回放 | 墙壁围棋 Wall Go', empty: '这个链接里没有棋谱', emptyBody: '回放链接需要带上棋谱。请对方再发一次完整的链接。', turn: '第 {n} / {total} 步', first: '回到开局', prev: '上一步', play: '播放', pause: '暂停', next: '下一步', last: '跳到最后' },

  ui: { next: '下一步', prev: '上一步', startGame: '开始游戏', close: '关闭', pickLevel: '选择难度' },
  error: { title: '出了点问题', body: '页面运行时出错了，刷新一下通常就好。联机对局的每一步都保存在房间里，刷新后可以接着下。', retry: '刷新', home: '返回首页' },
  notFound: { title: '找不到这个页面', body: '网址可能输错了，或者那一局已经结束了。', home: '返回首页', rules: '看看怎么玩' },
  crumb: { home: '首页' },
  nav: { language: '语言', backHome: '返回首页' },
  credits: { prefix: '图标来自', middle: '（CC BY 3.0）和', suffix: '（ISC）' },
};

export default zhHans;
