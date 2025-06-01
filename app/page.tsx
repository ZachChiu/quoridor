// import { useRouter } from "next/router";
'use client'

import { useRouter } from "next/navigation";
import SectionShadow from "./components/sectionShadow";
import { trackButtonClick } from "./utils/analytics";


export default function Home() {
  const router = useRouter();

  const handleStartLocalGame = () => {
    trackButtonClick('開始本機對戰');
    router.push("/play");
  };

  const handleStartConnectGame = () => {
    // trackButtonClick('開始連線對戰');
    alert('還在準備中啦哈哈哈');
  };

  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="row-start-2 flex h-full flex-1 flex-col items-center justify-center gap-8">
        <div className="size-[90dvw] md:size-[90dvh]">
          <SectionShadow>
            <div className="relative flex size-full flex-col items-center justify-center gap-8 rounded-xl border-4 border-gray-900 bg-tertiary p-8 text-xl md:gap-12">
              <h1 className="text-center text-3xl font-bold md:text-5xl">圍牆圍棋 QUORIDOR</h1>
              <div className="flex flex-col gap-4">
                <SectionShadow>
                  <button
                    type="button"
                    className="relative w-full rounded-xl border-4 border-gray-900 bg-tertiary-500 p-4 text-xl hover:-translate-x-0.5 hover:-translate-y-0.5 focus:translate-x-1 focus:translate-y-1"
                    onClick={handleStartLocalGame}
                  >
                    本機對戰 1 VS 1
                  </button>
                </SectionShadow>
                <SectionShadow>
                  <button
                    type="button"
                    className="relative w-full rounded-xl border-4 border-gray-900 bg-tertiary-400 p-4 text-xl hover:-translate-x-0.5 hover:-translate-y-0.5 focus:translate-x-1 focus:translate-y-1"
                    onClick={handleStartConnectGame}
                  >
                    連線對戰 1 VS 1
                  </button>
                </SectionShadow>
                {/* <SectionShadow>
                  <button
                    type="button"
                    className="relative w-full rounded-xl border-4 border-gray-900 bg-[#ffe1be] p-4 text-xl hover:-translate-x-0.5 hover:-translate-y-0.5 focus:translate-x-1 focus:translate-y-1"
                    onClick={handleStartGame}
                  >
                    加入遊戲
                  </button>
                </SectionShadow> */}
              </div>
            </div>
          </SectionShadow>
        </div>
      </main>
    </div>
  );
}
