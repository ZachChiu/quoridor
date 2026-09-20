import type { Metadata } from 'next';
import SoloClient from './SoloClient';

export const metadata: Metadata = {
  title: '單人對戰',
  description:
    '一個人也能玩牆壁圍棋。電腦對手分三級，會評估每一格由誰先到得了來決定下法，不是隨機亂下。不用下載也不用註冊。',
  alternates: { canonical: '/solo' },
  openGraph: {
    title: '牆壁圍棋 Wall Go 單人對戰',
    description: '一個人也能玩。電腦對手分三級，不用下載也不用註冊。',
    url: '/solo',
  },
};

export default function SoloPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center overflow-hidden font-[family-name:var(--font-app)]">
      <main className="flex flex-1 items-center justify-center">
        <h1 className="sr-only">單人對戰 | 牆壁圍棋 Wall Go</h1>
        <SoloClient />
      </main>
    </div>
  );
}
