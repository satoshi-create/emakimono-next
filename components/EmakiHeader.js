import Link from "next/link";
import React, { useEffect, useState, useContext } from "react";
import styles from "../styles/EmkiHeader.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import NavLinks from "./NavLinks";
import { AppContext } from "../pages/_app";
import SidebarHome from "./SidebarHome";

const Header = ({ slug, fixed, emakipage }) => {
  const { locale } = useRouter();

  const { isSidebarOpen, openSidebar, stickyClass, setStickyClass } =
    useContext(AppContext);

  useEffect(() => {
    const stickNavbar = () => {
      let windowHeight = window.scrollY;
      windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
    };
    window.addEventListener("scroll", stickNavbar);
  }, [setStickyClass]);

  return (
    <header
      className={`${styles.header} section-grid ${
        fixed && styles[stickyClass]
      }`}
    >
      <div className={styles.center}>
        <h1 className={styles.title}>
          <Link href="/">
            <a>
              {locale === "en" ? "emakimono!!" : "横スクロールで楽しむ絵巻物"}
            </a>
          </Link>
        </h1>
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
        {/* <NavLinks slug={slug} /> */}
      </div>
    </header>
  );
};

export default Header;
