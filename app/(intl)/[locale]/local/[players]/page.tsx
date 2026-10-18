import { Legacy, legacyMetadata } from '@/i18n/legacy';
import { PREFIXED, toLocale } from '@/i18n/locales';

/** 舊網址 /{locale}/local/2、/local/3（見 app/i18n/legacy.tsx） */
export function generateStaticParams() {
  return PREFIXED.flatMap((locale) => [{ locale, players: '2' }, { locale, players: '3' }]);
}

type Params = { params: Promise<{ locale: string; players: string }> };

export async function generateMetadata({ params }: Params) {
  const p = await params;
  return legacyMetadata(toLocale(p.locale), `/local/${p.players}`);
}

export default async function Page({ params }: Params) {
  const p = await params;
  return <Legacy locale={toLocale(p.locale)} oldPath={`/local/${p.players}`} />;
}
