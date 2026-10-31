import { HIDE_MENU_SCRIPT } from './modeHash';

/**
 * 重整 `#blind-normal` 這類網址時，靜態 HTML 裡的選單先藏起來，不要閃一下再跳進對局
 * （同 Wall Go 的 SoloClient：layout effect 擋不住，那時 JS 還沒下載）。
 *
 * 放在 server 的頁面殼裡、不放在選單元件裡：選單在 client 端每次重新掛載（從對局回到選單）
 * 都會再建一次 <script>，React 會報「client 端建立的 script 不會執行」的錯。
 * 藏起選單的樣式由 BlindGomoku 掛載時移除。
 */
export default function HideMenuScript() {
  return <script dangerouslySetInnerHTML={{ __html: HIDE_MENU_SCRIPT }} />;
}
