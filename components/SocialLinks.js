import Link from "next/link";
import React from "react";
import { socialLinks } from "../libs/socialLinks";
import styles from "../styles/SocialLinks.module.css";

const SocialLinks = ({ footerStyle, iconStyle }) => {
  return (
    <ul
      className={`${styles.links} ${footerStyle && styles["footerStyle"]} ${
        iconStyle && styles["iconStyle"]
      }`}
    >
      {socialLinks.map((item, index) => {
        const { name, icon, path, title } = item;
        return (
          <li key={index} className={styles.link} title={title}>
            <Link href={path}>
              <a
                className={styles.icon}
                target="_blank"
                rel="noopener noreferrer"
              >
                {icon}
              </a>
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default SocialLinks;
