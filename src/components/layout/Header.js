import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import NavLinks from "@/components/navigation/NavLinks";
import SearchBoxButton from "@/components/search/SearchBoxButton";
import SocialLinks from "@/components/social/SocialLinks";
import SidebarHome from "@/components/ui/SidebarHome";
import { NOTION_CONTACT_URL } from "@/libs/constants/links";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/Header.module.css";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useContext } from "react";
import { Mail } from "react-feather";
import { useTranslation } from "next-i18next";

const Header = ({ slug, fixed }) => {
  const { t } = useTranslation("common");
  const { openSidebar = () => {}, stickyClass = "" } = useContext(AppContext) ?? {};

  return (
    <header
      className={`${styles.header} section-grid ${
        fixed && styles[stickyClass]
      }`}
      style={{ padding: "1rem 0px .5rem 0" }}
    >
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
        <div className={`${styles.sociallinks} ${styles.desktopOnly}`}>
          <SocialLinks />
        </div>
        <div className={styles.desktopOnly}>
          <SearchBoxButton />
        </div>
        <a
          href={NOTION_CONTACT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.desktopOnly} ${styles.contactbtn}`}
          title={t("header.feedback")}
          aria-label={t("header.feedback")}
        >
          <Mail className={`${styles.contacticon}`} />
        </a>
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
      <NavLinks slug={slug} />
    </header>
  );
};

export default Header;
