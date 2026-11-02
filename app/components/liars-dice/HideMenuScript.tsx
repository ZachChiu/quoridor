import { HIDE_MENU_SCRIPT } from './modeHash';

/** 重整 `#ai-5-normal` 這類網址時，靜態 HTML 裡的選單先藏起來（同盲五子棋的 HideMenuScript，放在 server 的頁面殼裡） */
export default function HideMenuScript() {
  return <script dangerouslySetInnerHTML={{ __html: HIDE_MENU_SCRIPT }} />;
}
