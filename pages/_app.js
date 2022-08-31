import React from "react";
import Layout from "../components/Layout";
import "../styles/globals.css";
import { NextProvider } from "../context/context";

export const AppContext = React.createContext();

function MyApp({ Component, pageProps }) {
  return (
    <NextProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </NextProvider>
  );
}

export default MyApp;
