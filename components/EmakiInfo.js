import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/EmakiInfo.module.css";

const EmakiInfo = ({ value }) => {
  const { openModal } = useContext(AppContext);
  const { type, title, typeen, era, eraen, keyword, edition } = value;
  const { locale } = useRouter();
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {title} {edition && edition}
      </h1>
      <Link href={`/era/${eraen}`}>
        <a className={styles.tag}>{`${
          locale === "en" ? eraen : `${era}時代`
        }`}</a>
      </Link>
      <Link href={`/type/${typeen}`}>
        <a className={styles.tag}>{`${locale === "en" ? typeen : type}`}</a>
      </Link>
      {keyword &&
        keyword.map((item, index) => {
          const { name, slug, id } = item;
          return (
            <Link href={`/keyword/${id}`} key={index}>
              <a className={styles.tag}>{locale === "en" ? id : name}</a>
            </Link>
          );
        })}
      <div onClick={() => openModal(0)} className={styles.question}>
        <FontAwesomeIcon icon={faCircleInfo} />
      </div>
    </div>
  );
};

export default EmakiInfo;
