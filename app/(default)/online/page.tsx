import { Legacy, legacyMetadata } from '@/i18n/legacy';

/** 舊網址 /online：搬到 /wall-go/online（見 app/i18n/legacy.tsx） */
export const metadata = legacyMetadata('zh-TW', '/online');

export default function Page() {
  return <Legacy locale="zh-TW" oldPath="/online" />;
}
