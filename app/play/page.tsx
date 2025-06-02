import type { Metadata } from "next";
import PlayGame from "./playGame";

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "遊戲對戰",
  };
};

export default function Play() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-1 items-center justify-center gap-8">
        <h1 className="hidden">遊戲對戰 | 圍牆圍棋 QUORIDOR</h1>
        <PlayGame />
      </main>
    </div>
  );
}
