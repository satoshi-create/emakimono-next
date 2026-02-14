import ContactFormGoogle from "@/components/contact/ContactFormGoogle";
import BottomNavigation from "@/components/navigation/BottomNavigation";
import ModalSearch from "@/components/search/ModalSearch";
import * as gtag from "@/libs/api/gtag";
import { trackFullscreenEnter, trackFullscreenExit } from "@/libs/api/measurementUtils";
import ExtractingListData from "@/utils/ExtractingListData";
import { useLocaleData } from "@/utils/func";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import Head from "next/head";
import { useRouter } from "next/router";
import Script from "next/script";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import "../styles/globals.css";
import { appWithTranslation } from "next-i18next";

config.autoAddCss = false;

export const AppContext = createContext();

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

  const { t: emakisData } = useLocaleData();
  const [ekotobaToggle, setekotobaToggle] = useState(false);
  const [characterToggle, setCharacterToggle] = useState(false);
  const [ebikiToggle, setEbikiToggle] = useState(false);
  const [oepnSidebar, setOepnSidebar] = useState(false);
  const [ekotobaImageToggle, setEkotobaImageToggle] = useState(true);
  const [query, setQuery] = useState("");
  const [fliterdEmakis, setfliterdEmakis] = useState(emakisData);
  const [isModalOpen, setisModalOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [MapIndex, setMapIndex] = useState(0);

  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [ContactIndex, setContactIndex] = useState(0);

  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [DescIndex, setDescIndex] = useState({});
  const [stickyClass, setStickyClass] = useState("");
  const [isSidebarOpen, setisSidebarOpen] = useState(false);
  const [toggleFullscreen, setToggleFullscreen] = useState(false);
  // P0改修: フルスクリーン切り替え中フラグ（scrollDialog抑制用）
  // useRef を使用することで、state更新を待たずに即座に値が反映される
  const isFullscreenTransitioningRef = useRef(false);
  // Step B修正: フラグ解除タイマーIDをuseRefで管理
  // useEffect再実行によるクリーンアップでタイマーがキャンセルされる問題を回避
  const fullscreenTransitionTimerRef = useRef(null);
  // 絵巻ハイパーリンク: スクロール検出による navIndex 更新時は scrollDialog を抑制
  const isScrollDetectedUpdateRef = useRef(false);
  const [toggleBtn, setToggleBtn] = useState(true);
  const [hash, setHash] = useState(0);
  const [navIndex, setnavIndex] = useState(0);
  const [orientation, setOrientation] = useState("");
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

  // const array = [undefined, [{ id: 12, title: "hoge" }], undefined];

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
        if (!pathName) return; // "/" や "/ja" は除外
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

  const openModal = (i) => {
    setisModalOpen(true);
    setIndex(i);
  };

  const closeModal = () => {
    setisModalOpen(false);
  };

  const handleChapter = (index) => {
    handleToId(index);
    closeModal();
  };

  const openMapModal = (i) => {
    setIsMapModalOpen(true);
    const clientWidth = document.body.clientWidth;
    document.querySelector("html").classList.add("open");
    const noScrollBarWidth = document.body.clientWidth;
    const diff = noScrollBarWidth - clientWidth;
    if (diff > 0) {
      document.body.style["padding-right"] = diff + "px";
    }
    setMapIndex(i);
  };

  const closeMapModal = () => {
    document.querySelector("html").classList.remove("open");
    setIsMapModalOpen(false);
  };
  const openContactModal = (i) => {
    setIsContactModalOpen(true);
    const clientWidth = document.body.clientWidth;
    document.querySelector("html").classList.add("open");
    const noScrollBarWidth = document.body.clientWidth;
    const diff = noScrollBarWidth - clientWidth;
    if (diff > 0) {
      document.body.style["padding-right"] = diff + "px";
    }
    setContactIndex(i);
  };

  const closeContactModal = () => {
    document.querySelector("html").classList.remove("open");
    setIsContactModalOpen(false);
  };

  const openDescModal = (ei, i) => {
    setIsDescModalOpen(true);
    const clientWidth = document.body.clientWidth;
    document.querySelector("html").classList.add("open");
    const noScrollBarWidth = document.body.clientWidth;
    const diff = noScrollBarWidth - clientWidth;
    if (diff > 0) {
      document.body.style["padding-right"] = diff + "px";
    }
    setDescIndex(ei, i);
  };
  const closeDescModal = () => {
    document.querySelector("html").classList.remove("open");
    setIsDescModalOpen(false);
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

  const handleEkotobaImageToggle = () => {
    setEkotobaImageToggle(!ekotobaImageToggle);
    setekotobaToggle(false);
  };
  const handleCharacterToggle = () => {
    setCharacterToggle(!characterToggle);
  };

  const handleEbikiToggle = () => {
    setEbikiToggle(!ebikiToggle);
  };

  // const handleFullScreen = (orientation) => {
  //   setToggleBtn(false);

  //   // if (toggleFullscreen) {
  //   let de = document.documentElement;

  //   // if (de.requestFullscreen) {
  //   //   de.requestFullscreen();
  //   // } else if (de.mozRequestFullscreen) {
  //   //   de.mozRequestFullscreen();
  //   // } else if (de.webkitRequestFullscreen) {
  //   //   de.webkitRequestFullscreen();
  //   // } else if (de.msRequestFullscreen) {
  //   //   de.msRequestFullscreen();
  //   // }

  //   // 要素を全画面表示するための非同期的な要求を発行;
  //   if (!document.fullscreenElement) {
  //     de.requestFullscreen()
  //       .then(() => {
  //         console.log("enter fullscreen");
  //         console.log(navIndex);
  //         setToggleFullscreen(true);
  //       })
  //       .catch((err) => {
  //         console.log(`Error attempting to enable fullscreen mode ${err})`);
  //       });

  //     screen.orientation
  //       .lock(orientation)
  //       .then(() => {
  //         console.log("Success lock orientation");
  //         // hashを置き換え
  //         // const pathAndSlug = router.asPath.split("#")[0];
  //         // const newPath = `${pathAndSlug}#5`;
  //         // window.location.replace(newPath);
  //         // console.log(newPath);
  //         // if (hash) {
  //         //   setnavIndex(hash);
  //         // }
  //       })
  //       .catch((error) => {
  //         console.log(`Error lock orientation ${error}`);
  //         // hashを置き換え
  //         // const pathAndSlug = router.asPath.split("#")[0];
  //         // const newPath = `${pathAndSlug}#5`;
  //         // window.location.replace(newPath);
  //         // if (hash) {
  //         //   setnavIndex(hash);
  //         // }
  //       });
  //   } else {
  //     // Document: exitFullscreen() メソッド
  //     // https://developer.mozilla.org/ja/docs/Web/API/Document/exitFullscreen
  //     if (document.fullscreenElement) {
  //       document.exitFullscreen().then(() => {
  //         setToggleFullscreen(false);
  //         console.log(`exit fullscreen`);
  //         console.log(navIndex);
  //       });
  //     }
  //     // setToggleFullscreen(false);
  //     // // / 要素を横向きに固定（モバイルデバイスで、ブラウザーがフルスクリーン表示になっているときのみ有効）
  //     // screen.orientation.unlock();
  //     // setnavIndex(10);
  //     // console.log(`exit fullscreen`);
  //     // console.log(navIndex);
  //   }
  // };

  //   else {
  //     screen.orientation.unlock();

  //     if (document.exitFullscreen) {
  //       document.exitFullscreen();
  //     } else if (document.mozExitFullscreen) {
  //       document.mozExitFullscreen();
  //     } else if (document.webkitExitFullscreen) {
  //       document.webkitExitFullscreen();
  //     } else if (document.msExitFullscreen) {
  //       document.msExitFullscreen();
  //     }

  //     if (document.fullscreenElement) {
  //       console.log(
  //         `Element: ${document.fullscreenElement.id} entered fullscreen mode.`
  //       );
  //     } else {
  //       console.log("Leaving fullscreen mode.");
  //     }
  //     setToggleFullscreen(true);
  //   }
  // };

  const handleFullScreen = async (orientation) => {
    // P0改修: フルスクリーン切り替え開始時点でフラグを立てる
    // （scrollDialogの抑制を確実にするため、handleFullScreen内でも設定）
    isFullscreenTransitioningRef.current = true;

    const de = document.documentElement; // ドキュメントのルート要素
    const isFullscreen =
      !!document.fullscreenElement || !!document.webkitFullscreenElement;

    // 計測用: 絵巻IDをURLから取得
    const emakiSlug = gRouter.asPath.split("#")[0].replace("/", "");

    try {
      if (!isFullscreen) {
        // フルスクリーンを開始
        if (de.requestFullscreen) {
          await de.requestFullscreen();
        } else if (de.webkitRequestFullscreen) {
          await de.webkitRequestFullscreen(); // iOS Safari対応
        } else {
          throw new Error("Fullscreen API is not supported on this browser.");
        }

        // console.log("Entered fullscreen");
        setToggleFullscreen(true);

        // 計測: フルスクリーン開始
        trackFullscreenEnter(emakiSlug, navIndex);

        // 画面の向きをロック
        try {
          await screen.orientation.lock(orientation);
          // console.log("Orientation locked:", orientation);
        } catch (orientationError) {
          console.warn(`Failed to lock orientation: ${orientationError}`);
        }
      } else {
        // フルスクリーンを解除
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen(); // iOS Safari対応
        }

        // console.log("Exited fullscreen");
        setToggleFullscreen(false);

        // 計測: フルスクリーン終了（ボタン操作）
        trackFullscreenExit(emakiSlug, "button");
        fullscreenExitTrackedRef.current = true; // 重複計測防止
      }
    } catch (fullscreenError) {
      console.error(`Fullscreen error: ${fullscreenError}`);
      // Step B修正: エラー時はfullscreenchangeイベントが発火しない可能性があるため
      // フラグを即座に解除（スクロール操作がブロックされ続けることを防ぐ）
      isFullscreenTransitioningRef.current = false;
    }
  };

  // P0改修: ブラウザ主導のフルスクリーン状態変化を監視
  // ESCキーやブラウザUIでのフルスクリーン解除時にstateを同期
  // 計測用: ボタン操作での終了計測済みフラグ
  const fullscreenExitTrackedRef = useRef(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      // ブラウザの実際のフルスクリーン状態を取得（Single Source of Truth）
      const isActuallyFullscreen =
        !!document.fullscreenElement || !!document.webkitFullscreenElement;

      // 計測: ESC/ブラウザ主導のフルスクリーン終了
      // ボタン操作での終了は handleFullScreen で計測済みなのでスキップ
      if (!isActuallyFullscreen && toggleFullscreen && !fullscreenExitTrackedRef.current) {
        const emakiSlug = gRouter.asPath.split("#")[0].replace("/", "");
        trackFullscreenExit(emakiSlug, "esc_or_browser");
      }
      // フラグをリセット
      fullscreenExitTrackedRef.current = false;

      // フルスクリーン切り替え中フラグを立てる（scrollDialog抑制用）
      isFullscreenTransitioningRef.current = true;

      // アプリのstateをブラウザの実状態に同期
      setToggleFullscreen(isActuallyFullscreen);

      // Step B修正: タイマーIDをuseRefで管理
      // useEffectの再実行（setToggleFullscreenによる）でクリーンアップが走っても
      // タイマーがキャンセルされないようにする
      if (fullscreenTransitionTimerRef.current) {
        clearTimeout(fullscreenTransitionTimerRef.current);
      }
      fullscreenTransitionTimerRef.current = setTimeout(() => {
        isFullscreenTransitioningRef.current = false;
        fullscreenTransitionTimerRef.current = null;
      }, 500); // 500ms: requestAnimationFrame × 2 + 余裕
    };

    // 標準イベント + WebKit prefix（Safari対応）
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);

    // クリーンアップ: イベントリスナーの削除のみ
    // Step B修正: タイマーはuseRefで管理されており、useEffect再実行時にキャンセルしない
    // （フラグ解除を確実に完了させるため）
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, [toggleFullscreen, gRouter.asPath]);

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
        ekotobaToggle,
        setekotobaToggle,
        oepnSidebar,
        setOepnSidebar,
        ekotobaImageToggle,
        setEkotobaImageToggle,
        query,
        setQuery,
        fliterdEmakis,
        setfliterdEmakis,
        isModalOpen,
        closeModal,
        openModal,
        setisModalOpen,
        index,
        setIndex,
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
        handleEkotobaImageToggle,
        handleCharacterToggle,
        characterToggle,
        handleEbikiToggle,
        ebikiToggle,
        openMapModal,
        closeMapModal,
        MapIndex,
        setMapIndex,
        isMapModalOpen,
        openDescModal,
        closeDescModal,
        isDescModalOpen,
        DescIndex,
        setDescIndex,
        openContactModal,
        closeContactModal,
        isContactModalOpen,
        setIsContactModalOpen,
        searchKeyword,
        setSearchKeyword,
        showData,
        setShowdData,
        isSearchModalOpen,
        openSearchModalOpen,
        closeSearchModal,
        loading,
        rankingData,
        handleChapter,
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

      {/* google tag manager */}
      {/* <Script
        id="gtm"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtag.GTM_ID}');
          `,
        }}
      /> */}
      <ChakraProvider theme={theme}>
        <Component {...pageProps} key={router.asPath} />
        {isContactModalOpen && <ContactFormGoogle />}
        {isSearchModalOpen && <ModalSearch />}
        <BottomNavigation />
      </ChakraProvider>
    </AppContext.Provider>
    </>
  );
}

export default appWithTranslation(MyApp);
