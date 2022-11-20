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

const Modal = ({ data }) => {
  const { isModalOpen, closeModal, openModal, index, setIndex } =
    useContext(AppContext);
  const emakis = data.emakis;
  console.log(emakis);
  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");
  console.log(filterEkotobas);

  const { googlemap, basinmap } = emakis[0];

  const [ekotobas, setEkotobas] = useState(filterEkotobas);
  const [value, setValue] = useState(0);

  const nextSlide = () => {
    setIndex((oldIndex) => {
      let index = oldIndex + 1;
      if (index > ekotobas.length - 1) {
        index = 0;
      }
      return index;
    });
  };

  const prevSlide = () => {
    setIndex((oldIndex) => {
      let index = oldIndex - 1;
      if (index < 0) {
        index = ekotobas.length - 1;
      }
      return index;
    });
  };

  const allMap = [
    {
      title: "国土地理院地図",
      titleen: "personnames",
      src: basinmap,
      path: "basinmap",
    },
    {
      title: "googleマップ",
      titleen: "googlemap",
      src: googlemap,
      path: "googlemap",
    },
  ];

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
        {ekotobas.map((item, ekotobasIndex) => {
          const { googlemap, basinmap, chapter, chapterruby, id } = item;

          let position = "nextSlide";
          if (ekotobasIndex === index) {
            position = "activeSlide";
          }
          if (
            ekotobasIndex === index - 1 ||
            (index === 0 && ekotobasIndex === ekotobas.length - 1)
          ) {
            position = "lastSlide";
          }

          // const id = (i) => i + 1;
          const sum = (i) => i + ekotobasIndex;
          return (
            <article
              className={`${styles.article} ${styles[position]}`}
              key={ekotobasIndex}
            >
              <figure className={styles.figure}>
                <iframe
                  src={googlemap}
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  // width={768}
                  // height={500}
                  
                ></iframe>
              </figure>
              <div className={styles.link}>
                <Link href={`#s${sum(ekotobasIndex)}`}>
                  <a onClick={closeModal}>
                    <h3>{chapterruby}</h3>
                    <h2>{chapter}</h2>
                  </a>
                </Link>
              </div>
            </article>
          );
        })}
        <button className={styles.prev} onClick={prevSlide}>
          <FontAwesomeIcon icon={faAnglesLeft} />
        </button>
        <button className={styles.next} onClick={nextSlide}>
          <FontAwesomeIcon icon={faAnglesRight} />
        </button>
      </div>
    </div>
  );
};

export default Modal;
