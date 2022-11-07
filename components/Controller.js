import React, { useContext } from "react";
import dataController from "../libs/controller";
import Link from "next/link";
import styles from "../styles/Controller.module.css";
// import { NextContext } from "../context/context";
import { AppContext } from "../pages/_app";
import Breadcrumbs from "./Breadcrumbs";

const Controller = ({ value }) => {
  const controller = dataController();
  const { ekotobaImageToggle, setEkotobaImageToggle } = useContext(AppContext);
  const { emakis, kotobagaki, type, title, titleen, typeen } = value;
  console.log(kotobagaki);

  return (
    <aside className={styles.controller}>
      <Breadcrumbs
        type={type}
        typeen={typeen}
        title={title}
        titleen={titleen}
      />
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
                href={title === "最後に進む" ? `#s${emakis.length - 1}` : link}
                key={index}
              >
                <a
                  title={title}
                  className={`${styles[`${titleen}`]} ${styles.linkicon}`}
                >
                  {/* <div className={styles[`class${variantJ}`]}></div> */}
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
                <i>{ekotobaImageToggle ? iconEkotoba2 : iconEkotoba1}</i>
              </span>
            );
          }
        } else {
          // if (ctype === "all") {
          if (link) {
            return (
              <Link
                href={title === "最後に進む" ? `#s${emakis.length - 1}` : link}
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
                title={ekotobaImageToggle ? titleEmaki2 : titleEmaki1}
                onClick={() => toggleEkotobaImage()}
                key={index}
              >
                <i>{ekotobaImageToggle ? iconEmaki2 : iconEmaki1}</i>
              </span>
            );
          }
          // }
        }
      })}
    </aside>
  );
};

export default Controller;
