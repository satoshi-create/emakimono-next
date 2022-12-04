import React, { useContext } from "react";
import Link from "next/link";
import styles from "../styles/EmakiInfo.module.css";
import { eraColor } from "../libs/func";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";

const EmakiInfo = ({ type, title, era, typeen, eraen, keyword, edition }) => {
  const { openModal } = useContext(AppContext);
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        {title} {edition && edition}
      </h1>
      <Link href={`/era/${eraen}`}>
        <a className={styles.tag}>{`${era}時代`}</a>
      </Link>
      <Link href={`/category/${typeen}`}>
        <a className={styles.tag}>{type}</a>
      </Link>
      {keyword &&
        keyword.map((item, index) => {
          const { name, slug, id } = item;
          return (
            <Link href={`/keyword/${id}`} key={index}>
              <a className={styles.tag}>{name}</a>
            </Link>
          );
        })}
      {type === "浮世絵" && (
        <div onClick={() => openModal(0)} className={styles.question}>
          <FontAwesomeIcon icon={faCircleQuestion} />
        </div>
      )}
    </div>
  );
};

export default EmakiInfo;
