/**
 * CloudFront Function（viewer request）—— 真正的 301。
 *
 * 為什麼需要它：這個站是 `output: "export"` 的靜態檔案，直接放在 S3。
 * 靜態檔案沒有辦法自己回傳 301，Next 的 `redirects()` 設定在 export 模式
 * 下也不會產生任何東西。所以「網址搬家」只有兩條路：
 *
 *   a) 在瀏覽器裡用 JS 跳轉  → 對使用者可行，但搜尋引擎看到的是
 *      「200 + 一頁內容 + 跳走」，也就是 soft redirect。舊網址的
 *      排名權重不會傳給新網址。
 *   b) 在邊緣回 301          → 這個檔案。
 *
 * 部署（AWS Console）：
 *   CloudFront → Functions → Create function → 貼上這個檔案
 *   → Publish → 到 distribution 的 Behaviors，把 Default (*) 的
 *     Viewer request 綁上這個 function。
 *
 * 部署（CLI）：
 *   aws cloudfront create-function \
 *     --name wallgo-redirects \
 *     --function-config Comment="301 redirects",Runtime=cloudfront-js-2.0 \
 *     --function-code fileb://infra/cloudfront-redirects.js
 *   aws cloudfront publish-function --name wallgo-redirects --if-match <ETag>
 *
 * **關於 hash**：`#roomId=...` 永遠不會送到伺服器，所以這裡看不到它 ——
 * 但也不需要處理。瀏覽器在跟隨 301 時會自己把 fragment 帶到新網址上，
 * 這是 HTTP 規範定的行為。邀請連結因此不會壞。
 */
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // 舊網址 → 新網址。key 一律不帶結尾斜線，比對時兩種都認。
  var MOVED = {
    '/match': '/online',
  };

  // 語系前綴要一起處理：/ja/match 應該去 /ja/online，不是 /online。
  var LOCALES = ['en', 'ja', 'ko'];

  var clean = uri.replace(/\/+$/, '') || '/';
  var prefix = '';
  for (var i = 0; i < LOCALES.length; i++) {
    var p = '/' + LOCALES[i];
    if (clean === p || clean.indexOf(p + '/') === 0) {
      prefix = p;
      clean = clean.slice(p.length) || '/';
      break;
    }
  }

  var target = MOVED[clean];
  if (!target) return withIndex(request);

  var location = prefix + target + '/';
  if (request.querystring) {
    var qs = [];
    for (var k in request.querystring) {
      var v = request.querystring[k];
      qs.push(v.value ? k + '=' + v.value : k);
    }
    if (qs.length) location += '?' + qs.join('&');
  }

  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}

/**
 * 目錄網址補上 index.html；沒有結尾斜線的頁面網址 301 到有斜線的版本。
 *
 * 為什麼放在這裡：CloudFront 每個 behavior 的 viewer request **只能綁一個**
 * function。如果 distribution 原本就有一支在做 `/rules/ → /rules/index.html`
 * （S3 用 REST endpoint + OAC 時一定要有，否則目錄網址全部 403/404），
 * 綁上這支會把它換掉 —— 整站只剩首頁打得開。所以這支自己把那件事也做了。
 *
 * 對 S3 website endpoint 也無害：`/rules/index.html` 這個物件本來就存在。
 *
 * 結尾斜線：next.config.ts 設了 `trailingSlash: true`，canonical、sitemap、
 * 站內連結全都帶斜線。`/rules` 這種沒斜線的網址 301 過去，搜尋引擎才不會
 * 把兩個當成重複內容。有副檔名的（.png、.js、.xml…）是檔案，原樣放行。
 */
function withIndex(request) {
  var uri = request.uri;
  if (uri.charAt(uri.length - 1) === '/') {
    request.uri = uri + 'index.html';
    return request;
  }
  var last = uri.slice(uri.lastIndexOf('/') + 1);
  if (last.indexOf('.') !== -1) return request;

  var location = uri + '/';
  if (request.querystring) {
    var qs = [];
    for (var k in request.querystring) {
      var v = request.querystring[k];
      qs.push(v.value ? k + '=' + v.value : k);
    }
    if (qs.length) location += '?' + qs.join('&');
  }
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}
