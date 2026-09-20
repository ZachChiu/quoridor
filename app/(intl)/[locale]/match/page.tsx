import type { Metadata } from 'next';
import MatchView from '@/views/MatchView';
import { getMessages } from '@/i18n';
import { PREFIXED, toLocale } from '@/i18n/locales';

/**
 * 各語系的對局畫面。
 *
 * 不做這一層的話，/en 首頁按下磁磚會導到 zh-TW 的 /local ——
 * 英文使用者一進遊戲畫面整個介面就變回中文。
 * 這兩頁不需要被索引，但介面語言必須跟著走。
 */
export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = getMessages(toLocale((await params).locale));
  return { title: t.match.metaTitle, robots: { index: false, follow: false } };
}

export default async function Page({
  params,
}: { params: Promise<{ locale: string }> }) {
  return <MatchView locale={toLocale((await params).locale)} />;
}
