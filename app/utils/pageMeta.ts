/**
 * page_view 帶 `page_type`（與 `game`）：docs/platform-tracking.md 第 4 條、docs/page-type-ga-fix.md。
 *
 * **page_view 由我們自己送，一次換頁一筆**（11/2 大腦筋：v26.11.1 起 383 筆 page_view 的 page_type 全是空的）。
 * 先前是 `gtag('set', …)` 讓 GA 自己送的 page_view 帶上 —— 但 GA4 的 set 不會把自訂參數帶進事件；
 * 換頁時再呼叫一次 `config` 也沒用，參數停在第一次 config 的值（11/2 用無頭 Chrome 攔下 /g/collect 實測，請求都擋掉沒送出）。
 * 所以 config 帶 `send_page_view: false`，第一次載入與每次換網址都由這裡送 `page_view`，參數放在事件本身。
 *
 * **GA 後台要關掉「加強型評估 → 網頁瀏覽 → 依瀏覽器記錄事件判斷網頁變更」**，否則站內換頁時 GA 自己也送一筆、算兩次
 * （這個開關只有後台有，程式關不掉）。
 *
 * 時機：這段是內嵌 script，在 GA 載入之前就先包住 pushState／replaceState、聽 popstate。
 * - 只看 pathname＋search 有沒有變：hash（房號、難度、騎士巡遊的模式）與離開守門那筆同網址的 pushState 不算換頁。
 * - 換網址那一下新頁的 `<title>` 還沒換上（Next 之後才改），所以等標題變了再送、最多等 1 秒；
 *   還沒送出就又換頁或離開（pagehide），先把這筆送掉。網址（page_location）是換頁那一下記下來的、不帶 hash（房號不進 GA），
 *   所以晚一點送也不會記成下一頁。
 * 值完全由網址推導，不依賴畫面。平台首頁、季目錄沒有 game。
 *
 * 其他事件（`track()`）不帶 page_type（docs 寫明不強求）。
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

/** 等新頁標題的上限 */
const TITLE_WAIT_MS = 1000;

/**
 * 內嵌 script 的內容：建立 gtag、config（不自動送 page_view）、送第一筆 page_view、包住 history。
 * gtag.js 本身由 shell 另外載入。prefixes：有網址前綴的語系；games：能玩的遊戲 slug
 */
export function pageMetaScript(gaId: string, prefixes: readonly string[], games: readonly string[]): string {
  return `(function(){var w=window,d=w.dataLayer=w.dataLayer||[],P=${JSON.stringify(prefixes)},G=${JSON.stringify(games)};
function gtag(){d.push(arguments)}
w.gtag=gtag;gtag('js',new Date());gtag('config',${JSON.stringify(gaId)},{send_page_view:false});
function m(p){var s=p.split('/').filter(Boolean);if(P.indexOf(s[0])>=0)s.shift();
if(!s.length)return{page_type:'platform_home'};
if(s[0]==='season')return{page_type:'season'};
if(G.indexOf(s[0])<0)return{};
return{page_type:s.length===1?'game_home':s[1]==='rules'?'rules':'play',game:s[0]}}
function key(){return location.pathname+location.search}
var cur=key(),timer=0,obs=null,pending=null;
function send(){var x=pending;if(!x)return;pending=null;clearTimeout(timer);if(obs){obs.disconnect();obs=null}
var e=m(x.path);e.page_location=x.href;gtag('event','page_view',e)}
function mark(){pending={path:location.pathname,href:location.origin+location.pathname+location.search}}
function later(){var t=document.title;mark();timer=setTimeout(send,${TITLE_WAIT_MS});
if(typeof MutationObserver==='function'&&document.head){obs=new MutationObserver(function(){if(document.title!==t)send()});obs.observe(document.head,{subtree:true,childList:true,characterData:true})}}
mark();send();
['pushState','replaceState'].forEach(function(k){var o=history[k];history[k]=function(){var r=o.apply(this,arguments);var n=key();if(n!==cur){send();cur=n;later()}return r}});
w.addEventListener('popstate',function(){var n=key();if(n!==cur){send();cur=n;later()}});
w.addEventListener('pagehide',send)})();`;
}
