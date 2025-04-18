import dataController from "@/libs/_archive_unused_data/controller";
import styles from "@/styles/Controller.module.css";
import Link from "next/link";
import { useContext } from "react";
// import { NextContext } from "../context/context";
import { AppContext } from "../../pages/_app";

// TODO:リファクタリングする
// TODO:prev、nextボタンを追加する

const Controller = ({ value }) => {
  const controller = dataController();
  const { ekotobaImageToggle, setEkotobaImageToggle } = useContext(AppContext);
  const {
    emakis,
    kotobagaki,
    type,
    title,
    titleen,
    typeen,
    era,
    eraen,
    keyword,
    edition,
  } = value;

  return (
    <aside className={styles.container}>
      <div className={styles.controller}>
        {controller.map((item, index) => {
          const {
            title,
            titleen,
            titleEkotoba1,
            titleEkotoba2,
            titleEmaki1,
            titleEmaki2,
            link,
            icon,
            iconEkotoba1,
            iconEkotoba2,
            iconEmaki1,
            iconEmaki2,
            toggleEkotobaImage,
            title2,
            ctype,
          } = item;
          if (kotobagaki) {
            if (link) {
              return (
                <Link
                  href={
                    title === "最後に進む" ? `#s${emakis.length - 1}` : link
                  }
                  key={index}
                >
                  <a
                    title={title}
                    className={`${styles[`${titleen}`]} ${styles.linkicon}`}
                  >
                    <i>{icon}</i>
                  </a>
                </Link>
              );
            } else {
              return (
                <span
                  className={`${styles[`${titleen}`]} ${styles.linkicon}`}
                  title={ekotobaImageToggle ? titleEkotoba2 : titleEkotoba1}
                  onClick={() => toggleEkotobaImage()}
                  key={index}
                >
                  {/* 詞書がある絵巻のケース */}
                  <i>{ekotobaImageToggle ? iconEkotoba2 : iconEkotoba1}</i>
                </span>
              );
            }
          } else {
            // if (ctype === "all") {
            if (link) {
              return (
                <Link
                  href={
                    title === "最後に進む" ? `#s${emakis.length - 1}` : link
                  }
                  key={index}
                >
                  <a
                    title={title}
                    className={`${styles[`${titleen}`]} ${styles.linkicon}`}
                  >
                    <i>{icon}</i>
                  </a>
                </Link>
              );
            } else {
              return (
                <span
                  className={`${styles[`${titleen}`]} ${styles.linkicon}`}
                  title={ekotobaImageToggle ? title2 : titleEmaki1}
                  onClick={() => toggleEkotobaImage()}
                  key={index}
                >
                  {/* 詞書がない絵巻のケース */}
                  <i>{ekotobaImageToggle ? iconEmaki2 : iconEmaki1}</i>
                </span>
              );
            }
            // }
          }
        })}
      </div>
    </aside>
  );
};

export default Controller;
