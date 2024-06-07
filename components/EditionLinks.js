import React from "react";
import { useLocaleData } from "../libs/func";
import { ExternalLink } from "react-feather";
import Link from "next/link";
import styles from "../styles/EditionLinks.module.css";

const EditionLinks = ({ title, edition }) => {
  const { t: alldata } = useLocaleData();
  const editionLinks = alldata.filter(
    (item) => item.title === title && item.edition !== edition
  );
  console.log(editionLinks);
  return (
    <>
      {editionLinks.length > 0 && (
        <ul className={styles.editionLink}>
          {editionLinks.map((item, i) => {
            return (
              <li key={i}>
                <Link href={`./${item.titleen}`}>
                  <a target="_blank">
                    <p>
                      {item.title} {item.edition}
                      {item.edition !== edition && (
                        <ExternalLink className={styles.ExternalLinkIcon} />
                      )}
                    </p>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default EditionLinks;
