import type { Messages } from './zh-TW';

/** 用詞照 app/i18n/glossary.md：壁囲碁、壁、陣地、駒。 */
const ja: Messages = {
  meta: {
    titleDefault: '壁囲碁 Wall Go 無料オンライン | 悪魔の計略 ～デビルズ・プラン～',
    titleTemplate: '%s | 壁囲碁 Wall Go',
    description:
      'Netflixの韓国リアリティ番組『悪魔の計略 ～デビルズ・プラン～』シーズン2に登場した壁囲碁を、ブラウザで無料プレイ。7路盤で駒を動かし、壁を作って陣地を囲む。いちばん広い人の勝ち。2〜3人対戦、CPU戦、オンライン対戦に対応。ダウンロードも登録も不要です。',
    keywords: ['壁囲碁', 'Wall Go', '悪魔の計略', 'デビルズ・プラン', 'デビルズプラン シーズン2', 'ウォールゴー', '囲碁 派生', '陣取りゲーム', 'オンラインボードゲーム'],
    ogTitle: '壁囲碁 Wall Go 無料オンライン',
    ogDescription:
      '『悪魔の計略 ～デビルズ・プラン～』の壁囲碁。7路盤、石ではなく壁で囲む陣取り。ダウンロードも登録も不要。',
    ogAlt: '壁囲碁 Wall Go —— 7路盤で赤と青が壁で自分の陣地を囲んでいる様子',
    showName: '悪魔の計略 ～デビルズ・プラン～',
  },
  home: {
    titleLine1: '壁囲碁',
    titleLine2: 'Wall Go',
    tagline: 'いちばん広い陣地を囲む',
    localKicker: 'ローカル',
    onlineKicker: 'オンライン',
    twoPlayers: '2人',
    threePlayers: '3人',
    solo: 'ひとりで遊ぶ',
    rules: '遊び方',
  },
  platform: {
    metaTitle: 'デビルズプラン（悪魔の計略）ゲーム一覧とルール',
    metaDescription: 'Netflix の韓国バラエティ『悪魔の計略 ～デビルズ・プラン～』に登場したゲームをシーズンごとに紹介。シーズン1、シーズン2、そして配信予定のシーズン3。遊べるゲームはブラウザですぐプレイでき、インストールも登録も不要。まずは壁囲碁 Wall Go から。',
    ogTitle: 'デビルズプラン ゲーム一覧とルール',
    ogDescription: '番組のゲームを一覧で。遊べるものはすぐプレイ。インストールも登録も不要。',
    heading: '『悪魔の計略』のゲーム',
    ogLines: ['『悪魔の計略』の', 'ゲーム'],
    heroBadge: '今すぐ遊べる',
    heroMeta: 'シーズン2・2〜3人・インストール不要',
    heroBody: '7×7 の盤で、毎ターン駒を動かして壁を1枚立て、陣地を囲みます。コンピューターと対戦するか、部屋を作ってリンクを友だちに送りましょう。',
    play: '遊ぶ',
    rules: 'ルール',
    s3: 'シーズン3『Dead Again』',
    s3Badge: '11/10 配信',
    s3Empty: '配信が始まったら毎週ゲームを追加します',
    s2: 'シーズン2',
    s1: 'シーズン1',
    playable: 'プレイ可',
    guide: 'ルール準備中',
    disclaimer: '非公式のファン作品です。Netflix および番組制作会社とは関係ありません。',
  },
  rules: {
    kicker: '遊び方',
    heading: '壁囲碁 Wall Go のルール',
    intro:
      '壁囲碁は Netflix『悪魔の計略 ～デビルズ・プラン～』シーズン2に登場した、囲碁の派生ゲームです。7路盤で2〜3人で遊びます。\n1ターンでやることは2つ。駒を1つ動かして、壁を1枚作る。以下、一手ずつ図で説明します。',
    metaTitle: 'ルール',
    metaDescription:
      '壁囲碁（Wall Go）の完全ルール：配置、毎ターン0〜2マス動いてから壁を1枚作る、囲まれた領域の陣地計算、3人戦の壁破壊、勝敗の決まり方。Netflix『悪魔の計略 ～デビルズ・プラン～』より。',
    ogTitle: '壁囲碁 Wall Go の遊び方',
    ogDescription: '一手ずつ図でわかる：配置、移動、壁、陣地、得点。',
    faqHeading: 'よくある質問',
    ctaPlay: 'ゲームを始める',
    version: 'バージョン',
    ctaSolo: 'ひとりで遊ぶ',
  },
  solo: {
    metaTitle: 'ひとりで遊ぶ',
    metaDescription:
      'ひとりでも壁囲碁が遊べます。CPUは3段階。どのマスにどちらが先に届くかを計算して指すので、ランダムな手は打ちません。ダウンロードも登録も不要。',
    ogTitle: '壁囲碁 Wall Go ひとりで遊ぶ',
    ogDescription: 'ひとりでも遊べます。CPUは3段階。ダウンロードも登録も不要。',
    pickLevel: 'レベルを選ぶ',
    level1: 'レベル1',
    level2: 'レベル2',
    level3: 'レベル3',
    srHeading: 'ひとりで遊ぶ | 壁囲碁 Wall Go',
  },
  local: { metaTitle: 'ローカル対戦', srHeading: 'ローカル対戦 | 壁囲碁 Wall Go' },
  online: { metaTitle: 'オンライン対戦', srHeading: 'オンライン対戦 | 壁囲碁 Wall Go' },
  replay: { metaTitle: '棋譜再生', metaDescription: '一手ずつ対局を見返せます。前後への移動も自由です。', srHeading: '棋譜再生 | 壁囲碁 Wall Go', empty: 'このリンクには棋譜がありません', emptyBody: '再生リンクには棋譜が必要です。完全なリンクをもう一度もらってください。', turn: '{total} 手中 {n} 手目', first: '最初に戻る', prev: '前の手', play: '再生', pause: '一時停止', next: '次の手', last: '最後へ' },

  ui: { next: '次へ', prev: '戻る', startGame: 'ゲームを始める', close: '閉じる', pickLevel: 'レベルを選ぶ' },
  error: { title: 'エラーが発生しました', body: '画面の処理中にエラーが起きました。再読み込みすると、たいてい元に戻ります。オンライン対戦は部屋に手がすべて残っているので、続きから再開できます。', retry: '再読み込み', home: 'ホームに戻る' },
  notFound: { title: 'ページが見つかりません', body: 'アドレスが間違っているか、その対局はすでに終わっているかもしれません。', home: 'ホームへ', rules: '遊び方を見る' },
  crumb: { home: 'ホーム' },
  nav: { language: '言語', backHome: 'ホームに戻る' },
  credits: { prefix: 'アイコン提供：', middle: '（CC BY 3.0）と', suffix: '（ISC）' },
};

export default ja;
