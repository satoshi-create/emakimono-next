import React from "react";
import links from "../libs/links";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/NavLinks.module.css";
import Translate from "./Translate";

const NavLinks = ({ footerstyle, slug }) => {
  const { locale } = useRouter();
  const router = useRouter();
  // const { slug } = router.query.slug;
  return (
    <ul className={styles.links}>
      {links.map((link, index) => {
        const { path, name, nameen, id } = link;
        return (
          <li key={index}>
            <Link href={path}>
              <a
                className={id === router.query.slug && styles.active}
                style={footerstyle}
              >
                {locale === "en" ? nameen : name}
              </a>
            </Link>
          </li>
        );
      })}
      <Translate footerstyle={footerstyle} slug={slug} />
    </ul>
  );
};

export default NavLinks;
