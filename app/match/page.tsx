import type { Metadata } from "next";
import MatchClient from "./MatchClient";

export const metadata: Metadata = {
  title: "連線對戰",
};

export default function MatchPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
      <main className="relative z-10 flex flex-1 items-center justify-center gap-8">
        <h1 className="hidden">連線對戰 | 牆壁圍棋 Wall Go</h1>
        <MatchClient />
      </main>
    </div>
  );
}
