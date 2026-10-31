'use client';
import { useEffect } from 'react';

/**
 * 搬家前舊網址的瀏覽器端轉址（2026-10 平台化：Wall Go 搬進 /wall-go/）。
 *
 * **真正的 301 在 CloudFront**（infra/cloudfront-redirects.js），正常情況下根本走不到這裡。
 * 這一層是備援：部署時更新 CloudFront Function 那一步設成「失敗也不擋部署」，
 * 萬一它沒更新成功，舊網址會直接 404 —— 已經發出去的邀請連結（/online#roomId=…）
 * 還躺在別人的聊天室裡，不能就這樣壞掉。
 *
 * hash 一定要帶過去：房號就在裡面。
 */
export default function LegacyRedirect({ to }: { to: string }) {
  useEffect(() => {
    const { hash, search } = window.location;
    window.location.replace(`${to}${search}${hash}`);
  }, [to]);
  return null;
}
