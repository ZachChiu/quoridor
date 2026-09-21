import type { Messages } from './zh-TW';

/** 用詞照 app/i18n/glossary.md：ウォールゴー、壁、陣地、駒。 */
const ja: Messages = {
  meta: {
    titleDefault: 'ウォールゴー Wall Go 無料オンライン | デビルズプラン：デスルーム',
    titleTemplate: '%s | ウォールゴー Wall Go',
    description:
      'Netflixの韓国リアリティ番組『デビルズプラン：デスルーム』に登場したウォールゴーを、ブラウザで無料プレイ。7路盤で駒を動かし、壁を作って陣地を囲む。いちばん広い人の勝ち。2〜3人対戦、CPU戦、オンライン対戦に対応。ダウンロードも登録も不要です。',
    keywords: ['ウォールゴー', 'Wall Go', 'デビルズプラン', 'デスルーム', '囲碁 派生', '陣取りゲーム', 'オンラインボードゲーム'],
    ogTitle: 'ウォールゴー Wall Go 無料オンライン',
    ogDescription:
      '『デビルズプラン：デスルーム』のウォールゴー。7路盤、石ではなく壁で囲む陣取り。ダウンロードも登録も不要。',
    ogAlt: 'ウォールゴー Wall Go —— 7路盤で赤と青が壁で自分の陣地を囲んでいる様子',
    showName: 'デビルズプラン：デスルーム',
  },
  home: {
    titleLine1: 'ウォールゴー',
    titleLine2: 'Wall Go',
    tagline: 'いちばん広い陣地を囲む · 2〜3人対戦',
    localKicker: 'ローカル',
    onlineKicker: 'オンライン',
    twoPlayers: '2人',
    threePlayers: '3人',
    solo: 'ひとりで遊ぶ',
    rules: '遊び方',
  },
  rules: {
    kicker: '遊び方',
    heading: 'ウォールゴー Wall Go のルール',
    intro:
      'ウォールゴーは Netflix『デビルズプラン：デスルーム』に登場した、囲碁の派生ゲームです。7路盤で2〜3人で遊びます。\n1ターンでやることは2つ。駒を1つ動かして、壁を1枚作る。以下、一手ずつ図で説明します。',
    metaTitle: 'ルール',
    metaDescription:
      'ウォールゴー（Wall Go）の完全ルール：配置、毎ターン0〜2マス動いてから壁を1枚作る、囲まれた領域の陣地計算、3人戦の壁破壊、勝敗の決まり方。Netflix『デビルズプラン：デスルーム』より。',
    ogTitle: 'ウォールゴー Wall Go の遊び方',
    ogDescription: '一手ずつ図でわかる：配置、移動、壁、陣地、得点。',
    faqHeading: 'よくある質問',
    ctaPlay: 'ゲームを始める',
    ctaSolo: 'ひとりで遊ぶ',
  },
  solo: {
    metaTitle: 'ひとりで遊ぶ',
    metaDescription:
      'ひとりでもウォールゴーが遊べます。CPUは3段階。どのマスにどちらが先に届くかを計算して指すので、ランダムな手は打ちません。ダウンロードも登録も不要。',
    ogTitle: 'ウォールゴー Wall Go ひとりで遊ぶ',
    ogDescription: 'ひとりでも遊べます。CPUは3段階。ダウンロードも登録も不要。',
    pickLevel: 'レベルを選ぶ',
    level1: 'レベル1',
    level2: 'レベル2',
    level3: 'レベル3',
    srHeading: 'ひとりで遊ぶ | ウォールゴー Wall Go',
  },
  local: { metaTitle: 'ローカル対戦', srHeading: 'ローカル対戦 | ウォールゴー Wall Go' },
  online: { metaTitle: 'オンライン対戦', srHeading: 'オンライン対戦 | ウォールゴー Wall Go' },
  replay: { metaTitle: '棋譜再生', metaDescription: '一手ずつ対局を見返せます。前後への移動も自由です。', srHeading: '棋譜再生 | ウォールゴー Wall Go', empty: 'このリンクには棋譜がありません', emptyBody: '再生リンクには棋譜が必要です。完全なリンクをもう一度もらってください。', turn: '{total} 手中 {n} 手目', first: '最初に戻る', prev: '前の手', play: '再生', pause: '一時停止', next: '次の手', last: '最後へ' },
  ui: { next: '次へ', prev: '戻る', startGame: 'ゲームを始める', close: '閉じる', pickLevel: 'レベルを選ぶ' },
  notFound: { title: 'ページが見つかりません', body: 'アドレスが間違っているか、その対局はすでに終わっているかもしれません。', home: 'ホームへ', rules: '遊び方を見る' },
  crumb: { home: 'ホーム' },
  nav: { language: '言語', backHome: 'ホームに戻る' },
  credits: { prefix: 'アイコン提供：', middle: '（CC BY 3.0）と', suffix: '（ISC）' },
};

export default ja;
