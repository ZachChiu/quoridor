import Chessboard from "../components/chessboard";

export default function Play() {
  const numberOfPlaers = 2;


  return (
    <div className="flex items-center justify-center min-h-screen gap-16 font-[family-name:var(--font-geist-sans)] overflow-hidden">
      <main className="flex gap-8 flex-1 h-full items-center justify-between px-5">
        <div className="player-info">
          <div className="bg-red-500 w-5 h-5 rounded-full">

          </div>
          <div className="bg-blue-500 w-5 h-5 rounded-full">

          </div>
        </div>
        <Chessboard size={7}></Chessboard>
       </main>
    </div>
  );
}