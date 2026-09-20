import { Suspense } from "react";
import type { Metadata } from "next";
import MatchClient from "./MatchClient";

export const metadata: Metadata = {
  title: "連線對戰",
  // 沒有 roomId 就是一張錯誤畫面，有 roomId 也是某兩個人的私人對局 ——
  // 兩種都不該進索引。sitemap 也排除了它，這裡是第二道。
  robots: { index: false, follow: false },
};

export default function MatchPage() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-app)]">
      <main className="flex flex-1 items-center justify-center gap-8">
        <h1 className="hidden">連線對戰 | 牆壁圍棋 Wall Go</h1>
        {/* MatchClient 使用 useSearchParams()，需要自己的 Suspense 邊界。
            /match 本來就不該被索引，這裡走 client 渲染沒有 SEO 代價。 */}
        <Suspense fallback={null}>
          <MatchClient />
        </Suspense>
      </main>
    </div>
  );
}
