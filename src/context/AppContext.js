import { createContext } from "react";

const noop = () => {};

/**
 * Provider 未接続時（Fast Refresh 直後など Context インスタンスが分離した場合）に
 * useContext が返すデフォルト値。
 *
 * null のままだと consumers の分割代入が「Cannot destructure ... as it is null」で
 * クラッシュするため、「動作しないが安全」な値で Provider value の全キーを網羅する。
 *
 * 注意: _app.js の AppContext.Provider value にキーを追加したら、ここにも同じキーを
 * 追加すること（レンダーで読むだけの値は undefined でも無害だが、
 * 関数呼び出し・配列メソッド・ref.current に使うものは安全な初期値が必須）。
 */
const defaultAppContext = {
  // サイドバー / ヘッダー
  oepnSidebar: false,
  setOepnSidebar: noop,
  isSidebarOpen: false,
  openSidebar: noop,
  closeSidebar: noop,
  stickyClass: "",
  setStickyClass: noop,

  // 絵巻ビューア
  navIndex: 0,
  setnavIndex: noop,
  hash: 0,
  setHash: noop,
  orientation: "",
  setOrientation: noop,
  scrollDialog: noop,
  isScrollDetectedUpdateRef: { current: false },
  handleToId: noop,
  toggleFullscreen: false,
  setToggleFullscreen: noop,
  handleFullScreen: noop,
  toggleBtn: true,
  setToggleBtn: noop,
  characterToggle: false,
  handleCharacterToggle: noop,
  ebikiToggle: false,
  handleEbikiToggle: noop,
  chapterToggle: true,
  handleChapterToggle: noop,

  // 検索 / モーダル
  query: "",
  setQuery: noop,
  fliterdEmakis: [],
  setfliterdEmakis: noop,
  searchKeyword: "",
  setSearchKeyword: noop,
  showData: [],
  setShowdData: noop,
  isSearchModalOpen: false,
  openSearchModalOpen: noop,
  closeSearchModal: noop,
  isHelpModalOpen: false,
  openHelpModal: noop,
  closeHelpModal: noop,

  // ランキング / その他
  loading: false,
  rankingData: [],
  windowHeight: 0,
};

/** Shared app shell state — import from here, not from _app.js (avoids circular deps). */
export const AppContext = createContext(defaultAppContext);
