import { Suspense } from "react";
import type { Metadata } from "next";
import MatchClient from "./MatchClient";

export const metadata: Metadata = {
  title: "連線對戰",
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
