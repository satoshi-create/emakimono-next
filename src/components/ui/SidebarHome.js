import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import SearchBoxButton from "@/components/search/SearchBoxButton";
import SocialLinks from "@/components/social/SocialLinks";
import links, {
  NOTION_CONTACT_URL,
  sidebarExtraLinks,
} from "@/libs/constants/links";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/SidebarHome.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Mail, X } from "react-feather";
import { useTranslation } from "next-i18next";

const SidebarHome = () => {
  const { isSidebarOpen, closeSidebar } = useContext(AppContext);
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  const renderLink = (link, index) => {
    const { path, name, nameen } = link;
    return (
      <li key={index} className={styles.navLink}>
        <Link href={path}>
          <a onClick={() => closeSidebar()}>
            {locale === "en" ? nameen : name}
          </a>
        </Link>
      </li>
    );
  };

  return (
    <div
      className={
        isSidebarOpen
          ? `${styles.wrapper} ${styles.active}`
          : ` ${styles.wrapper} `
      }
    >
      <button
        className={`btn ${styles.closebtn}`}
        onClick={() => closeSidebar()}
      >
        <X className={styles.closeIcon} />
      </button>
      <aside className={styles.aside}>
        <ul className={styles.navLinks}>
          {links.map(renderLink)}
          {sidebarExtraLinks.map(renderLink)}
        </ul>
        <div className={styles.sidebarActions}>
          <LanguageSwitcher />
          <SearchBoxButton />
          <a
            href={NOTION_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={t("header.feedback")}
            className={styles.contactLink}
            onClick={() => closeSidebar()}
          >
            <Mail className={styles.contactIcon} />
            <span>{locale === "ja" ? "お問い合わせ" : "Contact"}</span>
          </a>
        </div>
        <SocialLinks iconStyle />
      </aside>
    </div>
  );
};

export default SidebarHome;
