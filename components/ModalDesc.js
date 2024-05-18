import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/ModalDesc.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import AllLocation from "./AllLocation";
import {
  faTwitter,
  faFacebook,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";

const ModalDesc = ({ data }) => {
  const { DescIndex, setDescIndex, handleToId, closeDescModal, orientation } =
    useContext(AppContext);
  const emakis = data.emakis;
  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");
  const handleChapter = (index) => {
    handleToId(index);
    closeDescModal();
  };

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${data.titleen}%23${DescIndex.index}`;
  console.log(url);

  const { kobun, gendaibun, desc } = emakis[0];

  const [value, setValue] = useState(0);

  // const nextSlide = () => {
  //   setMapIndex((oldIndex) => {
  //     let index = oldIndex + 1;
  //     if (index > filterEkotobas.length - 1) {
  //       index = 0;
  //     }
  //     return index;
  //   });
  // };
  const nextSlide = () => {
    setDescIndex((DescIndex) => {
      let index = DescIndex.ekotobaId + 1;
      if (index > filterEkotobas.length - 1) {
        index = 0;
      }
      return { ...DescIndex, ekotobaId: index };
    });
  };


  const prevSlide = () => {
    setDescIndex((DescIndex) => {
      let index = DescIndex.ekotobaId - 1;
      if (index < 0) {
        index = filterEkotobas.length - 1;
      }
      return { ...DescIndex, ekotobaId: index };
    });
  };

  const allMap = [
    {
      title: "現代文",
      titleen: "modern-sentence",
      path: "modern-sentence",
    },
    {
      title: "古文",
      titleen: "ancient-text",
      path: "ancient-text",
    },
    {
      title: "解説",
      titleen: "description",
      path: "description",
    },
  ];

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeDescModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeDescModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        {/* <div onClick={()=>setMapIndex(0)}>繝帙�ｼ繝�</div> */}
        <div className={styles.tabcontainer}>
          {allMap.map((item, index) => {
            const { title } = item;
            return (
              <button
                onClick={() => setValue(index)}
                className={`btn ${styles.tabbtn} ${
                  value === index ? styles.activebtn : ""
                }`}
                style={
                  orientation === "portrait"
                    ? {
                        fontSize: "var(--title-size-prt)",
                      }
                    : { fontSize: "var(--title-size)" }
                }
                key={index}
              >
                {title}
              </button>
            );
          })}
        </div>

        {filterEkotobas.map((item, ekotobasIndex) => {
          const { gendaibun, chapter, linkId } = item;

          let position = "nextSlide";
          if (ekotobasIndex === DescIndex.ekotobaId) {
            position = "activeSlide";
          }
          if (
            ekotobasIndex === DescIndex.ekotobaId - 1 ||
            (DescIndex.ekotobaId === 0 &&
              ekotobasIndex === filterEkotobas.length - 1)
          ) {
            position = "lastSlide";
          }
          if (value === 0) {
            return (
              <article
                className={`${styles.article} ${styles[position]}`}
                key={ekotobasIndex}
              >
                <h4
                  className={styles.link}
                  style={
                    orientation === "portrait"
                      ? {
                          fontSize: "var(--title-size-prt)",
                        }
                      : { fontSize: "var(--title-size)" }
                  }
                  onClick={() => handleChapter(linkId)}
                  dangerouslySetInnerHTML={{
                    __html: chapter,
                  }}
                ></h4>
                <p
                  className={styles.gendaibun}
                  style={
                    orientation === "portrait"
                      ? {
                          fontSize: "var(--text-size-prt)",
                        }
                      : { fontSize: "var(--text-size)" }
                  }
                  dangerouslySetInnerHTML={{
                    __html: gendaibun,
                  }}
                ></p>
                <button
                  type="button"
                  onClick={() => handleChapter(linkId)}
                  className={styles.linkedbutton}
                >
                  横スクロールで見る
                </button>
                {/* <div className={styles.snsShareBox}>
                  <Link
                    href={`https://twitter.com/share?url=${url}&text=${
                      data.title
                    } ${chapter}`}
                  >
                    <a target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon
                        icon={faTwitter}
                        className={`${styles.snsShareIcon} ${styles.twitter}`}
                      />
                    </a>
                  </Link>
                  <Link
                    href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
                  >
                    <a target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon
                        icon={faFacebook}
                        className={`${styles.snsShareIcon} ${styles.facebook}`}
                      />
                    </a>
                  </Link>
                  <Link
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}
                  >
                    <a target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon
                        icon={faLinkedin}
                        className={`${styles.snsShareIcon} ${styles.linkedin}`}
                      />
                    </a>
                  </Link>
                </div> */}
              </article>
            );
          }

          // if (value === 1) {
          //   return (
          //     <article
          //       className={`${styles.article} ${styles[position]}`}
          //       key={ekotobasIndex}
          //     >
          //      {kobun}
          //     </article>
          //   );
          // }
          // if (value === 2) {
          //   return (
          //     <article
          //       className={`${styles.article} ${styles[position]}`}
          //       key={ekotobasIndex}
          //     >
          //     {gendaibun}
          //     </article>
          //   );
          // }
        })}
        <button className={styles.prev} onClick={nextSlide}>
          <FontAwesomeIcon icon={faAnglesLeft} />
        </button>
        <button className={styles.next} onClick={prevSlide}>
          <FontAwesomeIcon icon={faAnglesRight} />
        </button>
      </div>
    </div>
  );
};

export default ModalDesc;
