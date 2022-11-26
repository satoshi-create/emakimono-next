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

const Modal = ({ data }) => {
  const { isModalOpen, closeModal, openModal, index, setIndex } =
    useContext(AppContext);
  const emakis = data.emakis;
  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");

  const allLocation = [
    {
      ekotobaId: 1,
      cat: "ekotoba",
      chapter: "江戸近郊八景の場所",
      kobun: "【吾嬬杜（江戸名所図会より）】",
      gendaibun: "",
      googlemap:
        "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d15414.822865578184!2d139.82582089467476!3d35.707879529814385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z5ZC-5ays5p2c!5e0!3m2!1sja!2sjp!4v1668769680120!5m2!1sja!2sjp",
      basinmap:
        "https://maps.gsi.go.jp/?hc=hc#16/35.705741/139.82671/&base=std&ls=std%7Canaglyphmap_color%2C0.72&blend=0&disp=11&vs=c1g1j0h0k0l0u0t0z0r0s0m0f0",
      kobunsrc: "/azumasya_edomeisyozue_1080.webp",
      kobunsrcSp: "/azumasya_edomeisyozue_375.webp",
      phrase: [{}],
    },
  ];

  const addAllLocation = allLocation.concat(filterEkotobas);


  const { googlemap, basinmap } = emakis[0];

  const [ekotobas, setEkotobas] = useState(addAllLocation);
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
      title: "googleマップ",
      titleen: "googlemap",
      src: googlemap,
      path: "googlemap",
    },
    {
      title: "国土地理院地図",
      titleen: "personnames",
      src: basinmap,
      path: "basinmap",
    },
  ];

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <div onClick={() => openModal(0)}>ホーム</div>
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
          const { googlemap, basinmap, chapter, chapterruby, linkId } = item;

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
          return (
            <article
              className={`${styles.article} ${styles[position]}`}
              key={ekotobasIndex}
            >
              <iframe
                src={value === 0 ? googlemap : basinmap}
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                className={styles.iframe}
              ></iframe>
              <div className={styles.link}>
                <Link href={`#s${linkId}`}>
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
