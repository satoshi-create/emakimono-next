import Link from "next/link";
import React, { useEffect, useState } from "react";
import styles from "../styles/Header.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import links from "../libs/links";
import { useRouter } from "next/router";

const Header = () => {
  const { locale } = useRouter();
  const router = useRouter();
  const { slug } = router.query;

  const [stickyClass, setStickyClass] = useState("");
  const [stickyClassB, setStickyClassB] = useState("");

  const stickNavbar = () => {
    let windowHeight = window.scrollY;
    windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
  };

  useEffect(() => {
    window.addEventListener("scroll", stickNavbar);
  }, []);

  return (
    <header className={`${styles.header} section-grid ${styles[stickyClass]}`}>
      <div className={styles.center}>
        <h1 className={styles.title}>
          <Link href="/">
            <a>
              {locale === "en" ? "EMAKIMONO!!" : "横スクロールで楽しむ絵巻物"}
            </a>
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
            const { path, name, nameen, id } = link;
            return (
              <li key={index}>
                <Link href={path}>
                  <a className={id === slug && styles.active}>
                    {locale === "en" ? nameen : name}
                  </a>
                </Link>
              </li>
            );
          })}
          {/* <li>
            <Link href="/" locale="ja" passHref>
              <a>日本語</a>
            </Link>
          </li>
          <li>
            <Link href="/" locale="en" passHref>
              <a>英語</a>
            </Link>
          </li> */}
        </ul>
      </div>
    </header>
  );
};

export default Header;
