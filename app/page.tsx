// import { useRouter } from "next/router";
'use client'

import { useRouter } from "next/navigation";



export default function Home() {
  const router = useRouter();

  const handleStartGame = () => {
    router.push("/play");
  };

  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="row-start-2 flex h-full flex-1 flex-col items-center justify-center gap-8 ">
        <h1 className="text-xl">圍牆圍棋 QUORIDOR</h1>
        <div className="flex flex-col gap-4">
          <button type="button" onClick={handleStartGame}>開始遊戲</button>
          <button>加入遊戲</button>
        </div>
       </main>
    </div>
  );
}
