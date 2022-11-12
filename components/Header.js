import Link from "next/link";
import React, { useEffect, useState } from "react";
import styles from "../styles/Header.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import links from "../libs/links";
import { useRouter } from "next/router";
import Attention from "./Attention";

const Header = () => {
  const router = useRouter();
  const { slug } = router.query;
  console.log(slug);

  const [stickyClass, setStickyClass] = useState("");
  const [stickyClassB, setStickyClassB] = useState("");

  const stickNavbar = () => {
    let windowHeight = window.scrollY;
    windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
  };

  // const stickSiteTitle = () => {
  //   let windowHeight = window.scrollY;
  //   windowHeight > 80
  //     ? setStickyClassB("site-title-fixed")
  //     : setStickyClassB("");
  // };

  useEffect(() => {
    window.addEventListener("scroll", stickNavbar);
    // window.addEventListener("scroll", stickSiteTitle);
  }, []);

  return (
    <header className={`${styles.header} section-grid ${styles[stickyClass]}`}>
      <div className={styles.center}>
        <h1 className={styles.title}>
          <Link href="/">
            <a>横スクロールで楽しむ絵巻物</a>
          </Link>
        </h1>
        <nav className={styles.nav}>
          <div className={styles.navcenter}>
            <button className={`${styles.openbtn} btn`}>
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
        </nav>
        <ul className={styles.links}>
          {links.map((link, index) => {
            const { path, name, nameen } = link;
            return (
              <li key={index}>
                <Link href={path}>
                  <a className={nameen === slug && styles.active}>{name}</a>
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
