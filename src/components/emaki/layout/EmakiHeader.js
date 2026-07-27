import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import SearchBoxButton from "@/components/search/SearchBoxButton";
import SocialLinks from "@/components/social/SocialLinks";
import SidebarHome from "@/components/ui/SidebarHome";
import { NOTION_CONTACT_URL } from "@/libs/constants/links";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/EmakiPageHeader.module.css";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useContext, useEffect } from "react";
import { Mail } from "react-feather";
import { useTranslation } from "next-i18next";

const EmakiHeader = () => {
  const { t } = useTranslation("common");

  const { openSidebar, setStickyClass } = useContext(AppContext);

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
        <Image
          src={"/favicon.ico"}
          alt="favicon"
          className={styles.favicon}
          width={48}
          height={48}
        />
        <Link href="/">
          <a className={styles.title}>
            {t("header.siteTitle")}
          </a>
        </Link>
        <div className={styles.desktopOnly}>
          <LanguageSwitcher />
        </div>
        <span className={`${styles.sociallinks} ${styles.desktopOnly}`}>
          <SocialLinks />
        </span>
        <div className={styles.desktopOnly}>
          <SearchBoxButton />
        </div>
        <a
          href={NOTION_CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={t("header.feedback")}
          aria-label={t("header.feedback")}
          className={`${styles.linkedbtn} ${styles.desktopOnly}`}
        >
          <Mail className={`${styles.contacticon}`} />
        </a>
        <nav className={styles.nav}>
          <div className={styles.navcenter}>
            <button
              className={`${styles.openbtn} btn`}
              onClick={() => openSidebar()}
            >
              <FontAwesomeIcon
                icon={faBars}
                className={`${styles.fabarsicon}`}
              />
            </button>
          </div>
          <SidebarHome />
        </nav>
      </div>
    </header>
  );
};

export default EmakiHeader;
