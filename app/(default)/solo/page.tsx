import { Legacy, legacyMetadata } from '@/i18n/legacy';

/** 舊網址 /solo：搬到 /wall-go/solo（見 app/i18n/legacy.tsx） */
export const metadata = legacyMetadata('zh-TW', '/solo');

export default function Page() {
  return <Legacy locale="zh-TW" oldPath="/solo" />;
}
