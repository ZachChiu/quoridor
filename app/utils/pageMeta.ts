/**
 * page_view 帶 `page_type`（與 `game`）：docs/platform-tracking.md 第 4 條。
 *
 * page_view 是 GA 自己送的（首次載入由 config、站內換頁由加強型評估聽 history 的變化），我們不手動送 ——
 * 手動送會跟它重複算（CLAUDE.md〈數據分析〉）。所以改用 `gtag('set', …)`：設了之後，這一頁接下來的每個事件都會帶上，
 * 包括 GA 自己送的 page_view。
 *
 * 難的是時機：站內換頁時 GA 在 pushState／replaceState 的那一下就送 page_view，比新頁面的 React effect 早，
 * 在 effect 裡 set 會帶到上一頁的值。所以這段是內嵌 script，在 GA 載入之前就先包住 pushState／replaceState、聽 popstate：
 * 網址一變就照新網址算好 set 進去。GA 之後再包一層時，呼叫順序是「GA 的包裝 → 這裡（換網址、set）→ GA 送 page_view」；
 * popstate 這裡先註冊，也比 GA 的先跑。值完全由網址推導，不依賴畫面。
 *
 * 平台首頁、季目錄沒有 game：set 成 undefined 拿掉上一頁留下的值。
 */
export type PageType = 'platform_home' | 'season' | 'game_home' | 'rules' | 'play';

/** 由網址推導（測試用；內嵌 script 裡是同一套邏輯的 JS 版，測試鎖住兩邊一致） */
export function pageMeta(pathname: string, prefixes: readonly string[], games: readonly string[]): { page_type?: PageType; game?: string } {
  const seg = pathname.split('/').filter(Boolean);
  if (prefixes.includes(seg[0])) seg.shift();
  if (seg.length === 0) return { page_type: 'platform_home' };
  if (seg[0] === 'season') return { page_type: 'season' };
  if (!games.includes(seg[0])) return {};
  return { page_type: seg.length === 1 ? 'game_home' : seg[1] === 'rules' ? 'rules' : 'play', game: seg[0] };
}

/** 內嵌 script 的內容。prefixes：有網址前綴的語系；games：能玩的遊戲 slug */
export function pageMetaScript(prefixes: readonly string[], games: readonly string[]): string {
  return `(function(){var w=window,d=w.dataLayer=w.dataLayer||[],P=${JSON.stringify(prefixes)},G=${JSON.stringify(games)};
function g(){d.push(arguments)}
function m(p){var s=p.split('/').filter(Boolean);if(P.indexOf(s[0])>=0)s.shift();
if(!s.length)return{page_type:'platform_home',game:undefined};
if(s[0]==='season')return{page_type:'season',game:undefined};
if(G.indexOf(s[0])<0)return{page_type:undefined,game:undefined};
return{page_type:s.length===1?'game_home':s[1]==='rules'?'rules':'play',game:s[0]}}
function set(){g('set',m(location.pathname))}
set();
['pushState','replaceState'].forEach(function(k){var o=history[k];history[k]=function(){var r=o.apply(this,arguments);set();return r}});
w.addEventListener('popstate',set)})();`;
}
