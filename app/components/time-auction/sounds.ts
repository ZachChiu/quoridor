import { playSynth, type Synth } from '@/utils/sound';

/**
 * 時間拍賣的音效：維多利亞時代的拍賣行 —— 拍賣官的木槌、櫃檯上的叫人鈴、懷錶與座鐘的滴答、手搖鈴。
 * Zach 10/24：每一款都要有自己的聲音（「各自設計符合各自」），不是 Wall Go 的木頭聲、也不是虎羊棋的木魚。
 * 全部用 Web Audio 當場合成（utils/sound.ts 的 playSynth），沒有音檔、不用節目的配樂；開關跟全站共用（useSound）。
 *
 * 配方（零件見 utils/sound.ts：tone 是有起音與衰減的單音、noise 是濾過的雜音、knock 是帶通雜音的「喀」）：
 * - tick   倒數的每一秒：懷錶的擒縱 —— 高通雜音的極短「嗒」，疊一點很高的正弦
 * - go     倒數結束、開始計時：櫃檯叫人鈴的「叮」—— 1760 Hz 加上 2.32、4.1 倍的不諧和泛音（小鈴的音色），前面一下金屬的撞擊
 * - second 跑秒中的每一整秒：座鐘的滴、答（兩個音高輪流）。你已經放手、只是在等別人時小聲一半
 * - release 放手：按鈕彈起來的「喀」
 * - pass   這回合不參加：一張紙滑過去（寬頻帶通雜音、很輕）
 * - popped 時間用完、按鈕自己彈起：悶的「咚」往下滑（節目裡按鈕會震動，手機另外震一下）
 * - sold   有人得標：木槌敲在響板上 —— 高頻帶通的「啪」＋中頻的木頭身體＋往下滑的三角波「咚」
 * - soldYou 你得標：同一聲木槌，接著一枚金幣落下（不諧和的高頻泛音、再彈一下）
 * - noSale 流標（同秒、全員放棄）：木槌輕敲講台兩下，沒有響板的亮聲
 * - win    拍賣結束、你第一：木槌落下，再搖三下手搖鈴（基音＋2、3、4.2 倍泛音），最後一下拖長
 * - lose   沒拿第一：同一個鈴低低地敲兩下（往下）
 */
export type TauSound = 'tick' | 'go' | 'second' | 'release' | 'pass' | 'popped' | 'sold' | 'soldYou' | 'noSale' | 'win' | 'lose';

/** 拍賣官的木槌敲在響板上 */
function gavel(s: Synth, at: number, vol = 1) {
  s.knock(at, 2200, 0.035, 1.3 * vol);
  s.noise(at, 0.09, 0.9 * vol, 'bandpass', 700, 2, 3);
  s.tone(at, 180, 0.14, 0.32 * vol, 'triangle', 115);
}

/** 一聲手搖鈴（黃銅）：基音加幾個泛音，高的先消失 */
function bell(s: Synth, at: number, f: number, vol: number, len = 1.2) {
  s.tone(at, f, len, vol);
  s.tone(at, f * 2, len * 0.6, vol * 0.35);
  s.tone(at, f * 3, len * 0.4, vol * 0.22);
  s.tone(at, f * 4.2, len * 0.2, vol * 0.1);
}

/** 一枚金幣落在桌上：幾個不成和聲的高音，很快就沒了 */
function coin(s: Synth, at: number, vol: number) {
  s.tone(at, 2960, 0.45, vol);
  s.tone(at, 4570, 0.3, vol * 0.6);
  s.tone(at, 6720, 0.18, vol * 0.35);
  s.knock(at, 6000, 0.012, 0.4 * vol * 5);
}

export function playTau(name: TauSound, o: { soft?: boolean; odd?: boolean } = {}) {
  playSynth((s) => {
    const { t } = s;
    switch (name) {
      case 'tick':
        s.noise(t, 0.018, 0.9, 'highpass', 3500, 0.8, 4);
        s.tone(t, 2400, 0.03, 0.05);
        break;
      case 'go':
        s.knock(t, 5000, 0.012, 0.5);
        s.tone(t, 1760, 0.9, 0.11);
        s.tone(t, 1760 * 2.32, 0.5, 0.045);
        s.tone(t, 1760 * 4.1, 0.25, 0.02);
        break;
      case 'second': {
        const v = o.soft ? 0.5 : 1;
        s.knock(t, o.odd ? 1500 : 1900, 0.025, 0.32 * v);
        s.tone(t, o.odd ? 750 : 950, 0.03, 0.035 * v);
        break;
      }
      case 'release':
        s.knock(t, 2600, 0.03, 0.6);
        s.tone(t, 520, 0.05, 0.08, 'triangle');
        break;
      case 'pass':
        s.noise(t, 0.09, 0.35, 'bandpass', 2800, 0.6, 1.5);
        break;
      case 'popped':
        s.knock(t, 400, 0.08, 0.8);
        s.tone(t, 140, 0.26, 0.3, 'triangle', 85);
        break;
      case 'sold': gavel(s, t); break;
      case 'soldYou':
        gavel(s, t);
        coin(s, t + 0.42, 0.07);
        coin(s, t + 0.55, 0.035);
        break;
      case 'noSale':
        s.knock(t, 620, 0.05, 0.6);
        s.tone(t, 130, 0.08, 0.12, 'triangle');
        s.knock(t + 0.15, 500, 0.05, 0.5);
        s.tone(t + 0.15, 115, 0.08, 0.1, 'triangle');
        break;
      case 'win':
        gavel(s, t);
        bell(s, t + 0.3, 1318.5, 0.1, 0.7);
        bell(s, t + 0.52, 1318.5, 0.1, 0.7);
        bell(s, t + 0.74, 1318.5, 0.11, 1.6);
        break;
      case 'lose':
        bell(s, t, 659.3, 0.09, 1.1);
        bell(s, t + 0.42, 523.3, 0.08, 1.5);
        break;
    }
  });
}
