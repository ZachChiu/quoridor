'use client';
import { useEffect } from 'react';

/**
 * 舊網址 /match 的相容層。
 *
 * 路由改名成 /online 之後，已經發出去的邀請連結（/match#roomId=…）
 * 不能就這樣壞掉 —— 那些連結可能還躺在別人的聊天室裡。
 *
 * **這不是真正的 301。** 靜態匯出沒有伺服器可以發轉址標頭，所以這裡是
 * 在瀏覽器裡轉。對使用者沒差別，對搜尋引擎則是靠這一頁的 canonical
 * 與 noindex 表態。要真正的 301 得在 CloudFront 上加一條函式規則：
 *
 *   /match  →  /online   （301，保留 hash 與 query）
 *
 * 那要動基礎設施，不在這個 repo 裡。
 *
 * hash 一定要帶過去 —— roomId 就在裡面，掉了就等於連結還是壞的。
 */
export default function MatchRedirect() {
  useEffect(() => {
    const { hash, search } = window.location;
    window.location.replace(`/online${search}${hash}`);
  }, []);
  return null;
}
