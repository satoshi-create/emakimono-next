import React from "react";
import { socialLinks } from "../libs/socialLinks";
import Link from "next/link";
import styles from "../styles/SocialLinks.module.css";
import NoteIcon from "../public/note-icon.svg";
import Image from "next/image";

const SocialLinks = ({ footerStyle }) => {
  return (
    <ul className={`${styles.links} ${footerStyle && styles["footerStyle"]}`}>
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
