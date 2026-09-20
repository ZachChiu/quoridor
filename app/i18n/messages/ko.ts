import type { Messages } from './zh-TW';

/** 用詞照 app/i18n/glossary.md：월 고（音譯，節目在韓國用的說法）、벽、영역、말。 */
const ko: Messages = {
  meta: {
    titleDefault: '월 고 Wall Go 무료 온라인 | 2~3인 영역 전략 게임',
    titleTemplate: '%s | 월 고 Wall Go',
    description:
      "넷플릭스 『데블스 플랜: 데스룸』에 나온 월 고를 무료로 플레이하세요. 말을 움직이고 벽을 세워 영역을 둘러싸면 됩니다. 영역이 가장 넓은 사람이 승리. 2~3인 대전, 컴퓨터와의 1인 플레이, 온라인 대전을 지원합니다. 설치도 가입도 필요 없습니다.",
    keywords: ['월 고', 'Wall Go', '데블스 플랜', '데스룸', '영역 게임', '전략 게임', '온라인 보드게임'],
    ogTitle: '월 고 Wall Go 무료 온라인',
    ogDescription:
      '넷플릭스 『데블스 플랜: 데스룸』의 월 고. 벽으로 둘러싸 영역을 넓히고, 가장 넓은 사람이 이깁니다. 설치도 가입도 필요 없습니다.',
    ogAlt: '월 고 Wall Go —— 7x7 판에서 빨강과 파랑이 벽으로 각자의 영역을 둘러싼 모습',
    showName: '데블스 플랜: 데스룸',
  },
  home: {
    titleLine1: '월 고',
    titleLine2: 'Wall Go',
    tagline: '가장 넓은 영역을 차지하세요 · 2~3인 대전',
    localKicker: '로컬',
    onlineKicker: '온라인',
    twoPlayers: '2인',
    threePlayers: '3인',
    solo: '혼자 하기',
    rules: '게임 규칙',
  },
  rules: {
    kicker: '플레이 방법',
    heading: '월 고 Wall Go 규칙',
    intro:
      '월 고는 넷플릭스 『데블스 플랜: 데스룸』에 나온 게임입니다. 규칙은 세 가지뿐입니다. 움직이고, 벽을 세우고, 둘러싼다. 다만 내가 세운 벽은 상대에게도 똑같이 작용하기 때문에 보기보다 깊습니다. 아래에서 한 수씩 그림과 함께 설명합니다.',
    metaTitle: '게임 규칙',
    metaDescription:
      '월 고(Wall Go) 전체 규칙: 배치, 매 턴 0~2칸 이동 후 벽 하나 세우기, 둘러싸인 영역 계산, 3인전의 벽 부수기, 승패 판정. 넷플릭스 『데블스 플랜: 데스룸』에서.',
    ogTitle: '월 고 Wall Go 플레이 방법',
    ogDescription: '한 수씩 그림으로: 배치, 이동, 벽, 영역, 점수.',
    faqHeading: '자주 묻는 질문',
    ctaPlay: '게임 시작',
    ctaSolo: '혼자 하기',
  },
  solo: {
    metaTitle: '혼자 하기',
    metaDescription:
      '혼자서도 월 고를 즐길 수 있습니다. 컴퓨터는 3단계. 각 칸에 누가 먼저 닿는지를 계산해서 두기 때문에 아무렇게나 두지 않습니다. 설치도 가입도 필요 없습니다.',
    ogTitle: '월 고 Wall Go 혼자 하기',
    ogDescription: '혼자서도 즐길 수 있습니다. 컴퓨터는 3단계. 설치도 가입도 필요 없습니다.',
    pickLevel: '난이도를 고르세요',
    level1: '1단계',
    level2: '2단계',
    level3: '3단계',
    srHeading: '혼자 하기 | 월 고 Wall Go',
  },
  local: { metaTitle: '로컬 대전', srHeading: '로컬 대전 | 월 고 Wall Go' },
  match: { metaTitle: '온라인 대전', srHeading: '온라인 대전 | 월 고 Wall Go' },
  ui: { next: '다음', prev: '이전', startGame: '게임 시작', close: '닫기', pickLevel: '난이도 선택' },
  nav: { language: '언어', backHome: '홈으로' },
  credits: { prefix: '아이콘 출처:', middle: '(CC BY 3.0) 및', suffix: '(ISC)' },
};

export default ko;
