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

const Modal = ({ data }) => {
  const { isModalOpen, closeModal, openModal, index, setIndex } =
    useContext(AppContext);
  const emakis = data.emakis;
  const filterEkotobas = emakis.filter((item) => item.cat === "ekotoba");

  const { title, thumb } = data;

  const [value, setValue] = useState(0);

  const allMap = [
    {
      title: "目次",
    },
    {
      title: "書誌情報",
    },
  ];

  const toggleContets = (v) => {
    if (v === 0) {
      return (
        <>
          {filterEkotobas.map((item, i) => {
            const { chapter, linkId, chapterruby, desc } = item;
            return (
              <table className={styles.mokujitable} key={i}>
                <tbody>
                  <tr>
                    <th colSpan="4">{chapter}</th>
                  </tr>
                  <tr>
                    <td colSpan="1">
                      <figure>
                        <Image
                          src={thumb}
                          // layout="fill"
                          objectFit="cover"
                          width={200}
                          height={100}
                          alt={chapter}
                          loading="lazy"
                        />
                      </figure>
                    </td>
                    <td colSpan="3">{desc}</td>
                  </tr>
                </tbody>
              </table>
            );
          })}
        </>
      );
    } else if (v === 1) {
      return (
        <dl>
          <dt>{title}</dt>
        </dl>
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
