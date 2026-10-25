import { MANIFEST_FILES, webManifest } from '@/i18n/pwa';

/** 加到主畫面的設定檔，一個語系一份（/pwa/zh-TW.json…）。內容與「為什麼都回平台首頁」見 i18n/pwa.ts */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return MANIFEST_FILES.map(({ file }) => ({ file }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const entry = MANIFEST_FILES.find((m) => m.file === file);
  if (!entry) return new Response('Not found', { status: 404 });
  return Response.json(webManifest(entry.locale));
}
