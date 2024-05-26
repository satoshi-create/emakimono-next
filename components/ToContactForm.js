import React,{useContext} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import styles from "../styles/ToContactForm.module.css";
import { AppContext } from "../pages/_app";

const ToContactForm = () => {
  const { openContactModal } = useContext(AppContext);
  return (
    <div className={styles.contact}>
      <FontAwesomeIcon icon={faPaperPlane} className={styles.contacticon} />

      <h4>ご意見をお寄せください</h4>
      <p>
        当サイトの使いやすさを改善するためのご意見を受け付けています。
        <br />
        改善点、気になる点などがありましたら、こちらのフォームよりご意見をお寄せください。
      </p>
      <button
        className={styles.linkedbtn}
        onClick={() => openContactModal(true)}
      >
        意見を送る
      </button>
    </div>
  );
};

export default ToContactForm;
