import type { Metadata } from 'next';
import BaghSolo from '@/components/bagh-chal/BaghSolo';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { playMetadata } from '@/i18n/metadata';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return playMetadata(toLocale((await params).locale), '/bagh-chal/solo');
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <BaghSolo locale={toLocale((await params).locale)} />;
}
