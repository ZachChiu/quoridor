#!/usr/bin/env bash
# 把 infra/cloudfront-redirects.js 推上 CloudFront（301 轉址＋目錄網址補 index.html）。
#
# 由 deploy.yml 在 main 部署時呼叫。流程照 AWS 的建議：
#   更新到 DEVELOPMENT → 用 test-function 實際測幾個網址 → 全過才 publish 到 LIVE。
# 測試沒過就不發布 —— 這支 function 綁在整站的每個請求上，寫錯就是整站掛掉。
#
# 一次性的前置作業（手動，見 infra/README.md）：先在 Console 建立這支 function
# 並綁到 distribution。還沒建之前，這支腳本會跳過，不擋部署。
#
# 部署用的 IAM 需要：cloudfront:DescribeFunction、GetFunction、UpdateFunction、
# TestFunction、PublishFunction。
set -euo pipefail

NAME="${CF_FUNCTION_NAME:-wallgo-redirects}"
CODE="infra/cloudfront-redirects.js"
CONFIG='{"Comment":"301 redirects + directory index","Runtime":"cloudfront-js-2.0"}'
TMP="$(mktemp -d)"

# 1. 還沒建立就跳過
if ! DESC="$(aws cloudfront describe-function --name "${NAME}" --stage DEVELOPMENT 2>"${TMP}/err")"; then
  if grep -q "NoSuchFunctionExists" "${TMP}/err"; then
    echo "::notice::CloudFront Function「${NAME}」還沒建立，跳過（一次性設定見 infra/README.md）"
    exit 0
  fi
  echo "::warning::讀不到 CloudFront Function：$(cat "${TMP}/err")（缺 IAM 權限？見腳本開頭）"
  exit 1
fi

# 2. 線上已經是這一版就不動
if aws cloudfront get-function --name "${NAME}" --stage LIVE "${TMP}/live.js" >/dev/null 2>&1 \
   && cmp -s "${TMP}/live.js" "${CODE}"; then
  echo "CloudFront Function 已是最新，不需要更新"
  exit 0
fi

# 3. 更新到 DEVELOPMENT
ETAG="$(echo "$DESC" | jq -r '.ETag')"
ETAG="$(aws cloudfront update-function --name "${NAME}" --if-match "${ETAG}" \
  --function-config "$CONFIG" --function-code "fileb://${CODE}" | jq -r '.ETag')"

# 4. 發布前實際測：uri → 輸出裡必須出現的字串
check() {
  local uri="$1" expect="$2"
  jq -n --arg uri "${uri}" '{version:"1.0", context:{eventType:"viewer-request"}, viewer:{ip:"198.51.100.1"},
    request:{method:"GET", uri:$uri, querystring:{}, headers:{}, cookies:{}}}' > "${TMP}/event.json"
  local result out err
  result="$(aws cloudfront test-function --name "${NAME}" --if-match "${ETAG}" --stage DEVELOPMENT \
    --event-object "fileb://${TMP}/event.json")"
  err="$(echo "$result" | jq -r '.TestResult.FunctionErrorMessage // empty')"
  out="$(echo "$result" | jq -r '.TestResult.FunctionOutput // empty')"
  if [[ -n "${err}" ]] || ! grep -qF -- "${expect}" <<<"${out}"; then
    echo "::error::CloudFront Function 測試失敗：${uri} 應包含 ${expect}，實際輸出：${out} ${err}"
    return 1
  fi
  echo "  ✓ ${uri} → ${expect}"
}
echo "測試 DEVELOPMENT 階段："
check "/match"          '"statusCode":301'
check "/match"          '/online/'
check "/ja/match/"      '/ja/online/'
check "/rules/"         '/rules/index.html'
check "/rules"          '/rules/'
check "/og/home-ja.png" '/og/home-ja.png'

# 5. 全過才上線
aws cloudfront publish-function --name "${NAME}" --if-match "${ETAG}" >/dev/null
echo "CloudFront Function「${NAME}」已發布到 LIVE"
