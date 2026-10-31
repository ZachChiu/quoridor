import type { Metadata } from 'next';
import BaghPlay from '@/components/bagh-chal/BaghPlay';
import { PREFIXED, toLocale } from '@/i18n/locales';
import { playMetadata } from '@/i18n/metadata';

export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  return playMetadata(toLocale((await params).locale), '/bagh-chal/local');
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <BaghPlay locale={toLocale((await params).locale)} mode={{ kind: 'local' }} />;
}
