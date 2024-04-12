import React, { useState } from "react";
import links from "../libs/links";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/NavLinks.module.css";
import Translate from "./Translate";
import { Divide } from "react-feather";

// TODO:NavLinksから<ul>を削除しリファクタリング
const NavLinks = ({ footerstyle, slug }) => {
  const [toggle, setToggle] = useState(false);
  const { locale } = useRouter();
  const router = useRouter();
  // const { slug } = router.query.slug;
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
              <ul
                className={`${submenu && styles.submenu}`}
                style={toggle ? { display: "grid" } : { display: "none" }}
              ></ul>
            </li>
          );
        } else {
          return (
            <li
              key={index}
              className={styles.menu}
              onClick={() => setToggle(!toggle)}
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
                style={toggle ? { display: "grid" } : { display: "none" }}
              >
                {submenu.map((item, i) => {
                  const { name, path, nameen } = item;
                  return (
                    <Link href={path} key={i}>
                      <a className={styles.linksName}>
                        {locale === "en" ? nameen : name}
                      </a>
                    </Link>
                  );
                })}
              </div>
            </li>
          );
        }
      })}
    </ul>
  );
};

export default NavLinks;
