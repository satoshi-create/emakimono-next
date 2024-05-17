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

const ModalDesc = ({ data }) => {
  const {
    isModalOpen,
    closeMapModal,
    openModal,
    index,
    DescIndex,
    setDescIndex,
    handleToId,
    closeDescModal,
  } = useContext(AppContext);
  const emakis = data.emakis;
  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");
  console.log(DescIndex);

  const handleChapter = (index) => {
    handleToId(index);
    closeDescModal();
  };

  const { kobun, gendaibun, desc } = emakis[0];

  const [value, setValue] = useState(0);


    const nextSlide = () => {
      setDescIndex((oldIndex) => {
        let index = oldIndex + 1;
        if (index > filterEkotobas.length - 1) {
          index = 0;
        }
        return index;
      });
    };

    const prevSlide = () => {
      setDescIndex((oldIndex) => {
        let index = oldIndex - 1;
        if (index < 0) {
          index = filterEkotobas.length - 1;
        }
        return index;
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
                key={index}
              >
                {title}
              </button>
            );
          })}
        </div>

        {filterEkotobas.map((item, ekotobasIndex) => {
          const { gendaibun,chapter,linkId } = item;

          let position = "nextSlide";
          if (ekotobasIndex === DescIndex) {
            position = "activeSlide";
          }
          if (
            ekotobasIndex === DescIndex - 1 ||
            (DescIndex === 0 && ekotobasIndex === filterEkotobas.length - 1)
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
                  onClick={() => handleChapter(linkId)}
                  dangerouslySetInnerHTML={{
                    __html: chapter,
                  }}
                ></h4>
                <p
                  dangerouslySetInnerHTML={{
                    __html: gendaibun,
                  }}
                ></p>
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
