import React, { createContext, useState, useEffect, useCallback } from "react";
import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import Script from "next/script";
import { useLocaleData } from "../libs/func";
import * as gtag from "../libs/gtag";
import { useRouter } from "next/router";
import { flushSync } from "react-dom";

config.autoAddCss = false;

export const AppContext = createContext();

function MyApp({ Component, pageProps, router }) {
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
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [DescIndex, setDescIndex] = useState({});
  const [stickyClass, setStickyClass] = useState("");
  const [isSidebarOpen, setisSidebarOpen] = useState(false);
  const [toggleFullscreen, setToggleFullscreen] = useState(false);
  const [toggleBtn, setToggleBtn] = useState(true);
  const [hash, setHash] = useState(0);
  const [navIndex, setnavIndex] = useState(0);
  const [orientation, setOrientation] = useState("portrait");

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

  const openMapModal = (i) => {
    setIsMapModalOpen(true);
        const clientWidth = document.body.clientWidth;
    document.querySelector("html").classList.add("open");
        const noScrollBarWidth = document.body.clientWidth;
    const diff = noScrollBarWidth - clientWidth;
    console.log(diff)
    if (diff > 0 ) {
      document.body.style["padding-right"] = diff + "px";
    }
    setMapIndex(i);
  };

  const closeMapModal = () => {
    document.querySelector("html").classList.remove("open");
    setIsMapModalOpen(false);
  };

  const openDescModal = (ei,i) => {
    setIsDescModalOpen(true);
    const clientWidth = document.body.clientWidth;
    document.querySelector("html").classList.add("open");
    const noScrollBarWidth = document.body.clientWidth;
    const diff = noScrollBarWidth - clientWidth;
    console.log(diff)
    if (diff > 0 ) {
      document.body.style["padding-right"] = diff + "px";
    }
    console.log(ei);
    setDescIndex(ei, i);
  };
  const closeDescModal = () => {
    document.querySelector("html").classList.remove("open");
    setIsDescModalOpen(false);
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

  const handleFullScreen = (orientation) => {
    setToggleBtn(false);

    // if (toggleFullscreen) {
    let de = document.documentElement;

    // if (de.requestFullscreen) {
    //   de.requestFullscreen();
    // } else if (de.mozRequestFullscreen) {
    //   de.mozRequestFullscreen();
    // } else if (de.webkitRequestFullscreen) {
    //   de.webkitRequestFullscreen();
    // } else if (de.msRequestFullscreen) {
    //   de.msRequestFullscreen();
    // }

    // 要素を全画面表示するための非同期的な要求を発行;
    if (!document.fullscreenElement) {
      de.requestFullscreen()
        .then(() => {
          console.log("enter fullscreen");
          console.log(navIndex);
          setToggleFullscreen(true);
        })
        .catch((err) => {
          console.log(`Error attempting to enable fullscreen mode ${err})`);
        });

      screen.orientation
        .lock(orientation)
        .then(() => {
          console.log("Success lock orientation");
          // hashを置き換え
          // const pathAndSlug = router.asPath.split("#")[0];
          // const newPath = `${pathAndSlug}#5`;
          // window.location.replace(newPath);
          // console.log(newPath);
          // if (hash) {
          //   setnavIndex(hash);
          // }
        })
        .catch((error) => {
          console.log(`Error lock orientation ${error}`);
          // hashを置き換え
          // const pathAndSlug = router.asPath.split("#")[0];
          // const newPath = `${pathAndSlug}#5`;
          // window.location.replace(newPath);
          // if (hash) {
          //   setnavIndex(hash);
          // }
        });
    } else {
      // Document: exitFullscreen() メソッド
      // https://developer.mozilla.org/ja/docs/Web/API/Document/exitFullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().then(() => {
          setToggleFullscreen(false);
          console.log(`exit fullscreen`);
          console.log(navIndex);
        });
      }
      // setToggleFullscreen(false);
      // // / 要素を横向きに固定（モバイルデバイスで、ブラウザーがフルスクリーン表示になっているときのみ有効）
      // screen.orientation.unlock();
      // setnavIndex(10);
      // console.log(`exit fullscreen`);
      // console.log(navIndex);
    }
  };

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

  const handleToId = (id) => {
    flushSync(() => {
      setnavIndex(id);
    });
  };

  const scrollDialog = useCallback((node) => {
    if (node !== null) {
      node.scrollIntoView({
        behavior: "smooth",
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
      }}
    >
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
      <Component {...pageProps} key={router.asPath} />
    </AppContext.Provider>
  );
}

export default MyApp;
