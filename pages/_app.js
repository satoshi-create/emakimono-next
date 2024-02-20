import React, { createContext, useState, useEffect } from "react";
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

  // useEffect(() => {
  //   gRouter.events.on("routeChangeStart", (url) => {
  //     console.log(`Loading: ${url}`);
  //   });
  // }, []);

  useEffect(() => {
    const handleRouteChange = (url) => {
      console.log(`Loading: ${url}`);
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

  const lock = (orientation) => {
    setToggleFullscreen(false);
    setToggleBtn(false);

    if (toggleFullscreen) {
      let de = document.documentElement;

      if (de.requestFullscreen) {
        de.requestFullscreen();
      } else if (de.mozRequestFullscreen) {
        de.mozRequestFullscreen();
      } else if (de.webkitRequestFullscreen) {
        de.webkitRequestFullscreen();
      } else if (de.msRequestFullscreen) {
        de.msRequestFullscreen();
      }

      screen.orientation.lock(orientation);
    } else {
      screen.orientation.unlock();

      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozExitFullscreen) {
        document.mozExitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setToggleFullscreen(true);
    }
  };

  const unlock = () => {
    screen.orientation.unlock();

    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozExitFullscreen) {
      document.mozExitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    setToggleBtn(true);
  };

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
        lock,
        unlock,
        toggleFullscreen,
        setToggleFullscreen,
        toggleBtn,
        setToggleBtn,
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
