import type { Metadata } from 'next';
import Link from 'next/link';
import TutorialBoard from '@/components/TutorialBoard';
import { STEPS } from '@/components/tutorialSteps';
import { FAQ } from './faq';

/**
 * 規則說明頁。
 *
 * 在此之前規則只存在於遊玩方式 Modal 裡 —— 那是 JS 開起來的對話框，
 * 爬蟲看不到，於是整個站只有首頁那幾行字可以被索引。但「牆壁圍棋怎麼玩」
 * 「wall go 規則」正是這個題材最大宗的查詢。
 *
 * 內容與 Modal 共用同一份 STEPS：兩邊分開寫遲早會講不一樣的規則，
 * 而使用者不會知道該信哪一份。
 */
export const metadata: Metadata = {
  title: '遊戲規則',
  description:
    '牆壁圍棋（Wall Go）完整規則：開局擺子、每回合走 0 到 2 格後必須築一道牆、封閉區域計算地盤、三人局的破牆機制與勝負判定。出自 Netflix《魔鬼的計謀：死亡密室》。',
  alternates: { canonical: '/rules' },
  openGraph: {
    title: '牆壁圍棋 Wall Go 規則說明',
    description: '一步一圖看懂牆壁圍棋怎麼玩：擺子、移動、築牆、圈地、計分。',
    url: '/rules',
  },
};

export default function RulesPage() {
  return (
    <div className="mx-auto max-w-[46rem] px-5 py-[max(2rem,5dvh)] font-[family-name:var(--font-app)]">
      <header>
        <p className="text-sm font-bold text-ink-soft">遊玩方式</p>
        {/* 字級同時吃 vw 與 dvh：只看高度的話，窄螢幕上「牆壁圍棋 Wall Go」
            會在 Wall 和 Go 中間斷掉。 */}
        <h1 className="mt-1 text-[clamp(1.75rem,7vw,3rem)] font-black leading-[1.1] tracking-tight">
          牆壁圍棋 Wall Go 規則
        </h1>
        <p className="mt-4 text-base leading-relaxed">
          牆壁圍棋出自 Netflix《魔鬼的計謀：死亡密室》。規則只有三句話：移動、築牆、圈地。
          但因為每一道牆同時幫自己也幫對手，變化很深。下面一步一圖走完整套規則。
        </p>
      </header>

      {/* 每一步都是真實 HTML，不是 JS 開出來的對話框 —— 爬蟲讀得到，
          分享連結時預覽也帶得出內容。 */}
      <ol className="mt-10 space-y-10">
        {STEPS.map((step, i) => (
          <li key={step.title} className="grid gap-5 md:grid-cols-[200px_1fr] md:items-start">
            <div className="mx-auto w-full max-w-[200px]">
              <TutorialBoard {...step.board} />
            </div>
            <div>
              <h2 className="text-xl font-black leading-snug">
                <span className="mr-2 text-ink-soft">{i + 1}.</span>
                {step.title}
              </h2>
              <p className="mt-2 text-base leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-14">
        <h2 className="text-2xl font-black tracking-tight">常見問題</h2>
        <dl className="mt-5 space-y-6">
          {FAQ.map((item) => (
            <div key={item.q}>
              <dt className="text-lg font-black leading-snug">{item.q}</dt>
              <dd className="mt-1.5 text-base leading-relaxed">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-2xl bg-tile-amber px-6 py-4 text-lg font-black text-tile-ink transition hover:brightness-95"
        >
          開始遊戲
        </Link>
        <Link
          href="/solo"
          className="rounded-2xl bg-tile-orange px-6 py-4 text-lg font-black text-tile-ink transition hover:brightness-95"
        >
          單人對戰
        </Link>
      </div>

      <p className="mt-10 text-[11px] leading-relaxed text-ink-soft">
        圖示來自{' '}
        <a className="underline" href="https://game-icons.net" target="_blank" rel="noopener noreferrer">game-icons.net</a>
        （CC BY 3.0）與{' '}
        <a className="underline" href="https://lucide.dev" target="_blank" rel="noopener noreferrer">Lucide</a>
        （ISC）
      </p>

      {/*
        FAQPage 結構化資料。與上面那份 FAQ 來自同一個陣列 ——
        結構化資料和頁面內容不一致時，Google 的處理是整組不採用，
        所以絕對不能各寫一份。
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ.map((item) => ({
              '@type': 'Question',
              name: item.q,
              acceptedAnswer: { '@type': 'Answer', text: item.a },
            })),
          }),
        }}
      />
    </div>
  );
}
