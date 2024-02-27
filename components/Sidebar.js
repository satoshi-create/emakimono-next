import React, { useContext, useEffect, useState } from "react";
import styles from "../styles/Sidebar.module.css";
import { Menu, X } from "react-feather";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../pages/_app";
import { useRouter } from "next/router";

// TODO:アニメーション機能を追加する
// TODO:referenceにリンクを作成
// TODO: FIXED: モバイルデバイスのサイドバーの幅が広すぎる;
// TODO:sidebarを開くと高さが変わるバグ;

const Sidebar = ({ value, handleToId }) => {
  const {
    emakis,
    title,
    titleen,
    backgroundImage,
    sourceImageUrl,
    sourceImage,
    reference,
    author,
    type,
  } = value;
  const { oepnSidebar, setOepnSidebar } = useContext(AppContext);
  const [tabValue, setTabValue] = useState(0);
  const { locale } = useRouter();

  useEffect(() => {
    setOepnSidebar(false);
  }, [setOepnSidebar]);

  const tabData = [
    {
      title: "目次",
      titleen: "contents",
    },
    {
      title: "出典",
      titleen: "source",
    },
    {
      title: "参照",
      titleen: "refarence",
    },
  ];

  const TabMenu = () => {
    if (tabValue === 0) {
      return (
        <ul className={styles.mokuji}>
          {emakis.map((item, index) => {
            const { cat, chapter } = item;
            if (cat === "ekotoba") {
              return (
                <li key={index} onClick={() => setOepnSidebar(false)}>
                  <span
                    onClick={() => handleToId(index)}
                    className={styles.navlink}
                    dangerouslySetInnerHTML={{ __html: chapter }}
                  ></span>
                  {/* <Link href={`#s${index}`}>
                    <a
                      className={styles.navlink}
                      dangerouslySetInnerHTML={{ __html: chapter }}
                    ></a>
                  </Link> */}
                </li>
              );
            }
          })}
        </ul>
      );
    } else if (tabValue === 1) {
      return (
        <>
          <p>
            {locale === "en"
              ? "Created by modifying the following"
              : "以下を加工して作成"}
          </p>
          <br />
          <ul className={styles.source}>
            <li>
              <Link href={sourceImageUrl}>
                <a target="_blank" className={styles.sourceLink}>
                  {sourceImage}
                </a>
              </Link>
            </li>
          </ul>
        </>
      );
    } else if (tabValue === 2) {
      return (
        reference && (
          <ul className={styles.source}>
            <li>{reference}</li>
          </ul>
        )
      );
    }
  };

  return (
    <aside>
      <button className={styles.openbtn} onClick={() => setOepnSidebar(true)}>
        <i className={styles.openbtnicon}>
          <FontAwesomeIcon icon={faBars} />
        </i>
      </button>
      <div
        className={
          oepnSidebar ? `${styles.open} ${styles.sidebar}` : `${styles.sidebar}`
        }
        style={{ background: `url(${backgroundImage})` }}
      >
        <button
          className={styles.closebtn}
          onClick={() => setOepnSidebar(false)}
        >
          <X />
        </button>

        <div className={styles.navheader}>
          <h4 className={styles.title}>{title}</h4>
          <h4 className={styles.author}>{author}</h4>
        </div>
        <div className={styles.tabConteiner}>
          {tabData.map((item, index) => {
            const { title, titleen } = item;
            return (
              <button
                onClick={() => setTabValue(index)}
                className={`${styles.tabBtn} ${
                  tabValue === index ? styles.activeBtn : ""
                }`}
                key={index}
              >
                {locale === "en" ? titleen : title}
              </button>
            );
          })}
        </div>
        <div className={styles.tabmenu}>
          <TabMenu />
        </div>
        {/* {tabValue === 1 ? (
          <ul className={styles.source}>
            <li>{sourceImage}</li>
          </ul>
        ) : (
          <ul className={styles.mokuji}>
            {emakis.map((item, index) => {
              const { cat, chapter } = item;
              if (cat === "ekotoba") {
                return (
                  <li key={index} onClick={() => setOepnSidebar(false)}>
                    <Link href={`#s${index}`}>
                      <a
                        className={styles.navlink}
                        dangerouslySetInnerHTML={{ __html: chapter }}
                      ></a>
                    </Link>
                  </li>
                );
              }
            })}
          </ul>
        )} */}
      </div>
    </aside>
  );
};

export default Sidebar;
