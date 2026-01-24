import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import NavLinks from "@/components/navigation/NavLinks";
import SearchBoxButton from "@/components/search/SearchBoxButton";
import SocialLinks from "@/components/social/SocialLinks";
import SidebarHome from "@/components/ui/SidebarHome";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/Header.module.css";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import { Mail } from "react-feather";

const Header = ({ slug, fixed }) => {
  const { locale } = useRouter();
  const { openSidebar, stickyClass, openContactModal } = useContext(AppContext);

  return (
    <header
      className={`${styles.header} section-grid ${
        fixed && styles[stickyClass]
      }`}
      style={{ padding: "1rem 0" }}
    >
      <div className={styles.center}>
        <Link href="/">
          <a className={styles.title}>
            <Image
              src={"/favicon.ico"}
              alt="favicon"
              className={styles.favicon}
              width={25}
              height={25}
            />
            {/* <img src="/favicon.png" alt="favicon" className={styles.favicon} /> */}
            {locale === "en" ? "emakimono!!" : "横スクロールで楽しむ絵巻物"}
          </a>
        </Link>

        <LanguageSwitcher />
        <div className={styles.sociallinks}>
          <SocialLinks />
        </div>
        <div className={styles.searchboxbtn}>
          <SearchBoxButton />
        </div>
        {/* <button
          onClick={() => openContactModal(true)}
          title="ご意見をお寄せください"
          className={`${styles.contacticonbox}`}
        >
          <i>
            <Mail className={`${styles.contacticon}`} />
          </i>
        </button> */}
        <a
          href="https://sour-brain-48f.notion.site/2f2994f0dfcd8028b12acbc08eb18564?pvs=105"
          target="_blank"
        >
          <i>
            <Mail className={`${styles.contacticon}`} />
          </i>
        </a>
        <nav className={styles.nav}>
          <div className={styles.navcenter}>
            <button
              className={`${styles.openbtn} btn`}
              onClick={() => openSidebar()}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
          </div>
          <SidebarHome />
        </nav>

        <NavLinks slug={slug} />
      </div>
    </header>
  );
};

export default Header;
