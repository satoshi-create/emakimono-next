import React, { useContext } from "react";
import controller from "../libs/controller";
import Link from "next/link";
import styles from "../styles/Controller.module.css";
import { NextContext } from "../context/context";

const Controller = ({ value }) => {
  const { count, setcount } = useContext(NextContext);
  console.log(count);
  const { emakis } = value;
  return (
    <aside className={styles.controller}>
      {controller.map((item, index) => {
        const { className, title, link, icon } = item;
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
      })}
    </aside>
  );
};

export default Controller;
