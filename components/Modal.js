import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/Modal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const Modal = ({ emakis }) => {
  const { isModalOpen, closeModal, openModal } = useContext(AppContext);
  console.log(emakis);
  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <ul className={styles.mokuji}>
          {emakis.map((item, index) => {
            const { cat, chapter } = item;
            if (cat === "ekotoba") {
              return (
                <li key={index} onClick={closeModal}>
                  <Link href={`#s${index}`}>
                    <a
                      className={styles.navlink}
                      dangerouslySetInnerHTML={{ __html: chapter }}
                    ></a>
                  </Link>
                </li>
              );
            }
          })}
        </ul>
      </div>
    </div>
  );
};

export default Modal;
