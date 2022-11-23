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
  const [index, setIndex] = useState(0);

  const openModal = (i) => {
    setisModalOpen(true);
    setIndex(i);
  };

  const closeModal = () => {
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
        index,
        setIndex,
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
