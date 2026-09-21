import type { Messages } from './zh-TW';

/** 用詞照 app/i18n/glossary.md：Wall Go（不寫 WallGo / Wall-Go）、territory、wall。 */
const en: Messages = {
  meta: {
    titleDefault: "Wall Go — Play Free Online | The Devil's Plan: Death Room",
    titleTemplate: '%s | Wall Go',
    description:
      "Play Wall Go free in your browser — the territory game from Netflix's Korean reality series The Devil's Plan: Death Room. Move a piece and build a wall on a 7×7 board; the largest territory wins. 2–3 players, solo against the computer, or online with a friend. No download, no sign-up.",
    keywords: ['Wall Go', "The Devil's Plan", 'Death Room', 'wall go online', 'go variant', 'territory game', 'online board game'],
    ogTitle: 'Wall Go — Play Free Online',
    ogDescription:
      "The territory game from The Devil's Plan: Death Room. A 7×7 board, walls instead of stones, largest territory wins. No download, no sign-up.",
    ogAlt: 'Wall Go — red and blue enclosing their own territory with walls on a 7×7 board',
    showName: "The Devil's Plan: Death Room",
  },
  home: {
    titleLine1: 'Wall Go',
    titleLine2: '牆壁圍棋',
    tagline: 'Enclose the most ground · 2–3 players',
    localKicker: 'Local',
    onlineKicker: 'Online',
    twoPlayers: '2 players',
    threePlayers: '3 players',
    solo: 'Play solo',
    rules: 'How to play',
  },
  rules: {
    kicker: 'How to play',
    heading: 'Wall Go rules',
    intro:
      "Wall Go comes from Netflix's The Devil's Plan: Death Room. The rules fit in three words: move, build, enclose. But every wall you build helps your opponent as much as you, which is where the depth comes from. Here is the whole game, one step and one diagram at a time.",
    metaTitle: 'Rules',
    metaDescription:
      "Complete Wall Go rules: opening placement, moving 0 to 2 squares and then building a wall each turn, scoring enclosed territory, the 3-player wall break, and how the game ends. From Netflix's The Devil's Plan: Death Room.",
    ogTitle: 'How to play Wall Go',
    ogDescription: 'One step, one diagram: placement, movement, walls, territory and scoring.',
    faqHeading: 'Common questions',
    ctaPlay: 'Start playing',
    ctaSolo: 'Play solo',
  },
  solo: {
    metaTitle: 'Solo play',
    metaDescription:
      'Play Wall Go on your own. Three computer levels, and it plays properly — it works out which squares each side reaches first rather than moving at random. No download, no sign-up.',
    ogTitle: 'Wall Go — solo play',
    ogDescription: 'Play on your own against three levels of computer opponent. No download, no sign-up.',
    pickLevel: 'Pick a level',
    level1: 'Level 1',
    level2: 'Level 2',
    level3: 'Level 3',
    srHeading: 'Solo play | Wall Go',
  },
  local: { metaTitle: 'Local play', srHeading: 'Local play | Wall Go' },
  online: { metaTitle: 'Online play', srHeading: 'Online play | Wall Go' },
  replay: { metaTitle: 'Replay', metaDescription: 'Step through a whole game of Wall Go, one move at a time.', srHeading: 'Replay | Wall Go', empty: 'This link has no game record', emptyBody: 'A replay link needs the game record attached. Ask for the full link again.', turn: 'Move {n} of {total}', first: 'Back to the start', prev: 'Previous move', play: 'Play', pause: 'Pause', next: 'Next move', last: 'Jump to the end' },
  ui: { next: 'Next', prev: 'Back', startGame: 'Start playing', close: 'Close', pickLevel: 'Pick a level' },
  notFound: { title: 'Page not found', body: 'That address may have a typo in it, or the game it pointed to has already finished.', home: 'Go home', rules: 'How to play' },
  crumb: { home: 'Home' },
  nav: { language: 'Language', backHome: 'Back to home' },
  credits: { prefix: 'Icons from', middle: '(CC BY 3.0) and', suffix: '(ISC)' },
};

export default en;
