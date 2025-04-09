import BottomNavigation from "@/components/BottomNavigation";
import ContactFormGoogle from "@/components/common/ContactFormGoogle";
import ModalSearch from "@/components/ModalSearch";
import ExtractingListData from "@/libs/ExtractingListData";
import { useLocaleData } from "@/libs/func";
import * as gtag from "@/libs/gtag";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { useRouter } from "next/router";
import Script from "next/script";
import { createContext, useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import "../styles/globals.css";

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
  const [toggleBtn, setToggleBtn] = useState(true);
  const [hash, setHash] = useState(0);
  const [navIndex, setnavIndex] = useState(0);
  const [orientation, setOrientation] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showData, setShowdData] = useState(emakisData);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
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

  const rankingData = flattenAndRemoveNullAndUndefined(newData);

  // console.log(result); // [{ "id": 12, "title": "hoge" }]

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/fetchData`);
      const data = await res.json();
      const slicedata = data.slice(0, 30);
      const encodeURL = slicedata.map((item, i) => {
        const pathName = item.pagePath.replace("/", "");
        return { pathName: pathName, pageView: item.uniquePageviews };
      });
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
    console.log(diff);
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
    console.log(diff);
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
    // setToggleBtn(false); // フルスクリーン時にボタンを非表示

    const de = document.documentElement; // ドキュメントのルート要素
    const isFullscreen =
      !!document.fullscreenElement || !!document.webkitFullscreenElement;

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

        console.log("Entered fullscreen");
        setToggleFullscreen(true);

        // 画面の向きをロック
        try {
          await screen.orientation.lock(orientation);
          console.log("Orientation locked:", orientation);
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

        console.log("Exited fullscreen");
        setToggleFullscreen(false);
      }
    } catch (fullscreenError) {
      console.error(`Fullscreen error: ${fullscreenError}`);
    }
  };

  const handleToId = (id) => {
    flushSync(() => {
      setnavIndex(id);
    });
  };

  const scrollDialog = useCallback((node) => {
    if (node !== null) {
      node.scrollIntoView({
        behavior: "smooth",
        block: "start", // 必要なら "center" に変更
        inline: "start", // 横方向スクロールのみを許可
      });
    }
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
            setnavIndex(hashflag);
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
            setnavIndex(hashflag);
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
  }, [setnavIndex, gRouter.asPath]);

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
  );
}

export default MyApp;
