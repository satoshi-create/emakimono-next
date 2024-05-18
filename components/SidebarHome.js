import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import Link from "next/link";
import { X } from "react-feather";
import links from "../libs/links";
import styles from "../styles/SidebarHome.module.css";
import { socialLinks } from "../libs/socialLinks";

const SidebarHome = () => {
  const { isSidebarOpen, closeSidebar } = useContext(AppContext);

  const [toggle, setToggle] = useState(false);
  return (
    <div
      className={
        isSidebarOpen
          ? `${styles.wrapper} ${styles.active}`
          : ` ${styles.wrapper} `
      }
      // style={isSidebarOpen && { transition: "ease-in" }}
      // style={{ transition: "all 0.3s linear" }}
    >
      <button
        className={`btn ${styles.closebtn}`}
        onClick={() => closeSidebar()}
      >
        <X className={styles.closeIcon} />
      </button>
      <aside className={styles.aside}>
        <ul className={styles.navLinks}>
          {links.map((link, index) => {
            const { path, name, nameen, id, submenu } = link;
            return (
              <li key={index} className={styles.navLink}>
                <Link href={path}>
                  <a onClick={() => closeSidebar()}>
                    {name}
                  </a>
                </Link>
                {submenu && (
                  <ul className={styles.submenu}>
                    {submenu.map((item, i) => {
                      const { name, path, nameen } = item;
                      return (
                        <li key={i}>
                          <Link href={path}>
                            <a
                              className={styles.sublinksName}
                              onClick={() => closeSidebar()}
                            >
                              {name}
                            </a>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <ul className={styles.socialLinks}>
          {socialLinks.map((item, index) => {
            const { name, icon, path } = item;
            return (
              <li key={index}>
                <Link href={path}>
                  <a className={styles.socialLinksIcon}>{icon}</a>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
};

export default SidebarHome;
