import React from "react";
import styles from "../styles/Footer.module.css";
import { useRouter } from "next/router";
import NavLinks from "./NavLinks";
import SocialLinks from "./SocialLinks";

const Footer = () => {
  const date = new Date();
  const year = date.getFullYear();

  const footerstyle = {
    color: "white",
    fontFamily: "var(--title-font)",
  };
  const footerStyleSocial = {
    color: "white",
    fontFamily: "var(--title-font)",
  };

  const { locale } = useRouter();
  return (
    <footer className={`parts-grid ${styles.container} ${styles.footer}`}>
      <h4 className={styles.title}>
        {locale === "en" ? "EMAKIMONO!!" : "横スクロールで楽しむ絵巻物"}
      </h4>
      <SocialLinks footerStyle={footerStyleSocial} />
      <div className={styles.navlinks}>
        <NavLinks footerstyle={footerstyle} />
      </div>
      <p className={styles.copyright}>
        {`@${year} emakimono.com All rights reserverd`}
      </p>
    </footer>
  );
};

export default Footer;
