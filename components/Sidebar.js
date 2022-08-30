import React, { useState } from "react";
import styles from "../styles/Sidebar.module.css";
import { Menu, X } from "react-feather";
import Link from "next/link";

const Sidebar = ({ value }) => {
  const { emakis, title, backgroundImage } = value;
  console.log(emakis);
  const [oepnSidebar, setOepnSidebar] = useState(false);
  return (
    <aside>
      <button className={styles.openbtn} onClick={() => setOepnSidebar(true)}>
        <Menu />
      </button>
      <div
        className={
          oepnSidebar ? `${styles.open} ${styles.sidebar}` : `${styles.sidebar}`
        }
        style={{ "background": `url(${backgroundImage})` }}
      >
        <button
          className={styles.closebtn}
          onClick={() => setOepnSidebar(false)}
        >
          <X />
        </button>
        <ul>
          <h4 className={styles.navtitle}>{title}</h4>
          {emakis.map((item, index) => {
            const { cat, chapter } = item;
            if (cat === "ekotoba") {
              return (
                <li key={index} onClick={() => setOepnSidebar(false)}>
                  <Link href={`#s${index}`}>
                    <a className={styles.navlink}>{chapter}</a>
                  </Link>
                </li>
              );
            }
          })}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
