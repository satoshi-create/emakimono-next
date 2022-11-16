import React, { useContext } from "react";
import { AppContext } from "../pages/_app";
import styles from "../styles/Modal.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";

const Modal = () => {
  const { isModalOpen, closeModal, openModal } = useContext(AppContext);
  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
      </div>
    </div>
  );
};

export default Modal;
