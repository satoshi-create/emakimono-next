import React, { useContext } from "react";
import dataController from "../libs/controller";
import Link from "next/link";
import styles from "../styles/Controller.module.css";
import { NextContext } from "../context/context";

const Controller = ({ value }) => {
  const controller = dataController();
  console.log(controller);
  const { ekotobaImageToggle, setEkotobaImageToggle } = useContext(NextContext);
  const { emakis } = value;

  return (
    <aside className={styles.controller}>
      {controller.map((item, index) => {
        const { className, title, link, icon, toggleEkotobaImage } = item;
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
            >
              <i>{icon}</i>
            </span>
          );
        }
      })}
    </aside>
  );
};

export default Controller;
