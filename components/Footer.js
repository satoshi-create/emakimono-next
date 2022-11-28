import React from "react";
import styles from "../styles/Footer.module.css";
import { useRouter } from "next/router";

const Footer = () => {
  const { locale } = useRouter();
  return (
    <footer className={`parts-grid ${styles.footer}`}>
      <div className={styles.center}>
        <div className={styles.title}>
          {/* <img src="/logo-footer.png" alt="logo" className={styles.logo} /> */}
          <h4>
            {locale === "en" ? "EMAKIMONO!!" : "横スクロールで楽しむ絵巻物"}
          </h4>
        </div>
        {/* <SocialLinks value={{ styleUl: styles.aboutLinks }} />
        <Links value={{style:styles.footerNavPc}}/> */}
      </div>
      <p className={styles.copyright}>
        @2022 emakimono.com All rights reserverd
      </p>
    </footer>
  );
};

export default Footer;
