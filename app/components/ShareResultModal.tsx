'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LuX } from 'react-icons/lu';
import Modal from './Modal';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { CARD_SIZE, renderCard, type CardLayout, type ShareAssets, type ShareDraw } from '@/utils/shareCard';

/**
 * 各遊戲自己的結算：**結算畫面就是分享圖本身**，跟 Wall Go 的 ChampionModal 同一個做法
 * （Zach 10/23 選的 A：圖浮在暗下來的遮罩上，比例切換在上、按鈕在下），但圖由那款遊戲自己畫（draw）、
 * 按鈕與切換的顏色由那款自己給（classes）—— Zach 10/24：「結尾的可分享畫面…然後各自設計符合各自」。
 *
 * 分享：瀏覽器能分享檔案就叫系統分享面板，不行就存檔；預覽本身是一張真的 <img>，App 內建瀏覽器裡長按就能存。
 * navigator.share 要在點擊的當下呼叫（使用者手勢），所以圖先畫好放著，按下去不再等。
 */

const SITE = process.env.SITE_URL || 'https://quoridorgame.com';

/** 每款預設三種比例都給；只給一種就不顯示切換 */
const ALL_LAYOUTS: CardLayout[] = ['story', 'poster', 'square'];
const LAYOUTS: { id: CardLayout; label: string }[] = [
  { id: 'story', label: '9:16' },
  { id: 'poster', label: '4:5' },
  { id: 'square', label: '1:1' },
];

export type ShareCardOptions = {
  isOpen: boolean;
  draw: ShareDraw;
  /** 內容一樣就不重畫：把會畫上去的東西字串化傳進來 */
  contentKey: string;
  /** 存檔的檔名開頭，例如 bagh-chal → bagh-chal-story.png */
  fileName: string;
  /** QR 掃了要去的站內路徑（已經套好語系），會加上 utm */
  homePath: string;
  /** 那款遊戲的 id，放進 utm_campaign，GA 才分得出是哪一款的分享圖 */
  campaign: string;
  /** 畫之前要先載好的字型（CSS font 簡寫，例如 `900 40px "Grenze Gotisch"`）與要用到的字 */
  fonts?: { font: string; text: string }[];
  /** 畫之前要先載好的圖（public/ 底下的路徑），照順序交給 draw 的 assets.images */
  images?: string[];
  /** 這款給哪幾種比例，第一個是預設；只給一種就拿掉比例切換（尼泊爾虎棋只留 9:16，Zach 10/24） */
  layouts?: CardLayout[];
};

