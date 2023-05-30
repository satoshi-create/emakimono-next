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
    "font-family": "var(--title-font)",
  };
  const footerStyleSocial = {
    color: "white",
    "font-family": "var(--title-font)",
  };

  const { locale } = useRouter();
  return (
    <>
      <footer className={styles.footer}>
        <div className={`parts-grid ${styles.container}`}>
          <div className={styles.center}>
            <NavLinks footerstyle={footerstyle} />
            <div className={styles.title}>
              <h4>
                {locale === "en" ? "EMAKIMONO!!" : "横スクロールで楽しむ絵巻物"}
              </h4>
            </div>
            <SocialLinks footerStyle={footerStyleSocial} />
          </div>
        </div>
        <p className={styles.copyright}>
          {`@${year} emakimono.com All rights reserverd`}
        </p>
      </footer>
    </>
  );
};

export default Footer;
