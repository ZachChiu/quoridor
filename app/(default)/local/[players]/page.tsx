import type { Metadata } from 'next';
import { playMetadata } from '@/i18n/metadata';
import LocalView from '@/views/LocalView';
import { toPlayersNum } from '@/utils/gameMode';

/**
 * `/local/3` —— 人數寫在網址裡。
 *
 * 先前人數只活在 GameContext 的 React state（預設兩人），重整一次
 * 三人局就變成兩人盤。試過把它放進 hash（`/local#3p`）：重整是活了，
 * 但 hash 不會送到伺服器，靜態 HTML 永遠是兩人盤，正確的盤面要等
 * hydration 之後才出現。改成真的路由，建置時就知道是幾人局 ——
 * **第一幀畫出來就是對的**。
 *
 * `/local` 本身維持兩人（既有網址不動），`/local/2` 當同義詞收著，
 * 免得有人照著 `/local/3` 的樣子手打卻吃到 404。兩者都 noindex，
 * 也都排除在 sitemap 外，所以不會有重複內容的問題。
 */
export function generateStaticParams() {
  return [{ players: '2' }, { players: '3' }];
}

export async function generateMetadata(): Promise<Metadata> {
  return playMetadata('zh-TW', '/local');
}

export default async function Page({
  params,
}: { params: Promise<{ players: string }> }) {
  return <LocalView locale="zh-TW" playersNum={toPlayersNum((await params).players)} />;
}
