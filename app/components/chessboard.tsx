"use client";

export default function Chessboard({ size }: { size: number }) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="chessboard-container relative w-[80dvh] h-[80dvh]">
      {/* 列座標（A-H） */}
      <div className="absolute bottom-[-1.25rem] left-0 flex w-full">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="flex-1 text-center text-xs"
            key={`col-label-${i}`}
          >
            {letters[i]}
          </div>
        ))}
      </div>

      {/* 行座標（1-8） */}
      <div className="absolute left-[-1.25rem] top-0 h-full flex flex-col justify-center">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="h-full text-xs flex items-center justify-center"
            style={{ height: `${100 / size}%` }}
            key={`row-label-${i}`}
          >
            {size - i}
          </div>
        ))}
      </div>

      {/* 棋盤 */}
      <div className={`grid grid-cols-${size} w-full h-full bg-gray-500 gap-px border-8 rounded-lg overflow-hidden`}>
        {Array.from({ length: size }, (_, colIndex) =>
          Array.from({ length: size }, (_, rowIndex) => (
            <div
              key={`${colIndex}-${rowIndex}`}
              className={`relative bg-white`}
            />
          ))
        )}
      </div>
    </div>
  );

}
