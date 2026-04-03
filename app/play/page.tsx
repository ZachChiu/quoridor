import type { Metadata } from "next";
import PlayClient from "./PlayClient";

export const generateMetadata = async (): Promise<Metadata> => {
  return {
    title: "遊戲對戰",
  };
};

export default function Play({
  searchParams,
}: {
  searchParams: { roomId?: string };
}) {
  const roomId = searchParams.roomId;

  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-1 items-center justify-center gap-8">
        <h1 className="hidden">遊戲對戰 | 牆壁圍棋 Wall Go</h1>
        <PlayClient roomId={roomId} />
      </main>
    </div>
  );
}
