import type { Metadata } from 'next';
import { playMetadata } from '@/i18n/metadata';
import LocalView from '@/views/LocalView';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { toPlayersNum } from '@/utils/gameMode';

/** 各語系的 `/{locale}/local/3`。理由與 (default) 那支相同。 */
export function generateStaticParams() {
  return PREFIXED.flatMap((locale) => [
    { locale, players: '2' },
    { locale, players: '3' },
  ]);
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return playMetadata(toLocale((await params).locale), '/local');
}

export default async function Page({
  params,
}: { params: Promise<{ locale: string; players: string }> }) {
  const { locale, players } = await params;
  return <LocalView locale={toLocale(locale)} playersNum={toPlayersNum(players)} />;
}
