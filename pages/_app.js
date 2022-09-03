import React, { createContext, useState, useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/globals.css";

import "@fortawesome/fontawesome-svg-core/styles.css"
import {config} from "@fortawesome/fontawesome-svg-core"
config.autoAddCss = false

export const AppContext = createContext();

function MyApp({ Component, pageProps, router }) {
  const [ekotobaToggle, setekotobaToggle] = useState(false);
  const [oepnSidebar, setOepnSidebar] = useState(false);
  const [ekotobaImageToggle, setEkotobaImageToggle] = useState(false);

  return (
    <AppContext.Provider
      value={{
        ekotobaToggle,
        setekotobaToggle,
        oepnSidebar,
        setOepnSidebar,
        ekotobaImageToggle,
        setEkotobaImageToggle,
      }}
    >
      <Layout>
        <Component {...pageProps} key={router.asPath} />
      </Layout>
    </AppContext.Provider>
  );
}

export default MyApp;
