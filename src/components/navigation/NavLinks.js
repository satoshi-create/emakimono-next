import { getContactUrl, navGroups } from "@/libs/constants/links";
import styles from "@/styles/NavLinks.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "next-i18next";

const NavLinks = ({ footerstyle }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const navRef = useRef(null);
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const toggleMenu = (groupId) => {
    setOpenMenu((prev) => (prev === groupId ? null : groupId));
  };

  return (
    <ul className={styles.links} ref={navRef}>
      <li>
        <Link href="/">
          <a className={styles.linksName} style={footerstyle}>
            {t("nav.home")}
          </a>
        </Link>
      </li>
      {navGroups.map((group) => {
        const isOpen = openMenu === group.id;
        return (
          <li key={group.id} className={styles.menu}>
            <button
              type="button"
              className={`${styles.linksNameAlpha} ${
                isOpen ? styles.linksNameAlphaOpen : ""
              }`}
              style={footerstyle}
              aria-expanded={isOpen}
              aria-haspopup="true"
              onClick={() => toggleMenu(group.id)}
            >
              {t(group.labelKey)}
            </button>
            <div
              className={`${styles.submenu} ${
                isOpen ? styles.submenuOpen : ""
              }`}
            >
              {group.links.map((link, index) => (
                <Link href={link.path} key={`${link.path}-${index}`}>
                  <a
                    style={footerstyle}
                    onClick={() => setOpenMenu(null)}
                  >
                    {locale === "en" ? link.nameen : link.name}
                  </a>
                </Link>
              ))}
            </div>
          </li>
        );
      })}
      <li>
        <a
          href={getContactUrl(locale)}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.linksName}
          style={footerstyle}
        >
          {t("nav.contact")}
        </a>
      </li>
    </ul>
  );
};

export default NavLinks;
