import React, { useEffect } from "react";
import ScrollHint from "scroll-hint";
import styles from "../styles/ScrollHint.module.css";

const ScrollHintPage = () => {
  useEffect(() => {
    // new ScrollHint(".js-scrollable");

    new ScrollHint(".js-scrollable", {
      suggestiveShadow: true,
    });
  }, []);

  return (
    <div className="js-scrollable entry-container left-container">
      {/* <h2>動物について</h2> */}
      <article className="left-box">
        <img
          src="/cyoujyuu_yamazaki_kou_01-800.webp"
        />
        <img
          src="/cyoujyuu_yamazaki_kou_02-800.webp"
        />
        <img
          src="/cyoujyuu_yamazaki_kou_03-800.webp"
        />
        <img
          src="/cyoujyuu_yamazaki_kou_04-800.webp"
        />
        <img
          src="/cyoujyuu_yamazaki_kou_05-800.webp"
        />
        <img
          src="/cyoujyuu_yamazaki_kou_06-800.webp"
        />
        <img
          src="/cyoujyuu_yamazaki_kou_07-800.webp"
        />
      </article>
    </div>
  );
};

export default ScrollHintPage;
