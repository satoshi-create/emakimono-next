import React from "react";
import links from "../libs/links";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/NavLinks.module.css";

const NavLinks = ({ slug, footerstyle }) => {
  const { locale } = useRouter();
  return (
    <ul className={styles.links}>
      {links.map((link, index) => {
        const { path, name, nameen, id } = link;
        return (
          <li key={index}>
            <Link href={path}>
              <a className={id === slug && styles.active} style={footerstyle}>
                {locale === "en" ? nameen : name}
              </a>
            </Link>
          </li>
        );
      })}
      <li>
        <Link href="/" locale="ja" passHref>
          <a style={footerstyle}>日本語</a>
        </Link>
      </li>
      <li>
        <Link href="/" locale="en" passHref>
          <a style={footerstyle}>英語</a>
        </Link>
      </li>
    </ul>
  );
};

export default NavLinks;
