import type { Messages } from './zh-TW';

/** 用詞照 app/i18n/glossary.md：벽바둑（音譯，節目在韓國用的說法）、벽、영역、말。 */
const ko: Messages = {
  meta: {
    titleDefault: '벽바둑 Wall Go 무료 온라인 | 데블스 플랜: 데스룸',
    titleTemplate: '%s | 벽바둑 Wall Go',
    description:
      '넷플릭스 한국 리얼리티 『데블스 플랜: 데스룸』에 나온 벽바둑을 브라우저에서 무료로 플레이하세요. 7줄 판에서 말을 움직이고 벽을 세워 영역을 둘러쌉니다. 가장 넓은 사람이 승리. 2~3인 대전, 컴퓨터와의 1인 플레이, 온라인 대전을 지원합니다. 설치도 가입도 필요 없습니다.',
    keywords: ['벽바둑', 'Wall Go', '데블스 플랜', '데스룸', '바둑 변형', '영역 게임', '온라인 보드게임'],
    ogTitle: '벽바둑 Wall Go 무료 온라인',
    ogDescription:
      '『데블스 플랜: 데스룸』의 벽바둑. 7줄 판에서 돌이 아니라 벽으로 둘러싸는 영역 게임. 설치도 가입도 필요 없습니다.',
    ogAlt: '벽바둑 Wall Go —— 7줄 판에서 빨강과 파랑이 벽으로 각자의 영역을 둘러싼 모습',
    showName: '데블스 플랜: 데스룸',
  },
  home: {
    titleLine1: '벽바둑',
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
    heading: '벽바둑 Wall Go 규칙',
    intro:
      '벽바둑은 넷플릭스 『데블스 플랜: 데스룸』에 나온 바둑의 변형입니다. 7줄 판에서 2~3명이 합니다.\n한 턴에 하는 일은 두 가지입니다. 말 하나를 움직이고, 벽 하나를 세웁니다. 아래에서 한 수씩 그림과 함께 설명합니다.',
    metaTitle: '게임 규칙',
    metaDescription:
      '벽바둑(Wall Go) 전체 규칙: 배치, 매 턴 0~2칸 이동 후 벽 하나 세우기, 둘러싸인 영역 계산, 3인전의 벽 부수기, 승패 판정. 넷플릭스 『데블스 플랜: 데스룸』에서.',
    ogTitle: '벽바둑 Wall Go 플레이 방법',
    ogDescription: '한 수씩 그림으로: 배치, 이동, 벽, 영역, 점수.',
    faqHeading: '자주 묻는 질문',
    ctaPlay: '게임 시작',
    ctaSolo: '혼자 하기',
  },
  solo: {
    metaTitle: '혼자 하기',
    metaDescription:
      '혼자서도 벽바둑를 즐길 수 있습니다. 컴퓨터는 3단계. 각 칸에 누가 먼저 닿는지를 계산해서 두기 때문에 아무렇게나 두지 않습니다. 설치도 가입도 필요 없습니다.',
    ogTitle: '벽바둑 Wall Go 혼자 하기',
    ogDescription: '혼자서도 즐길 수 있습니다. 컴퓨터는 3단계. 설치도 가입도 필요 없습니다.',
    pickLevel: '난이도를 고르세요',
    level1: '1단계',
    level2: '2단계',
    level3: '3단계',
    srHeading: '혼자 하기 | 벽바둑 Wall Go',
  },
  local: { metaTitle: '로컬 대전', srHeading: '로컬 대전 | 벽바둑 Wall Go' },
  online: { metaTitle: '온라인 대전', srHeading: '온라인 대전 | 벽바둑 Wall Go' },
  replay: { metaTitle: '기보 다시보기', metaDescription: '한 수씩 대국을 다시 볼 수 있습니다. 앞뒤로 이동도 자유롭습니다.', srHeading: '기보 다시보기 | 벽바둑 Wall Go', empty: '이 링크에는 기보가 없습니다', emptyBody: '다시보기 링크에는 기보가 필요합니다. 전체 링크를 다시 받아 주세요.', turn: '{total}수 중 {n}수', first: '처음으로', prev: '이전 수', play: '재생', pause: '일시정지', next: '다음 수', last: '마지막으로' },
  ogImage: {
    home: '가장 넓은 영역 차지하기 · 2~3인 대전',
    rules: '배치 · 이동 · 벽 · 둘러싸기 · 점수',
    local: '한 기기에서 2~3명이 번갈아',
    online: '링크만 보내면 바로 같이',
    solo: '컴퓨터 상대는 3단계',
    replay: '한 수씩 처음부터 다시보기',
  },

  ui: { next: '다음', prev: '이전', startGame: '게임 시작', close: '닫기', pickLevel: '난이도 선택' },
  notFound: { title: '페이지를 찾을 수 없습니다', body: '주소가 잘못되었거나, 가리키던 대국이 이미 끝났을 수 있습니다.', home: '홈으로', rules: '플레이 방법 보기' },
  crumb: { home: '홈' },
  nav: { language: '언어', backHome: '홈으로' },
  credits: { prefix: '아이콘 출처:', middle: '(CC BY 3.0) 및', suffix: '(ISC)' },
};

export default ko;
