import type { Metadata } from 'next';
import SeasonView from '@/views/SeasonView';
import { localeMetadata } from '@/i18n/metadata';
import { SEASON_NUMBERS, season, type SeasonNumber } from '@/i18n/routes';

/** zh-TW 的季目錄頁（/season/1、/season/2、/season/3） */
export const dynamicParams = false;

export function generateStaticParams() {
  return SEASON_NUMBERS.map((n) => ({ n }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: SeasonNumber }> }): Promise<Metadata> {
  return localeMetadata('zh-TW', season((await params).n));
}

export default async function Page({ params }: { params: Promise<{ n: SeasonNumber }> }) {
  return <SeasonView locale="zh-TW" n={(await params).n} />;
}
