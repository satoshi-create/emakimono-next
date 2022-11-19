import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/Modal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faLocationDot } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";
import Title from "./Title";

const Modal = ({ data }) => {
  const { isModalOpen, closeModal, openModal } = useContext(AppContext);
  const emakis = data.emakis;
  console.log(emakis[0]);
  const { googlemap, basinmap, mapWidth, mapHeight } = data;

  const [value, setValue] = useState(0);

  const allMap = [
    {
      title: "googleマップ",
      titleen: "googlemap",
      src: "https://www.google.com/maps/embed?pb=!1m16!1m12!1m3!1d15414.822865578184!2d139.82582089467476!3d35.707879529814385!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!2m1!1z5ZC-5ays5p2c!5e0!3m2!1sja!2sjp!4v1668769680120!5m2!1sja!2sjp",
      path: "googlemap",
    },
    {
      title: "国土地理院地図",
      titleen: "personnames",
      src: "https://maps.gsi.go.jp/?hc=hc#15/35.705701/139.826752/&base=std&ls=std%7Canaglyphmap_color%2C0.82&blend=0&disp=11&vs=c1g1j0h0k0l0u0t0z0r0s0m0f0",
      path: "basinmap",
    },
  ];

  const { title, src } = allMap[value];

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
        <figure className={styles.figure}>
          <iframe
            src={src}
            frameBorder="0"
            scrolling="no"
            marginHeight="0"
            marginWidth="0"
            width={768}
            height={500}
          ></iframe>
        </figure>
        <div className={styles.link}>
          <Link href={`#s0`}>
            <a onClick={closeModal}>吾嬬杜夜雨</a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Modal;
