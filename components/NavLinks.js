import React, { useState } from "react";
import links from "../libs/links";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/NavLinks.module.css";

const NavLinks = ({ footerstyle, slug }) => {
  const [value, setValue] = useState(null);
  const { locale } = useRouter();
  const router = useRouter();

  return (
    <ul className={styles.links}>
      {links.map((link, index) => {
        const { path, name, nameen, id, submenu } = link;
        if (!submenu) {
          return (
            <li key={index}>
              <Link href={path}>
                <a
                  className={`${styles.linksName} ${
                    id === router.query.slug && styles.active
                  }`}
                  style={footerstyle}
                >
                  {locale === "en" ? nameen : name}
                </a>
              </Link>
            </li>
          );
        } else {
          return (
            <li
              key={index}
              className={styles.menu}
              onClick={() => setValue(index)}
            >
              <div
                className={`${styles.linksNameAlpha} ${
                  id === router.query.slug && styles.active
                }`}
                style={footerstyle}
              >
                {locale === "en" ? nameen : name}
              </div>
              <div
                className={styles.submenu}
                style={
                  index === value ? { display: "flex" } : { display: "none" }
                }
              ></div>
            </li>
          );
        }
      })}
    </ul>
  );
};

export default NavLinks;
