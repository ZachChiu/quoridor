// import { useRouter } from "next/router";
'use client'

import { useRouter } from "next/navigation";



export default function Home() {
  const router = useRouter();

  const handleStartGame = () => {
    router.push("/play");
  };

  return (
    <div className="flex items-center justify-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <main className="flex flex-col gap-8 row-start-2 h-full flex-1 items-center justify-center ">
        <h1 className="text-xl">圍牆圍棋 QUORIDOR</h1>
        <div className="flex flex-col gap-4">
          <button type="button" onClick={handleStartGame}>開始遊戲</button>
          <button>加入遊戲</button>
        </div>
       </main>
    </div>
  );
}
