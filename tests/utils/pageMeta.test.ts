import { describe, expect, it, vi } from 'vitest';
import { pageMeta, pageMetaScript } from '@/utils/pageMeta';

const P = ['zh-Hans', 'en', 'ja', 'ko', 'th'];
const G = ['wall-go', 'bagh-chal'];
const ORIGIN = 'https://quoridorgame.com';

/** 在假的 window 上跑內嵌 script；回傳 dataLayer 裡的 config 與 page_view、換網址與標題的方法 */
function run(start: string) {
  vi.useFakeTimers();
  const url = new URL(start, ORIGIN);
  const loc = {
    origin: ORIGIN,
    get pathname() { return url.pathname; },
    get search() { return url.search; },
  };
  const go = (to: string) => { const n = new URL(to, ORIGIN); url.pathname = n.pathname; url.search = n.search; url.hash = n.hash; };
  const listeners: Record<string, (() => void)[]> = {};
  const history = {
    pushState(_s: unknown, _t: string, to: string) { go(to); },
    replaceState(_s: unknown, _t: string, to: string) { go(to); },
  };
  const win: { dataLayer?: unknown[]; addEventListener: (t: string, f: () => void) => void } = {
    addEventListener: (t, f) => { (listeners[t] ??= []).push(f); },
  };
  let observer: (() => void) | null = null;
  class FakeObserver { constructor(f: () => void) { observer = f; } observe() {} disconnect() { observer = null; } }
  const doc = { title: 'old', head: {} };
  new Function('window', 'history', 'location', 'document', 'MutationObserver', pageMetaScript('G-TEST', P, G))(win, history, loc, doc, FakeObserver);
  const calls = () => (win.dataLayer as IArguments[]).map((a) => Array.from(a));
  const views = () => calls().filter((a) => a[0] === 'event' && a[1] === 'page_view').map((a) => a[2] as Record<string, unknown>);
  return {
    history, go, calls, views,
    retitle: (t: string) => { doc.title = t; observer?.(); },
    fire: (t: string) => listeners[t]?.forEach((f) => f()),
  };
}

const strip = (v: Record<string, unknown>) => Object.fromEntries(Object.entries(v).filter(([k]) => k !== 'page_location'));

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
    // 內嵌 script 是同一套邏輯的 JS 版：載入當下就送第一筆
    expect(run(path).views().map(strip)).toEqual([want]);
  });

  it('config 不自動送 page_view（不然第一筆會重複）', () => {
    expect(run('/').calls().filter((a) => a[0] === 'config')).toEqual([['config', 'G-TEST', { send_page_view: false }]]);
  });

  it('站內換頁：等新標題換上才送，一次換頁一筆；網址不帶 hash', () => {
    const r = run('/');
    r.history.pushState(null, '', '/bagh-chal/#tiger-normal');
    expect(r.views()).toHaveLength(1);
    r.retitle('尼泊爾虎棋');
    expect(r.views()).toHaveLength(2);
    r.retitle('尼泊爾虎棋（又改了一次）');
    expect(r.views()[1]).toEqual({ page_type: 'game_home', game: 'bagh-chal', page_location: `${ORIGIN}/bagh-chal/` });
    expect(r.views()).toHaveLength(2);
  });

  it('標題一直沒變，1 秒後照樣送', () => {
    const r = run('/');
    r.history.pushState(null, '', '/season/1/');
    vi.advanceTimersByTime(999);
    expect(r.views()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(r.views().map(strip)).toEqual([{ page_type: 'platform_home' }, { page_type: 'season' }]);
  });

  it('只改 hash、離開守門那筆同網址的 pushState 不算換頁', () => {
    const r = run('/wall-go/online/#new=2');
    r.history.replaceState(null, '', '/wall-go/online/#roomId=abc');
    r.history.pushState({ __wallgoGuard: true }, '', '/wall-go/online/#roomId=abc');
    vi.advanceTimersByTime(5000);
    expect(r.views()).toHaveLength(1);
  });

  it('還沒送就又換頁、返回、離開：先送掉上一頁，記的是上一頁的網址', () => {
    const r = run('/');
    r.history.pushState(null, '', '/bagh-chal/');
    r.history.pushState(null, '', '/bagh-chal/rules/');
    r.go('/bagh-chal/');
    r.fire('popstate');
    r.fire('pagehide');
    expect(r.views()).toEqual([
      { page_type: 'platform_home', page_location: `${ORIGIN}/` },
      { page_type: 'game_home', game: 'bagh-chal', page_location: `${ORIGIN}/bagh-chal/` },
      { page_type: 'rules', game: 'bagh-chal', page_location: `${ORIGIN}/bagh-chal/rules/` },
      { page_type: 'game_home', game: 'bagh-chal', page_location: `${ORIGIN}/bagh-chal/` },
    ]);
  });
});
