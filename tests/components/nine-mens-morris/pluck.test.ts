import { describe, expect, it } from 'vitest';
import { BOARD_W, FRAME_INSET, MAN_FOOT, MAN_HEAD, MAN_SCALE, MAN_SIZE, MAN_TOP, SPOT_Y, TRAY_BOX, TRAY_Y, gx, gy, trayTurn, trayX } from '@/components/nine-mens-morris/art';
import { HAND_REACH, PLUCK_AT, handFrom, handSleeve, pluckPlan, standingGrip, trayGrip } from '@/components/nine-mens-morris/pluck';
import { COORDS, type Side } from '@/games/nine-mens-morris/engine';

const xy = (s: unknown) => {
  const [x, y] = String(s).split(' ').map((v) => parseFloat(v));
  return { x, y };
};

describe('九子棋的棋子站在交叉點上', () => {
  it('小人的腳底剛好落在點的按鈕裡的交叉點（不是方框正中間對準交叉點）', () => {
    expect(MAN_TOP + MAN_FOOT * MAN_SCALE).toBeCloseTo(SPOT_Y, 10);
  });

  it('最上面一排小人的頭不會頂出棋盤邊的木條，被拿掉的子躺在最下面一排的下方', () => {
    expect(gy(0) - MAN_FOOT * MAN_SIZE).toBeGreaterThan(FRAME_INSET);
    expect(TRAY_Y - TRAY_BOX / 2).toBeGreaterThan(gy(6));
  });
});

describe('九子棋拿子的那隻手', () => {
  const board = { left: 20, width: 350 };
  const viewport = 390;
  const u = board.width / BOARD_W;

  it('拿白子的是黑方、從右邊來；拿黑子的是白方、從左邊來', () => {
    expect(handFrom('white')).toBe('right');
    expect(handSleeve('white')).toBe('gold');
    expect(handFrom('black')).toBe('left');
    expect(handSleeve('black')).toBe('red');
  });

  it('捏的是站著那顆的頭；躺下之後頭朝棋盤外，跟下方那一格真正的子的頭同一個位置', () => {
    const at = 12;
    const g = standingGrip(at);
    expect(g.x).toBeCloseTo(gx(COORDS[at].x));
    expect(g.y).toBeCloseTo(gy(COORDS[at].y) - (MAN_FOOT - MAN_HEAD.y / 100) * MAN_SIZE);
    for (const side of ['black', 'white'] as Side[]) {
      // 下方那一格的子是以方框中心轉 trayTurn：頭（方框中心上方）轉到中心的左邊或右邊
      const above = (0.5 - MAN_HEAD.y / 100) * TRAY_BOX;
      const head = { x: trayX(side, 2) + Math.sin((trayTurn(side) * Math.PI) / 180) * above, y: TRAY_Y - Math.cos((trayTurn(side) * Math.PI) / 180) * above };
      expect(trayGrip(side, 2).x).toBeCloseTo(head.x);
      expect(trayGrip(side, 2).y).toBeCloseTo(head.y);
    }
  });

  for (const side of ['black', 'white'] as Side[]) {
    it(`手從畫面外整隻伸進來、最後整隻退出去（拿${side === 'white' ? '白' : '黑'}子）`, () => {
      const plan = pluckPlan({ at: 4, side, slot: 0, board, viewport });
      const reach = (HAND_REACH / 100) * MAN_SIZE * u;
      for (const k of [plan.hand[0], plan.hand[plan.hand.length - 1]]) {
        const onScreen = board.left + xy(k.translate).x;
        if (handFrom(side) === 'right') expect(onScreen - reach).toBeGreaterThanOrEqual(viewport);
        else expect(onScreen + reach).toBeLessThanOrEqual(0);
      }
    });

    it(`捏住到放下：手與替身走同一條路，頭一直在手指之間（拿${side === 'white' ? '白' : '黑'}子）`, () => {
      const at = 7;
      const plan = pluckPlan({ at, side, slot: 3, board, viewport });
      const P = standingGrip(at);
      const between = plan.hand.filter((k) => (k.offset as number) >= PLUCK_AT.grip && (k.offset as number) <= PLUCK_AT.set);
      expect(between.length).toBeGreaterThanOrEqual(4);
      for (const k of between) {
        const piece = plan.piece.find((q) => q.offset === k.offset);
        expect(piece).toBeDefined();
        expect(piece!.easing).toBe(k.easing);
        const h = xy(k.translate), p = xy(piece!.translate);
        expect(p.x + P.x * u).toBeCloseTo(h.x, 6);
        expect(p.y + P.y * u).toBeCloseTo(h.y, 6);
      }
      // 放下的那一刻：手在下方那一格的頭上，替身已經躺平、縮成那一格的大小
      const set = plan.hand.find((k) => k.offset === PLUCK_AT.set)!;
      const S = trayGrip(side, 3);
      expect(xy(set.translate).x).toBeCloseTo(S.x * u, 6);
      expect(xy(set.translate).y).toBeCloseTo(S.y * u, 6);
      const laid = plan.piece.find((k) => k.offset === PLUCK_AT.set)!;
      expect(laid.rotate).toBe(`${trayTurn(side)}deg`);
      expect(parseFloat(String(laid.scale))).toBeCloseTo(TRAY_BOX / MAN_SIZE, 6);
    });
  }

  it('手指張開才換回真的子：替身與下方那一格在同一刻交棒，不會兩顆都在或都不在', () => {
    const plan = pluckPlan({ at: 0, side: 'black', slot: 1, board, viewport });
    const gone = plan.piece.filter((k) => k.opacity === 0).map((k) => k.offset as number);
    const shown = plan.tray.filter((k) => k.opacity === 1).map((k) => k.offset as number);
    expect(Math.min(...gone)).toBe(PLUCK_AT.release);
    expect(Math.min(...shown)).toBe(PLUCK_AT.release);
  });
});
