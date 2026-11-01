import { describe, expect, it } from 'vitest';
import { pageMeta, pageMetaScript } from '@/utils/pageMeta';

const P = ['zh-Hans', 'en', 'ja', 'ko', 'th'];
const G = ['wall-go', 'bagh-chal'];

/** 在假的 window 上跑內嵌 script，回傳 dataLayer 與推網址的方法 */
function run(start: string) {
  const loc = { pathname: start };
  const listeners: (() => void)[] = [];
  const history = {
    pushState(_s: unknown, _t: string, url: string) { loc.pathname = url; },
    replaceState(_s: unknown, _t: string, url: string) { loc.pathname = url; },
  };
  const win: { dataLayer?: unknown[]; addEventListener: (t: string, f: () => void) => void } = {
    addEventListener: (_t, f) => { listeners.push(f); },
  };
  new Function('window', 'history', 'location', pageMetaScript(P, G))(win, history, loc);
  const sets = () => (win.dataLayer as IArguments[]).map((a) => Array.from(a)).filter((a) => a[0] === 'set').map((a) => a[1]);
  return { history, loc, sets, popstate: () => listeners.forEach((f) => f()) };
}

describe('page_view 的 page_type', () => {
  it.each([
    ['/', { page_type: 'platform_home' }],
    ['/en/', { page_type: 'platform_home' }],
    ['/season/2/', { page_type: 'season' }],
    ['/ja/season/1', { page_type: 'season' }],
    ['/wall-go/', { page_type: 'game_home', game: 'wall-go' }],
    ['/th/bagh-chal', { page_type: 'game_home', game: 'bagh-chal' }],
    ['/wall-go/rules/', { page_type: 'rules', game: 'wall-go' }],
    ['/zh-Hans/bagh-chal/rules/', { page_type: 'rules', game: 'bagh-chal' }],
    ['/wall-go/local/3/', { page_type: 'play', game: 'wall-go' }],
    ['/ko/bagh-chal/online/', { page_type: 'play', game: 'bagh-chal' }],
    ['/rules/', {}],
  ])('%s', (path, want) => {
    expect(pageMeta(path, P, G)).toEqual(want);
    // 內嵌 script 是同一套邏輯的 JS 版
    const got = run(path).sets()[0] as Record<string, unknown>;
    expect(Object.fromEntries(Object.entries(got).filter(([, v]) => v !== undefined))).toEqual(want);
  });

  it('站內換頁、返回時，換網址之後才 set 新的值（GA 接著送 page_view）', () => {
    const r = run('/');
    r.history.pushState(null, '', '/bagh-chal/');
    r.history.replaceState(null, '', '/bagh-chal/rules/');
    r.loc.pathname = '/season/1/';
    r.popstate();
    expect(r.sets()).toEqual([
      { page_type: 'platform_home', game: undefined },
      { page_type: 'game_home', game: 'bagh-chal' },
      { page_type: 'rules', game: 'bagh-chal' },
      { page_type: 'season', game: undefined },
    ]);
  });
});
