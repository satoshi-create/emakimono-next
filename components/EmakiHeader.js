import Link from "next/link";
import React, { useEffect, useState, useContext } from "react";
import styles from "../styles/EmkiHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import NavLinks from "./NavLinks";
import { AppContext } from "../pages/_app";
import SidebarHome from "./SidebarHome";
import { Mail } from "react-feather";

const Header = ({ slug, fixed, emakipage }) => {
  const { locale } = useRouter();

  const {
    isSidebarOpen,
    openSidebar,
    stickyClass,
    setStickyClass,
    openContactModal,
  } = useContext(AppContext);

  useEffect(() => {
    const stickNavbar = () => {
      let windowHeight = window.scrollY;
      windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
    };
    window.addEventListener("scroll", stickNavbar);
  }, [setStickyClass]);

  return (
    <header className={`${styles.header} emaki-page-landscape-grid`}>
      <div className={styles.center}>
        <Link href="/">
          <a className={styles.title}>
            <img src="/favicon.png" alt="favicon" className={styles.favicon} />
          </a>
        </Link>
        <Link href="/">
          <a className={styles.title}>
            {locale === "en" ? "emakimono!!" : "横スクロールで楽しむ絵巻物"}
          </a>
        </Link>
        <button
          className={styles.linkedbtn}
          onClick={() => openContactModal(true)}
          title="ご意見をお寄せください"
        >
          <i>
            <Mail className={`${styles.contacticon} hide-on-mobile`} />
          </i>
        </button>

        <nav className={styles.nav}>
          <div className={styles.navcenter}>
            <button
              className={`${styles.openbtn} btn`}
              onClick={() => openSidebar()}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
          <SidebarHome />
        </nav>
      </div>
    </header>
  );
};

export default Header;