export function useShareCard({ isOpen, draw, contentKey, fileName, homePath, campaign, fonts = [], images = [], layouts = ALL_LAYOUTS }: ShareCardOptions) {
  const [layout, setLayout] = useState<CardLayout>(layouts[0]);
  // file：存檔、分享用的原尺寸；url：畫面上的預覽（照預覽框的大小另外畫一張）
  const [img, setImg] = useState<{ url: string; file: File; key: string } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const key = `${layout}|${contentKey}`;
  // draw 每次 render 都是新的函式，用 ref 拿最新的那個，不必放進 effect 的相依
  const drawRef = useRef(draw);
  useLayoutEffect(() => { drawRef.current = draw; });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      const url = `${SITE}${homePath}?utm_source=result_card&utm_medium=share&utm_campaign=${campaign}`;
      const load = (src: string) => {
        const im = new Image();
        im.src = src;
        return im.decode().then(() => im, () => undefined);
      };
      const [{ encode }, icon, loaded] = await Promise.all([
        import('uqr'),
        load('/icon-192.png'),
        Promise.all(images.map(load)),
        // canvas 不會自己等字型下載完
        Promise.all(fonts.map((f) => document.fonts.load(f.font, f.text))).catch(() => {}),
      ]);
      const assets: ShareAssets = { qr: encode(url, { ecc: 'M', border: 0 }).data, icon, images: loaded };
      const full = renderCard(drawRef.current, layout, assets);
      // 預覽：畫成「預覽框實際的像素寬 × 1.5」，瀏覽器只需要縮 1.5 倍以內，細線才不會斷斷續續
      const shown = box.current?.getBoundingClientRect().width || 300;
      const scale = Math.min(1, (shown * (window.devicePixelRatio || 1) * 1.5) / CARD_SIZE[layout].w);
      const preview = scale < 1 ? renderCard(drawRef.current, layout, assets, scale) : full;
      const toBlob = (c: HTMLCanvasElement) => new Promise<Blob | null>((r) => c.toBlob(r, 'image/png'));
      const [blob, previewBlob] = await Promise.all([toBlob(full), preview === full ? null : toBlob(preview)]);
      if (cancelled || !blob) return;
      const file = new File([blob], `${fileName}-${layout}.png`, { type: 'image/png' });
      setImg((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return { url: URL.createObjectURL(previewBlob ?? blob), file, key };
      });
    })();
    return () => { cancelled = true; };
    // key 已經涵蓋內容與比例
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, key, homePath]);

  const ready = img?.key === key ? img : null;
  const canShareFile = !!ready && typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [ready.file] });

  const save = () => {
    if (!ready) return;
    const url = URL.createObjectURL(ready.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = ready.file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const shareFile = async (title: string) => {
    if (!ready) return;
    try {
      await navigator.share({ files: [ready.file], title });
    } catch (err) {
      // 使用者在面板上取消不是錯誤；其他失敗（權限、App 內建瀏覽器）就退回存檔
      if (!(err instanceof DOMException && err.name === 'AbortError')) save();
    }
  };

  return { layout, setLayout, layouts, box, ready, canShareFile, save, shareFile };
}

/*
  圖的高度：受「畫面高度扣掉上下的切換與按鈕」與「畫面寬度 × 比例」兩邊限制，再加一個上限（跟 ChampionModal 一樣）。
  手機橫放（short）：圖在左、右邊一欄 13rem 放切換與按鈕。
*/
const SIZE: Record<CardLayout, string> = {
  story: 'h-[min(calc(100dvh_-_11.5rem),calc((100vw_-_2rem)*16/9),720px)] short:h-[calc(100dvh_-_2rem)]',
  poster: 'h-[min(calc(100dvh_-_11.5rem),calc((100vw_-_2rem)*5/4),640px)] short:h-[min(calc(100dvh_-_2rem),calc((100vw_-_16.25rem)*5/4))]',
  square: 'h-[min(calc(100dvh_-_11.5rem),calc(100vw_-_2rem),560px)] short:h-[min(calc(100dvh_-_2rem),calc(100vw_-_16.25rem))]',
};

/** 暗遮罩上的按鈕與切換的顏色，各遊戲自己給（預設是 Wall Go 那套：主要米白、次要半透明白） */
export type ShareClasses = {
  /** 主要鈕（再來一局；沒有再來一局時是分享） */
  primary: string;
  /** 次要鈕（分享） */
  secondary: string;
  /** 比例切換：外框、選中、沒選 */
  toggle: string;
  toggleOn: string;
  toggleOff: string;
  /** 按鈕的形狀（圓角、字），兩顆共用 */
  button?: string;
  /** 預覽還沒畫好時那塊的顏色 */
  placeholder?: string;
};

const DEFAULT_CLASSES: ShareClasses = {
  primary: 'bg-tile-cream text-tile-ink',
  secondary: 'bg-white/15 text-tile-cream',
  toggle: 'bg-white/15',
  toggleOn: 'bg-tile-cream text-tile-ink',
  toggleOff: 'text-tile-cream/75 hover:text-tile-cream',
  button: 'rounded-xl font-black',
  placeholder: 'bg-white/10',
};

export function ShareResultModal({
  isOpen, onClose, title, card, onRestart, restartLabel, classes, srText, frameClassName = 'rounded-2xl',
}: {
  isOpen: boolean;
  onClose: () => void;
  /** 對話框的名稱（螢幕報讀），通常就是圖上的大標「老虎贏了」 */
  title: string;
  card: ReturnType<typeof useShareCard>;
  onRestart?: () => void;
  restartLabel?: string;
  classes?: Partial<ShareClasses>;
  /** 圖上寫的東西，另外給螢幕報讀 */
  srText?: string;
  /** 預覽圖的外框（圓角、細框），各遊戲自己決定 */
  frameClassName?: string;
}) {
  const g = useGameText();
  const t = useMessages();
  const c = { ...DEFAULT_CLASSES, ...classes };
  const { layout, setLayout, layouts, box, ready, canShareFile, save, shareFile } = card;
  const shareLabel = canShareFile ? g.share.shareImage : g.share.save;
  const onShare = canShareFile ? () => shareFile(title) : save;
  const ratio = layout === 'story' ? 'aspect-[9/16]' : layout === 'square' ? 'aspect-square' : 'aspect-[4/5]';
  const btn = `flex flex-1 items-center justify-center p-3.5 text-base transition active:scale-[0.98] disabled:opacity-40 ${c.button}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} band={{ fg: '' }} bare
      backdropClassName="bg-black/85 backdrop-blur-sm" panelClassName="w-fit max-w-full">
      <div className="grid justify-items-center gap-3 short:grid-cols-[auto_13rem] short:grid-rows-[1fr_auto_auto_auto_1fr] short:gap-x-5">
        {layouts.length > 1 && <div role="radiogroup" aria-label={g.share.cardFormat} className={`flex gap-1 rounded-full p-1 short:col-start-2 short:row-start-2 ${c.toggle}`}>
          {LAYOUTS.filter(({ id }) => layouts.includes(id)).map(({ id, label }) => (
            <button key={id} type="button" role="radio" aria-checked={layout === id} onClick={() => setLayout(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-black tabular-nums transition ${layout === id ? c.toggleOn : c.toggleOff}`}>
              {label}
            </button>
          ))}
        </div>}
        <div className="relative short:col-start-1 short:row-span-5 short:row-start-1">
          <div ref={box} className={`relative shrink-0 overflow-hidden ${ratio} ${SIZE[layout]} ${frameClassName}`}>
            {ready
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={ready.url} alt={title} className="size-full object-cover" />
              : <div className={`size-full animate-pulse ${c.placeholder}`} />}
          </div>
          {/* 28px 的小圓＋線條 ✕（Zach：叉叉不要太大），手指點的範圍用 ::before 撐到 44px */}
          <button type="button" aria-label={t.ui.close} onClick={onClose}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/25 text-base text-white transition before:absolute before:-inset-2 before:content-[''] hover:bg-black/40">
            <LuX className="stroke-[3]" />
          </button>
        </div>
        <div className="flex w-0 min-w-full gap-2 short:col-start-2 short:row-start-3 short:flex-col">
          {onRestart && <button type="button" className={`${btn} ${c.secondary}`} onClick={onShare} disabled={!ready}>{shareLabel}</button>}
          {onRestart
            ? <button type="button" className={`${btn} ${c.primary}`} onClick={onRestart}>{restartLabel}</button>
            : <button type="button" className={`${btn} ${c.primary}`} onClick={onShare} disabled={!ready}>{shareLabel}</button>}
        </div>
        <p className="w-0 min-w-full px-1 text-xs font-bold text-white/70 short:col-start-2 short:row-start-4">{g.share.holdToSave}</p>
      </div>
      {srText && <p className="sr-only">{srText}</p>}
    </Modal>
  );
}
