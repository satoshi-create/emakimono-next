import SocialLinks from "@/components/social/SocialLinks";
import styles from "@/styles/Footer.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

const Footer = () => {
  const date = new Date();
  const year = date.getFullYear();

  const { locale } = useRouter();
  return (
    <footer className={`parts-grid ${styles.container} ${styles.footer}`}>
      <Link href="/">
        <a className={styles.title}>
          <img src="/favicon.png" alt="favicon" className={styles.favicon} />
          {locale === "en" ? "emakimono!!" : "横スクロールで楽しむ絵巻物"}
        </a>
      </Link>
      <SocialLinks footerStyle iconStyle />
      <p className={styles.copyright}>
        {`@${year} emakimono.com All rights reserverd`}
      </p>
    </footer>
  );
};

export default Footer;
