import { getContactUrl, navGroups } from "@/libs/constants/links";
import styles from "@/styles/NavLinks.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import { useTranslation } from "next-i18next";

const NavLinks = ({ footerstyle }) => {
  const [openGroupId, setOpenGroupId] = useState(null);
  const { locale } = useRouter();
  const { t } = useTranslation("common");

  return (
    <ul className={styles.links}>
      <li>
        <Link href="/">
          <a className={styles.linksName} style={footerstyle}>
            {t("nav.home")}
          </a>
        </Link>
      </li>
      {navGroups.map((group) => (
        <li
          key={group.id}
          className={styles.menu}
          onMouseEnter={() => setOpenGroupId(group.id)}
          onMouseLeave={() => setOpenGroupId(null)}
        >
          <span className={styles.linksNameAlpha} style={footerstyle}>
            {t(group.labelKey)}
          </span>
          <div
            className={styles.submenu}
            style={{
              display: openGroupId === group.id ? "flex" : "none",
            }}
          >
            {group.links.map((link, index) => (
              <Link href={link.path} key={`${link.path}-${index}`}>
                <a style={footerstyle}>
                  {locale === "en" ? link.nameen : link.name}
                </a>
              </Link>
            ))}
          </div>
        </li>
      ))}
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
