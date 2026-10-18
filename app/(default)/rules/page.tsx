import { Legacy, legacyMetadata } from '@/i18n/legacy';

/** 舊網址 /rules：搬到 /wall-go/rules（見 app/i18n/legacy.tsx） */
export const metadata = legacyMetadata('zh-TW', '/rules');

export default function Page() {
  return <Legacy locale="zh-TW" oldPath="/rules" />;
}
