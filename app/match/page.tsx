import type { Metadata } from "next";
import MatchClient from "./MatchClient";

export const metadata: Metadata = {
  title: "對戰房間",
};

export default function MatchPage() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-1 items-center justify-center gap-8">
        <h1 className="hidden">對戰房間 | Wall Go</h1>
        <MatchClient />
      </main>
    </div>
  );
}
