/**
 * App shell: AppContext provider, global viewer state, GA, modals.
 *
 * Key exports: AppContext, default MyApp (withTranslation).
 * State: navIndex, fullscreen, sidebar, search/help modals, ranking fetch.
 * Related: EmakiConteiner.js (consumer), measurementUtils.js (events).
 * Edit targeted blocks only — do not split this file without a plan.
 */
import BottomNavigation from "@/components/navigation/BottomNavigation";
import { resetScrollPositionStore } from "@/components/emaki/layout/EmakiConteiner";
import ModalSearch from "@/components/search/ModalSearch";
import * as gtag from "@/libs/api/gtag";
import { initEngagementTracking } from "@/libs/api/measurementUtils";
import ExtractingListData from "@/utils/ExtractingListData";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";
import { useLocaleData } from "@/hooks/useLocale";
import useEmakiFullscreen from "@/hooks/useEmakiFullscreen";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Head from "next/head";
import { useRouter } from "next/router";
import Script from "next/script";
import { AppContext } from "@/context/AppContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import "../styles/globals.css";
import { appWithTranslation } from "next-i18next";

config.autoAddCss = false;

export { AppContext };

function MyApp({ Component, pageProps, router }) {
  const removeNestedArrayObj = ExtractingListData();

  // Chakra UI のデフォルトの CSSReset を無効化
  const theme = extendTheme({
    styles: {
      global: {
        // デフォルトリセットを上書きする
        "*, *::before, *::after": {
          boxSizing: "border-box",
          margin: 0,
          padding: 0,
          fontFamily: "inherit",
        },
        body: {
          margin: 0,
        },
        img: {
          maxWidth: "none", // Chakra UI のデフォルトスタイルを無効化
          height: "auto", // 必要に応じて変更
        },
      },
    },
  });

  // ページ遷移を認識させるコード
  // https://zenn.dev/rh820/articles/8af90011c573fe
  const gRouter = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageView(url);
    };

    gRouter.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      gRouter.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [gRouter.events]);

  // セッション鑑賞サマリー: beforeunload/visibilitychange リスナー登録
  useEffect(() => {
    initEngagementTracking();
  }, []);

  const { t: emakisData } = useLocaleData();
  const [characterToggle, setCharacterToggle] = useState(false);
  const [ebikiToggle, setEbikiToggle] = useState(false);
  const [chapterToggle, setChapterToggle] = useState(true);
  const [oepnSidebar, setOepnSidebar] = useState(false);
  const [query, setQuery] = useState("");
  const [fliterdEmakis, setfliterdEmakis] = useState(emakisData);

  const [stickyClass, setStickyClass] = useState("");
  const [isSidebarOpen, setisSidebarOpen] = useState(false);
  // 絵巻ハイパーリンク: スクロール検出による navIndex 更新時は scrollDialog を抑制
  const isScrollDetectedUpdateRef = useRef(false);
  const [toggleBtn, setToggleBtn] = useState(true);
  const [hash, setHash] = useState(0);
  const [navIndex, setnavIndex] = useState(0);
  const [orientation, setOrientation] = useState("");

  // フルスクリーン制御（入/切・Fキー・ブラウザ主導の状態同期・遷移時解除）
  const {
    toggleFullscreen,
    setToggleFullscreen,
    handleFullScreen,
    isFullscreenTransitioningRef,
    exitFullscreenForNavigation,
  } = useEmakiFullscreen(navIndex);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showData, setShowdData] = useState(emakisData);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [windowHeight, setWindowHeight] = useState(0);

  const newData = data?.map((item, i) => {
    const { pathName, pageView } = item;
    const connectData = removeNestedArrayObj
      .filter((item) => item.titleen === pathName)
      .map((item) => ({ ...item, pathName, pageView }));
    if (connectData.length) {
      return connectData;
    }
  });

  function flattenAndRemoveNullAndUndefined(arr) {
    if (!Array.isArray(arr)) return []; // 配列でない場合は空の配列を返す
    return arr.flatMap((item) => {
      if (Array.isArray(item)) {
        return flattenAndRemoveNullAndUndefined(item); // 再帰的に処理
      }
      return item !== null && item !== undefined ? [item] : [];
    });
  }

  const rankingData = flattenAndRemoveNullAndUndefined(newData).slice(0, 30);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/fetchData`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      // /ja/xxx と /xxx のPVを同一スラグとして合算
      const pvMap = {};
      data.forEach((item) => {
        // ロケールプレフィックス(/ja/)を除去し、先頭の/を除去してスラグを取得
        const pathName = item.pagePath.replace(/^\/(ja\/)?/, "");
        if (!pathName || isWithdrawnScroll(pathName)) return; // "/" や "/ja" は除外
        const pv = Number(item.uniquePageviews) || 0;
        pvMap[pathName] = (pvMap[pathName] || 0) + pv;
      });

      const encodeURL = Object.entries(pvMap)
        .map(([pathName, pageView]) => ({ pathName, pageView }))
        .sort((a, b) => b.pageView - a.pageView);

      setData(encodeURL);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const openSidebar = () => {
    setisSidebarOpen(true);
    document.querySelector("html").classList.add("open");
  };
  const closeSidebar = () => {
    setisSidebarOpen(false);
    document.querySelector("html").classList.remove("open");
  };

  const openSearchModalOpen = () => {
    setIsSearchModalOpen(true);
    const clientWidth = document.body.clientWidth;
    document.querySelector("html").classList.add("open");
    const noScrollBarWidth = document.body.clientWidth;
    const diff = noScrollBarWidth - clientWidth;
    if (diff > 0) {
      document.body.style["padding-right"] = diff + "px";
    }
  };

  const closeSearchModal = () => {
    document.querySelector("html").classList.remove("open");
    setIsSearchModalOpen(false);
  };

  const openHelpModal = () => {
    setIsHelpModalOpen(true);
  };

  const closeHelpModal = () => {
    setIsHelpModalOpen(false);
  };

  useEffect(() => {
    const resetViewerStateOnNavigate = () => {
      setIsHelpModalOpen(false);

      // 別絵巻遷移前に navIndex / 横スクロール保存状態をリセット
      // （フルスクリーン復元 effect より先にクリアして競合を防ぐ）
      setnavIndex(0);
      resetScrollPositionStore();

      // フルスクリーン解除（useEmakiFullscreen が担当）
      exitFullscreenForNavigation();
    };

    gRouter.events.on("routeChangeStart", resetViewerStateOnNavigate);
    return () => {
      gRouter.events.off("routeChangeStart", resetViewerStateOnNavigate);
    };
  }, [gRouter.events, setnavIndex, exitFullscreenForNavigation]);

  const handleCharacterToggle = () => {
    setCharacterToggle(!characterToggle);
  };

  const handleEbikiToggle = () => {
    setEbikiToggle(!ebikiToggle);
  };

  const handleChapterToggle = () => {
    setChapterToggle(!chapterToggle);
  };

  // スクロール実行を統合した handleToId
  // ボタン操作・hash指定など、すべての「意図的なスクロール」はこの関数を経由する
  const handleToId = useCallback((id) => {
    flushSync(() => {
      setnavIndex(id);
    });

    // スクロール実行（scrollDialogから責務を移管）
    // フルスクリーン切り替え中は抑制（既存仕様を維持）
    if (isFullscreenTransitioningRef.current) return;

    requestAnimationFrame(() => {
      // フルスクリーン切り替え中なら再度チェック
      if (isFullscreenTransitioningRef.current) return;

      // DOM から対象セクションを検索
      const targetSection = document.querySelector(`section[id="${id}"]`);
      if (!targetSection) return;

      const scrollContainer = targetSection.closest("article");
      if (!scrollContainer) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const nodeRect = targetSection.getBoundingClientRect();

      // RTL環境: ノードの右端をコンテナの右端に合わせる
      const scrollLeft =
        scrollContainer.scrollLeft + (nodeRect.right - containerRect.right);

      scrollContainer.scrollTo({ left: scrollLeft, behavior: "smooth" });
    });
  }, [setnavIndex]);

  // scrollDialog: スクロール実行は handleToId に統合したため無効化
  // ref callback としての機能は維持（他コンポーネントでの参照互換性のため）
  const scrollDialog = useCallback((node) => {
    // 何もしない（スクロール実行は handleToId が担当）
  }, []);

  useEffect(() => {
    // クエリーリストを作成する。
    const mediaQueryList = window.matchMedia("(orientation: portrait)");

    // イベントリスナーのコールバック関数を定義する。
    function handleOrientationChange(evt) {
      // 向き切替でビューアのレイアウト方式（sticky⇔通常フロー）が変わるため、
      // 縦スクロール位置を先頭に戻す（残ったままだと landscape でビューアが画面外になる）
      window.scrollTo({ top: 0, behavior: "instant" });
      if (evt.matches) {
        /* 現在ビューポートが縦長 */
        setOrientation("portrait");
        const fetchHashflag = () => {
          const hashflag = Number(gRouter.asPath.split("#")[1]);
          if (hashflag) {
            handleToId(hashflag);
          }
        };
        fetchHashflag();
      } else {
        /* 現在ビューポートが横長 */
        setOrientation("landscape");
        // ハッシュフラグを取得し、stringからnumbarに変換

        // レンダリング完了時に発火
        const fetchHashflag = () => {
          const hashflag = Number(gRouter.asPath.split("#")[1]);
          if (hashflag) {
            handleToId(hashflag);
          }
        };
        fetchHashflag();
      }
    }

    // 向き変更時のハンドラーを一度実行する。
    handleOrientationChange(mediaQueryList);

    // コールバック関数をリスナーとしてクエリーリストに追加する。
    mediaQueryList.addEventListener("change", handleOrientationChange);

    return () => {
      mediaQueryList.removeEventListener("change", handleOrientationChange);
    };
  }, [setnavIndex, gRouter.asPath, handleToId]);

  // 絵巻ハイパーリンク: navIndex変更時にURLのhashを更新
  // replaceStateを使用して履歴を汚さない（戻るボタンが正常に機能）
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 絵巻ページ（/[slug]）でのみhashを更新
    // トップページや他のページでは更新しない
    const isEmakiPage = gRouter.pathname === "/[slug]";
    if (!isEmakiPage) return;

    const basePath = window.location.pathname;
    if (navIndex > 0) {
      const newUrl = `${basePath}#${navIndex}`;
      window.history.replaceState(null, "", newUrl);
    } else {
      // navIndex === 0 のときはhashを削除
      window.history.replaceState(null, "", basePath);
    }
  }, [navIndex, gRouter.pathname]);

  useEffect(() => {
    const stickNavbar = () => {
      let windowHeight = window.scrollY;
      windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
    };
    window.addEventListener("scroll", stickNavbar);
  }, [setStickyClass]);

  // ウィンドウの高さを取得
  useEffect(() => {
    const updateHeight = () => {
      setWindowHeight(window.innerHeight);
    };

    updateHeight(); // 初期高さを設定
    window.addEventListener("resize", updateHeight); // ウィンドウリサイズ時に高さを更新

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <>
      {/* viewport meta: モバイルブラウザ対応 + ノッチ端末の safe-area 有効化 */}
      {/* _app.js で next/head を使用することで Next.js のデフォルト viewport を確実に上書き */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
      </Head>
      <AppContext.Provider
        value={{
        oepnSidebar,
        setOepnSidebar,
        query,
        setQuery,
        fliterdEmakis,
        setfliterdEmakis,
        stickyClass,
        setStickyClass,
        isSidebarOpen,
        openSidebar,
        closeSidebar,
        handleFullScreen,
        toggleFullscreen,
        setToggleFullscreen,
        toggleBtn,
        setToggleBtn,
        hash,
        setHash,
        navIndex,
        setnavIndex,
        scrollDialog,
        isScrollDetectedUpdateRef,
        orientation,
        setOrientation,
        handleToId,
        handleCharacterToggle,
        characterToggle,
        handleEbikiToggle,
        ebikiToggle,
        handleChapterToggle,
        chapterToggle,
        searchKeyword,
        setSearchKeyword,
        showData,
        setShowdData,
        isSearchModalOpen,
        openSearchModalOpen,
        closeSearchModal,
        loading,
        rankingData,
        windowHeight,
        isHelpModalOpen,
        openHelpModal,
        closeHelpModal,
      }}
    >
      {/* google analytics */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=G-4115JJFY0B${gtag.GA_MEASURAMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', '${gtag.GA_MEASURAMENT_ID}');
          `}
      </Script>
      <ChakraProvider theme={theme}>
        <div className="site-shell">
          <Component {...pageProps} />
        </div>
        {isSearchModalOpen && <ModalSearch />}
        <BottomNavigation />
      </ChakraProvider>
    </AppContext.Provider>
    </>
  );
}

export default appWithTranslation(MyApp);
