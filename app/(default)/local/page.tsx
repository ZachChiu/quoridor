import { Legacy, legacyMetadata } from '@/i18n/legacy';

/** 舊網址 /local：搬到 /wall-go/local（見 app/i18n/legacy.tsx） */
export const metadata = legacyMetadata('zh-TW', '/local');

export default function Page() {
  return <Legacy locale="zh-TW" oldPath="/local" />;
}
