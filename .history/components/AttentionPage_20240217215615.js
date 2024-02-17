import React, { useState, useEffect } from "react";
import styles from "../styles/AttentionPage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faClose,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import { AlertDialogOverlay } from "@chakra-ui/react";

TODO: 絵巻ページに入ると、自動的に縦横切り替わる機能を追加する（アマプラみたいな
const Attention = () => {
  const [togglbtn, setTogglBtn] = useState(true);
  console.log(togglbtn);
  const { locale } = useRouter();
  useEffect(() => {
    setTogglBtn(true);
  }, []);

  if (togglbtn) {
    return (
      <div className={styles.wrapper}>
        <aside className={styles.attention}>
          <button
            className={`button ${styles.closeBtn}`}
            onClick={() => setTogglBtn(false)}
          >
            <FontAwesomeIcon icon={faClose} />
          </button>
          <div className={styles.container}>
            <span className="exclamation-icon">
              <i>
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </i>
            </span>
            <p>
              {locale === "en"
                ? `This page is designed for the purpose of "enjoying picture scrolls in portrait mode with right to left scrolling. When viewing the picture scrolls on a smartphone or tablet, please switch to landscape mode before viewing.`
                : `このページは「縦書き、横スクロールで絵巻物を楽しむ」目的で作成しています。スマホ・タブレットで絵巻物を閲覧するさいは、あらかじめ横画面に切り替えてから、ご覧になってください。`}
            </p>
          </div>
        </aside>
      </div>
    );
  }
};

export default Attention;
