import { Legacy, legacyMetadata } from '@/i18n/legacy';

/** 舊網址 /local/2、/local/3：搬到 /wall-go/local…（見 app/i18n/legacy.tsx） */
export function generateStaticParams() {
  return [{ players: '2' }, { players: '3' }];
}

export async function generateMetadata({ params }: { params: Promise<{ players: string }> }) {
  return legacyMetadata('zh-TW', `/local/${(await params).players}`);
}

export default async function Page({ params }: { params: Promise<{ players: string }> }) {
  return <Legacy locale="zh-TW" oldPath={`/local/${(await params).players}`} />;
}
