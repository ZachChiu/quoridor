import type { Metadata } from "next";
import PlayClient from "../components/PlayClient";

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "遊戲對戰",
  };
};

export default function Local() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.jpg')" }}
      />
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
      <main className="relative z-10 flex flex-1 items-center justify-center gap-8">
        <h1 className="hidden">遊戲對戰 | 牆壁圍棋 Wall Go</h1>
        <PlayClient />
      </main>
    </div>
  );
}
