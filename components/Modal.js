import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/Modal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import AllLocation from "./AllLocation";
import Image from "next/image";
import { useRouter } from "next/router";
import { eraColor } from "../libs/func";
import { flushSync } from "react-dom";

const Modal = ({ data }) => {
  const { locale } = useRouter();
  const { closeModal, navIndex, handleToId } = useContext(AppContext);

  const { reference, sourceImageUrl, sourceImage, era } = data;
  const emakis = data.emakis;

  const handleChapter = (index) => {
    handleToId(index);
    closeModal();
  };

  const [value, setValue] = useState(0);

  const allMap = [
    {
      title: "目次",
    },
    {
      title: "書誌情報",
    },
    {
      title: "参照",
    },
  ];

  const toggleContets = (v) => {
    if (v === 0) {
      return (
        <ul className={styles.chapter}>
          {emakis.map((item, i) => {
            const { cat, chapter } = item;
            if (cat === "ekotoba") {
              return (
                <li
                  key={i}
                  onClick={() => handleChapter(i)}
                  className={styles.chapterlink}
                  style={{ color: eraColor(era) }}
                  dangerouslySetInnerHTML={{ __html: chapter }}
                ></li>
              );
            }
          })}
        </ul>
      );
    } else if (v === 1) {
      return (
        <p className={styles.source}>
          {locale === "en"
            ? "Created by modifying the following"
            : "以下を加工して作成"}
          <br />
          <br />
          <Link href={sourceImageUrl}>
            <a
              target="_blank"
              className={styles.sourceLink}
              style={{ color: eraColor(era) }}
            >
              {sourceImage}
            </a>
          </Link>
        </p>
      );
    } else if (v === 2) {
      return (
        <ul className={styles.reference}>
          {reference?.map((item, i) => {
            return (
              <li key={i}>
                <Link href={item.url}>
                  <a
                    target="_blank"
                    className={styles.sourceLink}
                    style={{ color: eraColor(era) }}
                  >
                    {`【${item.type}】
                          ${item.title}`}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      );
    }
  };

  {
    /* //   <Link href={`#s${linkId}`} key={i}>
              //     <a onClick={closeModal}>
              //       <dt>{chapter}</dt>
              //     </a>
              //   </Link>
              //   <dd>{desc}</dd>
              //  */
  }

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>

        <div className={styles.tabcontainer}>
          {allMap.map((item, i) => {
            const { title } = item;
            return (
              <button
                onClick={() => setValue(i)}
                className={`btn ${styles.tabbtn} ${
                  value === i ? styles.activebtn : ""
                }`}
                key={i}
              >
                {title}
              </button>
            );
          })}
        </div>
        <div className={`${styles.contents} scrollbar`}>
          {toggleContets(value)}
        </div>
      </div>
    </div>
  );
};

export default Modal;
