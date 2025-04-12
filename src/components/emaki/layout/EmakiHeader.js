import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import SearchBoxButton from "@/components/search/SearchBoxButton";
import SocialLinks from "@/components/social/SocialLinks";
import SidebarHome from "@/components/ui/SidebarHome";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/EmakiPageHeader.module.css";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import { Mail } from "react-feather";

const EmakiHeader = () => {
  const { locale } = useRouter();

  const { openSidebar, setStickyClass, openContactModal } =
    useContext(AppContext);

  useEffect(() => {
    const stickNavbar = () => {
      let windowHeight = window.scrollY;
      windowHeight > 80 ? setStickyClass("header-fixed") : setStickyClass("");
    };
    window.addEventListener("scroll", stickNavbar);
  }, [setStickyClass]);

  return (
    <header className={`${styles.header} emaki-page-landscape-grid`}>
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
          </a>
        </Link>
        <Link href="/">
          <a className={styles.title}>
            {locale === "en" ? "emakimono!!" : "横スクロールで楽しむ絵巻物"}
          </a>
        </Link>
        <LanguageSwitcher />
        <span className={styles.sociallinks}>
          <SocialLinks />
        </span>
        <SearchBoxButton />
        <button
          onClick={() => openContactModal(true)}
          title="ご意見をお寄せください"
          className={styles.contactbtn}
        >
          <Mail className={`${styles.contacticon}`} />
        </button>
        <nav className={styles.nav}>
          <div className={styles.navcenter}>
            <button
              className={`${styles.openbtn} btn`}
              onClick={() => openSidebar()}
            >
              <FontAwesomeIcon
                icon={faBars}
                className={`${styles.fabarsicon}`}
              />
            </button>
          </div>
          <SidebarHome />
        </nav>
      </div>
    </header>
  );
};

export default EmakiHeader;
