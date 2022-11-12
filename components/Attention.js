import React from "react";
import styles from "../styles/Attention.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

const Attention = () => {
  return (
    <aside className={styles.attention}>
      <div className={styles.container}>
        <span className="exclamation-icon">
          <i>
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </i>
        </span>
        <p>
          このサイトは「縦書き、横スクロールで絵巻物を楽しむ」目的で作成しています。スマホ・タブレットで絵巻物を閲覧するさいは、あらかじめ横画面に切り替えてから、ご覧になってください。
        </p>
      </div>
    </aside>
  );
};

export default Attention;
