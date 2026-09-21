import type { Metadata } from 'next';
import ReplayView from '@/views/ReplayView';
import { getMessages } from '@/i18n';
import { PREFIXED, toLocale } from '@/i18n/locales';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const t = getMessages(toLocale((await params).locale));
  return { title: t.replay.metaTitle, robots: { index: false, follow: true } };
}

export default async function Page({
  params,
}: { params: Promise<{ locale: string }> }) {
  return <ReplayView locale={toLocale((await params).locale)} />;
}
