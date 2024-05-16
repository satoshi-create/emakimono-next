import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/MapModal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClose,
  faAnglesLeft,
  faAnglesRight,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import AllLocation from "./AllLocation";

const MapModal = ({ data }) => {
  const {
    isModalOpen,
    closeMapModal,
    openModal,
    index,
    MapIndex,
    setMapIndex,
    handleToId,
  } = useContext(AppContext);
  const emakis = data.emakis;
  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");
  console.log(filterEkotobas);

  const handleChapter = (index) => {
    handleToId(index);
    closeMapModal();
  };

  const allLocation = [
    {
      ekotobaId: 0,
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
    setMapIndex((oldIndex) => {
      let index = oldIndex + 1;
      if (index > ekotobas.length - 1) {
        index = 0;
      }
      return index;
    });
  };

  const prevSlide = () => {
    setMapIndex((oldIndex) => {
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
      titleen: "basinmap",
      src: basinmap,
      path: "basinmap",
    },
      // {
      //   title: "目次",
      //   titleen: "chapter",
      //   src: basinmap,
      //   path: "chapter",
      // },
  ];

  // const toggleContents = v => {
  //   switch (v) {
  //     case 0:
  //       return googlemap
  //       break;
  //   case 1:
  //       return basinmap
  //     case 2:
  //       return
  //     default:
  //       break;
  //   }
  // }

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeMapModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeMapModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        {/* <div onClick={()=>setMapIndex(0)}>ホーム</div> */}
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
          if (ekotobasIndex === MapIndex) {
            position = "activeSlide";
          }
          if (
            ekotobasIndex === MapIndex - 1 ||
            (MapIndex === 0 && ekotobasIndex === ekotobas.length - 1)
          ) {
            position = "lastSlide";
          }
          if (value === 0) {
            return (
              <article
                className={`${styles.article} ${styles[position]}`}
                key={ekotobasIndex}
              >
                <iframe
                  src={googlemap}
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  className={styles.iframe}
                ></iframe>
                <div
                  className={styles.link}
                  onClick={() => handleChapter(linkId)}
                >
                  <h3>{chapterruby}</h3>
                  <h2>{chapter}</h2>
                  {/* <Link href={`#s${isMapIndex}`}>
                  <a onClick={closeMapModal}>
                    <h3>{chapterruby}</h3>
                    <h2>{chapter}</h2>
                  </a>
                </Link> */}
                </div>
              </article>
            );
          }
          if (value === 1) {
            return (
              <article
                className={`${styles.article} ${styles[position]}`}
                key={ekotobasIndex}
              >
                <iframe
                  src={basinmap}
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  className={styles.iframe}
                ></iframe>
                <div
                  className={styles.link}
                  onClick={() => handleChapter(linkId)}
                >
                  <h3>{chapterruby}</h3>
                  <h2>{chapter}</h2>
                  {/* <Link href={`#s${isMapIndex}`}>
                  <a onClick={closeMapModal}>
                    <h3>{chapterruby}</h3>
                    <h2>{chapter}</h2>
                  </a>
                </Link> */}
                </div>
              </article>
            );
          }
          // if (value === 2) {
          //   return (
          //      <h2 key={ekotobasIndex}>{chapter}</h2>
          //   );
          // }
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

export default MapModal;
