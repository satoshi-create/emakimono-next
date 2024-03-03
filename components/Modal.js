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

// TODO:モーダルに絵巻の情報を表示する

const Modal = ({ data }) => {
  const { locale } = useRouter();
  const { isModalOpen, closeModal, openModal, index, setIndex } =
    useContext(AppContext);
  console.log(isModalOpen);

  const emakis = data.emakis;
  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");
  console.log(data);

  const { reference, sourceImageUrl, sourceImage } = data;

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
      titleen: "refarence",
    },
  ];

  const toggleContets = (v) => {
    if (v === 0) {
      return (
        <ul className={styles.chapter}>
          {filterEkotobas.map((item, i) => {
            const { chapter, linkId, chapterruby, desc } = item;
            return (
              <li key={index} onClick={() => setOepnSidebar(false)}>
                <span
                  onClick={() => handleToId(index)}
                  className={styles.navlink}
                  dangerouslySetInnerHTML={{ __html: chapter }}
                ></span>
              </li>
            );
          })}
        </ul>
      );
    } else if (v === 1) {
      return (
        <>
          <ul className={styles.source}>
            <p>
              {locale === "en"
                ? "Created by modifying the following"
                : "以下を加工して作成"}
            </p>
            <br />
            <li>
              <Link href={sourceImageUrl}>
                <a target="_blank" className={styles.sourceLink}>
                  {sourceImage}
                </a>
              </Link>
            </li>
          </ul>
        </>
      );
    } else if (v === 2) {
      return (
        reference && (
          <ul className={styles.source}>
            <li>{reference}</li>
          </ul>
        )
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
          {allMap.map((item, index) => {
            const { title } = item;
            return (
              <button
                onClick={() => setValue(index)}
                className={`btn ${styles.tabbtn} ${
                  value === index ? styles.activebtn : ""
                }`}
                key={index}
              >
                {title}
              </button>
            );
          })}
        </div>
        <div className={`${styles.contents}`}>{toggleContets(value)}</div>
      </div>
    </div>
  );
};

export default Modal;
