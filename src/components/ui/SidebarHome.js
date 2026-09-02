import SocialLinks from "@/components/social/SocialLinks";
import { getContactUrl, navGroups } from "@/libs/constants/links";
import { AppContext } from "@/context/AppContext";
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
      <li key={`${path}-${index}`} className={styles.navLink}>
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
          <li className={styles.navLink}>
            <Link href="/">
              <a onClick={() => closeSidebar()}>{t("nav.home")}</a>
            </Link>
          </li>
          {navGroups.map((group) => (
            <li key={group.id} className={styles.navGroup}>
              <span className={styles.groupLabel}>{t(group.labelKey)}</span>
              <ul className={styles.subLinks}>
                {group.links.map(renderLink)}
              </ul>
            </li>
          ))}
          <li className={styles.navLink}>
            <a
              href={getContactUrl(locale)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contactLink}
              onClick={() => closeSidebar()}
            >
              <Mail className={styles.contactIcon} />
              <span>{t("nav.contact")}</span>
            </a>
          </li>
        </ul>
        <SocialLinks iconStyle />
      </aside>
    </div>
  );
};

export default SidebarHome;
