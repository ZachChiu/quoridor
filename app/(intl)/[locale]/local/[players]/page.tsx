import type { Metadata } from 'next';
import LocalView from '@/views/LocalView';
import { getMessages } from '@/i18n';
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
  const t = getMessages(toLocale((await params).locale));
  return { title: t.local.metaTitle, robots: { index: false, follow: false } };
}

export default async function Page({
  params,
}: { params: Promise<{ locale: string; players: string }> }) {
  const { locale, players } = await params;
  return <LocalView locale={toLocale(locale)} playersNum={toPlayersNum(players)} />;
}
