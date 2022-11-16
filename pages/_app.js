import React, { createContext, useState, useEffect } from "react";
import "../styles/globals.css";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import emakis from "../libs/data";
import Script from "next/script";

config.autoAddCss = false;

export const AppContext = createContext();

function MyApp({ Component, pageProps, router }) {
  const [ekotobaToggle, setekotobaToggle] = useState(false);
  const [oepnSidebar, setOepnSidebar] = useState(false);
  const [ekotobaImageToggle, setEkotobaImageToggle] = useState(false);
  const [query, setQuery] = useState("");
  const [fliterdEmakis, setfliterdEmakis] = useState(emakis);
  const [isModalOpen, setisModalOpen] = useState(false);

  const openModal = (i) => {
    setisModalOpen(true);
    // const clientWidth = document.body.clientWidth;
    // document.querySelector("html").classList.add("open");
    // const noScrollBarWidth = document.body.clientWidth;
    // const diff = noScrollBarWidth - clientWidth;
    // if (diff > 0) {
    //   setdiff(diff);
    //   document.body.style["padding-right"] = diff + "px";
    //   // const nav = document.getElementsByClassName("nav-fixed");
    //   // nav.style["padding-right"] = diff + "px";
    // }
    // setValue(i);
  };

  const closeModal = () => {
    // document.querySelector("html").classList.remove("open");
    // document.body.style["padding-right"] = "0px";
    setisModalOpen(false);
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
      }}
    >
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4115JJFY0B"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-4115JJFY0B');
          `}
      </Script>
      {/* <Layout> */}
      <Component {...pageProps} key={router.asPath} />
      {/* </Layout> */}
    </AppContext.Provider>
  );
}

export default MyApp;
