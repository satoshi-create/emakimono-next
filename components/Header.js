import Link from "next/link";
import React, { useEffect, useState, useContext } from "react";
import styles from "../styles/Header.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";
import NavLinks from "./NavLinks";
import { AppContext } from "../pages/_app";
import SidebarHome from "./SidebarHome";
import { Mail, Search } from "react-feather";
import SearchBoxButton from "./SearchBoxButton";
import SocialLinks from "./SocialLinks";
import LanguageSwitcher from "./LanguageSwitcher";

// TODO : ホバー時、header全体にリンクが入ってしまう

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
    <header
      className={`${styles.header} section-grid ${
        fixed && styles[stickyClass]
      }`}
      style={{ padding: "1rem 0" }}
    >
      <div className={styles.center}>
        <Link href="/">
          <a className={styles.title}>
            <img src="/favicon.png" alt="favicon" className={styles.favicon} />
            {locale === "en" ? "emakimono!!" : "横スクロールで楽しむ絵巻物"}
          </a>
        </Link>
        <LanguageSwitcher />
        <div className={styles.sociallinks}>
          <SocialLinks />
        </div>
        <div className={styles.searchboxbtn}>
          <SearchBoxButton />
        </div>
        <button
          onClick={() => openContactModal(true)}
          title="ご意見をお寄せください"
          className={`${styles.contacticonbox}`}
        >
          <i>
            <Mail className={`${styles.contacticon}`} />
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

        <NavLinks slug={slug} />
      </div>
    </header>
  );
};

export default Header;
