import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import NavLinks from "@/components/navigation/NavLinks";
import SearchBoxButton from "@/components/search/SearchBoxButton";
import SocialLinks from "@/components/social/SocialLinks";
import SidebarHome from "@/components/ui/SidebarHome";
import { getContactUrl } from "@/libs/constants/links";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/Header.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Mail, Menu } from "react-feather";
import { useTranslation } from "next-i18next";

const Header = ({ slug, fixed }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();
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
        <div className={`${styles.searchDesktop} ${styles.desktopOnly}`}>
          <SearchBoxButton />
        </div>
        <div className={styles.searchMobile}>
          <SearchBoxButton variant="iconOnly" />
        </div>
        <a
          href={getContactUrl(locale)}
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
              aria-label={t("nav.openMenu")}
            >
              <Menu className={styles.menuIcon} />
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
