import React, { useContext, useEffect, useState } from "react";
import styles from "../styles/Sidebar.module.css";
import { Menu, X } from "react-feather";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { AppContext } from "../pages/_app";

const Sidebar = ({ value }) => {
  const {
    emakis,
    title,
    backgroundImage,
    sourceImageUrl,
    sourceImage,
    reference,
  } = value;
  const { oepnSidebar, setOepnSidebar } = useContext(AppContext);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    setOepnSidebar(false);
  }, []);

  const tabData = [
    {
      title: "目次",
    },
    {
      title: "出典",
    },
    {
      title: "参照",
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
      );
    } else if (tabValue === 1) {
      return (
        <>
          <p>以下を加工して作成</p>
          <ul className={styles.source}>
            <li>gold
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
        <ul className={styles.source}>
          <li>{reference}</li>
        </ul>
      );
    }
  };

  console.log(tabValue);

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
        <h4 className={styles.navtitle}>{title}</h4>
        <div className={styles.tabConteiner}>
          {tabData.map((item, index) => {
            const { title } = item;
            return (
              <button
                onClick={() => setTabValue(index)}
                className={`${styles.tabBtn} ${
                  tabValue === index ? styles.activeBtn : ""
                }`}
                key={index}
              >
                {title}
              </button>
            );
          })}
        </div>
        <div>
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
