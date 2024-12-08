import React from "react";
import { useLocaleData } from "../libs/func";
import { useRouter } from "next/router";
import { ExternalLink } from "react-feather";
import Link from "next/link";
import styles from "../styles/EditionLinks.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faScroll } from "@fortawesome/free-solid-svg-icons";
import SingleCardA from "./SingleCardA";

const EditionLinks = ({ title, edition,editionLinks }) => {
  // const { locale } = useRouter();
  // const { t: alldata } = useLocaleData();
  // const editionLinks = alldata.filter(
  //   (item) => item.title === title && item.edition !== edition
  // );

  return (
    <div className={styles.four}>
      {editionLinks.map((item, i) => {
        return <SingleCardA item={item} key={i} variant={"editionlink"} />;
      })}
    </div>
  );
};

export default EditionLinks;
