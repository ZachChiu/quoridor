import { Legacy, legacyMetadata } from '@/i18n/legacy';

/** 舊網址 /replay：搬到 /wall-go/replay（見 app/i18n/legacy.tsx） */
export const metadata = legacyMetadata('zh-TW', '/replay');

export default function Page() {
  return <Legacy locale="zh-TW" oldPath="/replay" />;
}
