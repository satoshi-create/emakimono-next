import Link from "next/link";
import React from "react";
import styles from "../styles/Header.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import links from "../libs/links";

const Header = () => {
  return (
    <header className={`${styles.header} section-grid`}>
      <div className={styles.center}>
        <Link href="/">
          <a>
            <h1 className={styles.title}>横スクロールで楽しむ絵巻物</h1>
          </a>
        </Link>
        <nav className={styles.nav}>
          <div className={styles.navcenter}>
            <button className={`${styles.openbtn} btn`}>
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </nav>
        <ul className={styles.links}>
          {links.map((link, index) => {
            return (
              <li key={index}>
                <Link href={link.path}>
                  <a>{link.name}</a>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};

export default Header;
