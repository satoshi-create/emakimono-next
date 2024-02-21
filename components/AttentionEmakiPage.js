import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/AttentionPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { AppContext } from "../pages/_app";

// 絵巻ページ用
// TODO:dangerouslySetInnerHTMLにlocalを組み込む

const AttentionEmakiPage = () => {
  const { handleFullScreen, toggleBtn, setToggleBtn } = useContext(AppContext);

  const { locale } = useRouter();

  useEffect(() => {
    setToggleBtn(true);
  }, []);

  if (toggleBtn) {
    return (
      <div className={styles.wrapper}>
        <aside className={styles.attention}>
          <button
            className={`button ${styles.closeBtn}`}
            onClick={() => setToggleBtn(false)}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
          <div className={styles.container}>
            <p
              dangerouslySetInnerHTML={{
                __html:
                  "ご覧いただきありがとうございます。<br><br>このページは「縦書き、横スクロールで絵巻物を楽しむ」目的で作成しています。モバイルデバイスから訪問された方は、横向きに切り替えてご覧になってください",
              }}
            >
              {/* {locale === "en"
                  ? `Thank you for visiting. This page is designed for the purpose of "enjoying picture scrolls in portrait and landscape mode. If you are visiting from a mobile device, please switch to landscape orientation to view this page`
                  : `ご覧いただきありがとうございます。このページは「縦書き、横スクロールで絵巻物を楽しむ」目的で作成しています。モバイルデバイスから訪問された方は、横向きに切り替えてご覧になってください👇`} */}
            </p>
            <button
              type="button"
              value="Lock Landscape"
              onClick={() => handleFullScreen("landscape")}
              className={styles.button}
            >
              横スクロールで見る
            </button>
          </div>
        </aside>
      </div>
    );
  }
};

export default AttentionEmakiPage;
