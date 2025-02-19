import React, { useContext } from "react";
import Link from "next/link";
import styles from "../styles/EmakiInfo.module.css";
import { eraColor } from "../libs/func";
import { AppContext } from "../pages/_app";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";

// TODO:絵詞を参照から出典に変更
// TODO:現在位置（段、紙、長さ）を表示する機能を追加する
const EmakiInfo = ({ value }) => {
  const { openModal, isModalOpen } = useContext(AppContext);
  const {
    emakis,
    kotobagaki,
    type,
    title,
    titleen,
    typeen,
    era,
    eraen,
    keyword,
    edition,
  } = value;
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
