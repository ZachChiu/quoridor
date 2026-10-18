import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { MOVED } from '@/i18n/routes';
import { PREFIXED } from '@/i18n/locales';

/*
  CloudFront Function 是純 JS（cloudfront-js-2.0，沒有 export），部署時才在 AWS 上測。
  這裡在本機用 vm 載入同一個檔案直接呼叫 handler —— 寫錯的話整站每個請求都會壞，
  不該等到上了 CI 才發現。
*/
const code = readFileSync(join(process.cwd(), 'infra/cloudfront-redirects.js'), 'utf8');
const ctx: { handler?: (e: unknown) => Record<string, unknown> } = {};
runInNewContext(`${code}\nthis.handler = handler;`, ctx);

type Res = { statusCode?: number; headers?: { location?: { value: string } }; uri?: string };
const run = (uri: string, querystring: Record<string, { value: string }> = {}) =>
  ctx.handler!({ request: { uri, querystring, headers: {} } }) as Res;

describe('cloudfront-redirects', () => {
  it('舊網址 301 到 /wall-go/ 底下，跟 routes.ts 的 MOVED 一致', () => {
    for (const [from, to] of Object.entries(MOVED)) {
      const res = run(from);
      expect(res.statusCode, from).toBe(301);
      expect(res.headers?.location?.value, from).toBe(`${to}/`);
    }
  });

  it('每個有前綴的語系都轉，前綴保留', () => {
    for (const l of PREFIXED) {
      expect(run(`/${l}/rules/`).headers?.location?.value).toBe(`/${l}/wall-go/rules/`);
    }
  });

  it('query 跟著帶過去（hash 不會送到伺服器，由瀏覽器自己帶）', () => {
    expect(run('/online', { x: { value: '1' } }).headers?.location?.value).toBe('/wall-go/online/?x=1');
  });

  it('首頁不轉址（它現在是平台首頁），新網址補 index.html', () => {
    expect(run('/').uri).toBe('/index.html');
    expect(run('/wall-go/rules/').uri).toBe('/wall-go/rules/index.html');
    expect(run('/ko/').uri).toBe('/ko/index.html');
  });

  it('靜態檔不動', () => {
    expect(run('/og/home-ja.png').uri).toBe('/og/home-ja.png');
  });
});
