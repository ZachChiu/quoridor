import SectionShadow from "./components/SectionShadow";
import HomeClient from "./HomeClient";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center gap-16 overflow-hidden font-[family-name:var(--font-geist-sans)]">
      <main className="row-start-2 flex h-full flex-1 flex-col items-center justify-center gap-8">
        <div className="size-[90dvw] md:size-[90dvh]">
          <SectionShadow>
            <div className="relative flex size-full flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border-4 border-gray-900 bg-tertiary p-8 text-xl md:gap-8 lg:gap-12">
              <h1 className="relative z-20 text-center text-2xl font-bold md:text-3xl lg:text-5xl">牆壁圍棋 Wall Go</h1>
              <HomeClient/>

              {/* 背景假棋盤 */}
              <div className="animate-rotate-scale absolute grid size-full grid-cols-7 gap-1 overflow-hidden bg-gray-300 opacity-20">
                {Array.from({ length: 7 }, (_, rowIndex) =>
                  Array.from({ length: 7 }, (_, colIndex) => {
                    return (
                      <div
                        className={`group relative flex items-center justify-center bg-tertiary`}
                        key={`${rowIndex}-${colIndex}`}
                      >
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </SectionShadow>
        </div>
      </main>
    </div>
  );
}
