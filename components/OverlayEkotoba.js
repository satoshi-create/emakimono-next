import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/OverlayEkotoba.module.css";
import ResposiveImage from "./ResposiveImage";
import { AppContext } from "../pages/_app";

const OverlayEkotoba = ({
  item: {
    gendaibun,
    srcSp,
    srcTb,
    src,
    load,
    name,
    scroll,
    srcWidth,
    srcHeight,
  },
}) => {
  const { setekotobaToggle, ekotobaImageToggle, setEkotobaImageToggle } =
    useContext(AppContext);

  // dangerouslySetInnerHTMLでgendaibunを描画使用するとHydration failedになる問題の対処のため、
  // gendaibunを最初のレンダリング後に取得
  // https://qiita.com/maaaashi/items/957bf8a949833151612b
  const [ekotobabody, setEkotobabody] = useState("");

  useEffect(() => {
    setEkotobabody(gendaibun);
  }, [setEkotobabody, gendaibun]);

  useEffect(() => {
    setEkotobaImageToggle(true);
    setekotobaToggle(true);
  }, [setEkotobaImageToggle, setekotobaToggle]);

  return (
    <span
      // className={ekotobaImageToggle ? `${styles.open}` : `${styles.close}`}
      className={`${styles.overlaycontainer} ${
        ekotobaImageToggle ? `${styles.open}` : `${styles.close}`
      }`}
    >
      <div className={styles.gendaibunbox}>
        <p
          dangerouslySetInnerHTML={{ __html: ekotobabody }}
          className={styles.gendaibun}
        />
      </div>
      <div className={styles.ekotobaimage}>
        {src && (
          <ResposiveImage
            value={{
              srcSp,
              srcTb,
              src,
              load,
              name,
              scroll,
              srcWidth,
              srcHeight,
            }}
          />
        )}
      </div>
    </span>
  );
};

export default OverlayEkotoba;
