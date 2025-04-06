import React from "react";
import styles from "../styles/Footer.module.css";
import { useRouter } from "next/router";
import NavLinks from "./NavLinks";
import SocialLinks from "./SocialLinks";
import Link from "next/link";

const Footer = () => {
  const date = new Date();
  const year = date.getFullYear();

  const footerstyle = {
    color: "white",
    // fontFamily: "var(--title-font)",
  };
  const footerStyleSocial = {
    color: "white",
    // fontFamily: "var(--title-font)",
  };

  const { locale } = useRouter();
  return (
    <footer className={`parts-grid ${styles.container} ${styles.footer}`}>
      <Link href="/">
        <a className={styles.title}>
          <img src="/favicon.png" alt="favicon" className={styles.favicon} />
          {locale === "en" ? "emakimono!!" : "横スクロールで楽しむ絵巻物"}
        </a>
      </Link>
      <SocialLinks footerStyle={footerStyleSocial} />
      <p className={styles.copyright}>
        {`@${year} emakimono.com All rights reserverd`}
      </p>
    </footer>
  );
};

export default Footer;
