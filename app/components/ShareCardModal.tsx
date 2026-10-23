'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LuShare2 } from 'react-icons/lu';
import Modal from './Modal';
import Button from './Button';
import { PLAYER_ON, playerVar, type PlayerKey } from '@/config/players';
import { useGameText, useLocale, useMessages } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';
import { localePath } from '@/i18n/locales';
import { drawResultCard, type CardLayout, type ResultCardData } from '@/utils/resultCard';
import { track } from '@/utils/analytics';

/**
 * 結算之後的分享圖（Zach 10/23：「結束後易於分享的圖片…當然要帶有廣告效果」）。
 *
 * 圖在瀏覽器裡用 Canvas 畫（utils/resultCard.ts），不經過任何伺服器：盤面、比分、思考時間，
 * 加上站名、網址、掃了就到首頁的 QR code。出處寫「靈感來自《節目名》」，**不寫 Netflix** ——
 * 圖上有我們的站名又有 Netflix，看起來像官方合作（大腦 10/23 建議）。
 *
 * 三種比例：4:5（IG／FB 貼文）、1:1、9:16（限時動態）。
 *
 * 分享：瀏覽器能分享檔案就叫系統分享面板（手機上直接選 LINE、IG），不行就存成檔案。
 * App 內建瀏覽器（LINE、FB）常常兩個都不給，所以預覽圖底下寫「也可以長按圖片儲存」——
 * 預覽本身就是一張真的 <img>，長按就能存。
 *
 * navigator.share 要在點擊的當下呼叫（使用者手勢），所以圖先畫好放著，按下去不再等。
 */
export type ShareCardInput = Omit<ResultCardData, 'qr' | 'font' | 'text'> & {
  /** 「連線對戰」「單人對戰 · 二級」 */
  modeLabel: string;
};

const LAYOUTS: { id: CardLayout; label: string }[] = [
  { id: 'poster', label: '4:5' },
  { id: 'square', label: '1:1' },
  { id: 'story', label: '9:16' },
];

const SITE = process.env.SITE_URL || 'https://quoridorgame.com';

export default function ShareCardModal({ isOpen, onClose, input }: {
  isOpen: boolean;
  onClose: () => void;
  input: ShareCardInput;
}) {
  const g = useGameText();
  const t = useMessages();
  const locale = useLocale();
  const [layout, setLayout] = useState<CardLayout>('poster');
  const [img, setImg] = useState<{ url: string; file: File; key: string } | null>(null);

  const winners = input.winners;
  const isDraw = !winners.length || winners[0] === 'draw';
  const winnerKeys = isDraw ? [] : (winners as PlayerKey[]);
  const title = isDraw
    ? g.champion.draw
    : fmt(g.champion.win, { names: winnerKeys.map((w) => g.players[w]).join(g.players.and) });
  const solo = !isDraw && winnerKeys.length === 1 ? winnerKeys[0] : null;

  // 這張圖要畫什麼。字串化當作 key：同樣的內容不重畫
  const card = useMemo(() => ({
    ...input,
    text: {
      kicker: `${g.champion.matchOver} · ${input.modeLabel}`,
      title,
      players: g.players,
      squares: g.champion.squares,
      brand: g.share.shareTitle,
      from: fmt(g.share.cardFrom, { show: t.meta.showName }),
      cta: g.share.cardCta,
      host: new URL(SITE).host,
    },
  }), [input, g, t, title]);
  const key = `${layout}|${JSON.stringify({ ...card, state: card.state.turns.length })}`;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      // QR 的網址：首頁，帶 utm 讓 GA 認得出是從分享圖來的（首頁的 canonical 會指回乾淨的網址）
      const url = `${SITE}${localePath(locale, '/')}?utm_source=result_card&utm_medium=share`;
      const [{ encode }] = await Promise.all([import('uqr')]);
      const qr = encode(url, { ecc: 'M', border: 0 }).data;
      // 字型跟頁面同一套。canvas 不會自己等字型下載完，先要求載入粗、中兩種字重
      const font = getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
      await Promise.all([
        document.fonts.load(`900 40px ${font}`, card.text.title + card.text.brand),
        document.fonts.load(`700 40px ${font}`, card.text.from + card.text.cta),
      ]).catch(() => {});
      const canvas = drawResultCard({ ...card, qr, font }, layout);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (cancelled || !blob) return;
      const file = new File([blob], `wall-go-${layout}.png`, { type: 'image/png' });
      setImg((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { url: URL.createObjectURL(blob), file, key };
      });
    })();
    return () => { cancelled = true; };
    // key 已經涵蓋 card 與 layout 的內容
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, key, locale]);

  const ready = img?.key === key ? img : null;
  const canShareFile = !!ready && typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [ready.file] });

  const save = () => {
    if (!ready) return;
    const a = document.createElement('a');
    a.href = ready.url;
    a.download = ready.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    track('share', { method: 'download', content_type: 'result_card', item_id: layout });
  };

  const shareFile = async () => {
    if (!ready) return;
    try {
      await navigator.share({ files: [ready.file], title: g.share.shareTitle });
      track('share', { method: 'native', content_type: 'result_card', item_id: layout });
    } catch (err) {
      // 使用者在面板上取消不是錯誤；其他失敗（權限、App 內建瀏覽器）就退回存檔
      if (!(err instanceof DOMException && err.name === 'AbortError')) save();
    }
  };

  const ratio = layout === 'story' ? 'aspect-[9/16]' : layout === 'square' ? 'aspect-square' : 'aspect-[4/5]';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={g.share.card}
      icon={LuShare2}
      kicker={g.share.cardKicker}
      // 跟結算同一個色帶：這是結算的延伸
      band={solo
        ? { style: { backgroundColor: playerVar(solo) }, fg: PLAYER_ON[solo] }
        : { className: 'bg-tile-ink', fg: 'text-tile-cream' }}
      footer={
        <div className="flex w-full gap-3">
          {canShareFile && (
            <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={save} disabled={!ready}>{g.share.save}</Button>
          )}
          <Button handleClickEvent={canShareFile ? shareFile : save} disabled={!ready}>
            {canShareFile ? g.share.shareImage : g.share.save}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-3">
        {/* 比例：一組並列的選項不各帶色相（全站規則），選中的是深墨 */}
        <div role="radiogroup" aria-label={g.share.cardFormat} className="flex gap-1 rounded-full bg-tile-ink/[0.07] p-1">
          {LAYOUTS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={layout === id}
              onClick={() => setLayout(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-black tabular-nums transition ${
                layout === id ? 'bg-tile-ink text-tile-cream' : 'text-ink-soft hover:text-tile-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* 預覽就是那張圖本身 —— 長按可以直接存（App 內建瀏覽器的退路） */}
        <div className={`relative max-h-[46dvh] max-w-full overflow-hidden rounded-xl bg-tile-ink/[0.05] ${ratio}`} style={{ height: '46dvh' }}>
          {ready ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ready.url} alt={title} className="size-full object-contain" />
          ) : (
            <div className="size-full animate-pulse" />
          )}
        </div>
        <p className="text-xs font-bold text-ink-soft">{g.share.holdToSave}</p>
      </div>
    </Modal>
  );
}
