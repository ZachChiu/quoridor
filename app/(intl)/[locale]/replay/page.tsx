import type { Metadata } from 'next';
import { playMetadata } from '@/i18n/metadata';
import ReplayView from '@/views/ReplayView';
import { PREFIXED, toLocale } from '@/i18n/locales';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return playMetadata(toLocale((await params).locale), '/replay');
}

export default async function Page({
  params,
}: { params: Promise<{ locale: string }> }) {
  return <ReplayView locale={toLocale((await params).locale)} />;
}
