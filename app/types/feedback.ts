/**
 * 一則玩家回饋。
 *
 * `wgf` 是關鍵：每一則回饋都自帶那一局的完整棋譜，可以直接重播出送出時
 * 的盤面。「我遇到一個很怪的狀況」不必再請對方描述，重播就看得到。
 */
export type Feedback = {
  rating: 1 | 2 | 3;
  message: string;
  /** 選填。想被回覆的人才留。 */
  contact?: string;
  wgf: string;
  mode: 'local' | 'online' | 'ai';
  playersNum: number;
  result: string;
  /**
   * 這局是怎麼結束的。
   *
   * `wgf` 是使用者按下「給點意見」當下的盤面，而投降不會寫進棋譜
   * （投降不是一手棋）—— 所以光看棋譜會是一局「還沒下完」卻有 result 的
   * 紀錄，讀的人得自己推敲。這個欄位把它講明白。
   *
   * natural：照規則下完　resign：有人投降　unfinished：還沒結束就送出
   */
  ended: 'natural' | 'resign' | 'unfinished';
  ua: string;
  viewport: string;
};

/**
 * 首頁「聯絡我們」送出的留言。跟對局回饋存在同一個 feedback 底下，
 * 以 mode: 'contact' 區分 —— 沒有棋譜、沒有結果，評分選填。
 */
export type ContactMessage = {
  rating?: 1 | 2 | 3;
  message: string;
  contact?: string;
  ua: string;
  viewport: string;
};
