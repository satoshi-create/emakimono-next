import React, { createContext, useState, useEffect, useCallback } from "react";
import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import Script from "next/script";
import { useLocaleData } from "../libs/func";
import * as gtag from "../libs/gtag";
import { useRouter } from "next/router";

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
  const [oepnSidebar, setOepnSidebar] = useState(false);
  const [ekotobaImageToggle, setEkotobaImageToggle] = useState(true);
  const [query, setQuery] = useState("");
  const [fliterdEmakis, setfliterdEmakis] = useState(emakisData);
  const [isModalOpen, setisModalOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [stickyClass, setStickyClass] = useState("");
  const [isSidebarOpen, setisSidebarOpen] = useState(false);
  const [toggleFullscreen, setToggleFullscreen] = useState(true);
  const [toggleBtn, setToggleBtn] = useState(true);
  const [hash, setHash] = useState(0);
  const [navIndex, setnavIndex] = useState(0);

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

  // TODO: モバイルデバイスから訪問時、絵巻ページからホームページに戻るときにfullscreenをfalseにする
  const handleFullScreen = (orientation) => {
    setToggleFullscreen(false);
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
          console.log(hash);
          setnavIndex(hash);
          console.log(navIndex);
        })
        .catch((error) => {
          console.log(`Error lock orientation ${error}`);
          // hashを置き換え
          // const pathAndSlug = router.asPath.split("#")[0];
          // const newPath = `${pathAndSlug}#5`;
          // window.location.replace(newPath);
          console.log(hash);
          setnavIndex(hash);
          console.log(navIndex);
        });
    } else {
      document.exitFullscreen();
      // / 要素を横向きに固定（モバイルデバイスで、ブラウザーがフルスクリーン表示になっているときのみ有効）
      screen.orientation.unlock();
      console.log(`exit fullscreen`);
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

  const scrollDialog = useCallback((node) => {
    if (node !== null) {
      node.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
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
