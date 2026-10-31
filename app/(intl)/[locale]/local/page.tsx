import { Legacy, legacyMetadata } from '@/i18n/legacy';
import { PREFIXED, toLocale } from '@/i18n/locales';

/** 舊網址 /{locale}/local：搬到 /{locale}/wall-go/local（見 app/i18n/legacy.tsx） */
export function generateStaticParams() {
  return PREFIXED.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  return legacyMetadata(toLocale((await params).locale), '/local');
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <Legacy locale={toLocale((await params).locale)} oldPath="/local" />;
}
