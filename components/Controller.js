import React, { useContext } from "react";
import dataController from "../libs/controller";
import Link from "next/link";
import styles from "../styles/Controller.module.css";
import { NextContext } from "../context/context";
import { AppContext } from "../pages/_app";

const Controller = ({ value }) => {
  const controller = dataController();
  const { ekotobaImageToggle, setEkotobaImageToggle } = useContext(AppContext);
  const { emakis ,type} = value;
  console.log(type);

  return (
    <aside className={styles.controller}>
      {controller.map((item, index) => {
        const { className, title, link, icon, icon2,toggleEkotobaImage } = item;
        console.log(ekotobaImageToggle);
        if (link) {
          return (
            <Link
              href={title === "最後に進む" ? `#s${emakis.length - 1}` : link}
              key={index}
            >
              <a title={title} className={styles.linkicon}>
                <i>{icon}</i>
              </a>
            </Link>
          );
        } else {
          return (
            <span
              className={styles.linkicon}
              title={title}
              onClick={() => toggleEkotobaImage()}
              key={index}
            >
              <i>{ekotobaImageToggle ? icon2 : icon}</i>
            </span>
          );
        }
      })}
    </aside>
  );
};

export default Controller;
