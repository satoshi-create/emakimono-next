import React from "react";
import styles from "../styles/Attention.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";


// indexページ用
const Attention = () => {
  const { locale } = useRouter();
  return (
    <aside className={styles.attention}>
      <div className={styles.container}>
        <span className="exclamation-icon">
          <i>
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </i>
        </span>
        <p>
          {locale === "en"
            ? `This site is designed for the purpose of "enjoying picture scrolls in portrait mode with right to left scrolling. When viewing the picture scrolls on a smartphone or tablet, please switch to landscape mode before viewing.`
            : `このサイトは「縦書き、横スクロールで絵巻物を楽しむ」目的で作成しています。スマホ・タブレットで絵巻物を閲覧するさいは、あらかじめ横画面に切り替えてから、ご覧になってください。`}
        </p>
      </div>
    </aside>
  );
};

export default Attention;
