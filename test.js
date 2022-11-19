import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/Modal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const Modal = ({ data }) => {
  const [value, setValue] = useState(0);

  const allTag = [
    {
      sectiontitle: "キーワード",
      sectiontitleen: "keywords",
      allTags: allKeywords,
      path: "keyword",
    },
    {
      sectiontitle: "人物名",
      sectiontitleen: "personnames",
      allTags: allPersonNames,
      path: "personname",
    },
  ];

  const { sectiontitle, sectiontitleen, allTags, path } = allTag[value];

  const [opc, setOpc] = useState(0.5);
  const [toggleMap, setToggleMap] = useState(true);
  console.log(opc);
  console.log(toggleMap);

  const { isModalOpen, closeModal, openModal } = useContext(AppContext);
  console.log(data);
  const emakis = data.emakis;
  const { googlemap, basinmap, title, mapWidth, mapHeight } = data;
  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <figure className={styles.figure}>
          {/* googlemap */}
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d15414.822865578184!2d139.82582089467476!3d35.707879529814385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z5ZC-5ays5p2c!5e0!3m2!1sja!2sjp!4v1668769680120!5m2!1sja!2sjp"
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            width={768}
            height={500}
          ></iframe>
          {/* 国土地理院地図 */}
          {toggleMap && (
            <Iframe
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              opc={opc}
              width={768}
              height={500}
              src="https://maps.gsi.go.jp/?hc=hic#14/35.708921/139.825315/&ls=anaglyphmap_color&disp=1&vs=c1g1j0h0k0l0u0t0z0r0s0m0f0"
            />
          )}

          {/* {emakis.map((item, index) => {
            const { cat, chapter, translateX, translateY } = item;
            if (cat === "ekotoba") {
              return (
                <svg viewBox={`0 0 ${mapWidth} ${mapHeight}`} key={index}>
                  <Link href={`#s${index}`}>
                    <a onClick={closeModal}>
                      <title>{chapter}</title>
                      <path
                        id="location-dot-solid"
                        d="M12.671,29.326c3.014-3.771,9.887-12.912,9.887-18.047A11.279,11.279,0,0,0,0,11.279c0,5.134,6.873,14.275,9.887,18.047A1.775,1.775,0,0,0,12.671,29.326ZM11.279,15.039a3.76,3.76,0,1,1,3.76-3.76A3.763,3.763,0,0,1,11.279,15.039Z"
                        transform={`translate(${translateX} ${translateY})`}
                        fill="#ff7d7d"
                      />
                    </a>
                  </Link>
                </svg>
              );
            }
          })} */}
        </figure>
        <div className={styles.generator}>
          <div className={styles.generatorbox}>
            <input
              type="range"
              name="地形図"
              min="0"
              max="1"
              step="0.05"
              defaultValue={opc}
              className={styles.generatorslider}
              onChange={(e) => setOpc(e.target.value)}
            />
            <p
              className={styles.generatortext}
              onClick={() => setToggleMap(!toggleMap)}
            >
              地形図
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Iframe = styled.iframe`
  opacity: ${(props) => props.opc};
`;

export default Modal;
