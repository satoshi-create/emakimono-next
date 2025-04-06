import React, { useContext } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import styles from "../styles/ToContactForm.module.css";
import { AppContext } from "../pages/_app";
import { useRouter } from "next/router";
import parse from "html-react-parser";

const ToContactForm = () => {
  const { locale } = useRouter();
  const { openContactModal } = useContext(AppContext);

  const data = {
    ja: {
      title: "ご意見をお寄せください",
      text: `当サイトの使いやすさを改善するためのご意見を受け付けています。<br />改善点、気になる点などがありましたら、こちらのフォームよりご意見をお寄せください`,
    },
    en: {
      title: "We Value Your Feedback",
      text: `We welcome your feedback to help improve the usability of this site.<br />If you have suggestions, concerns, or ideas, please let us know using this form.`,
    },
  };

  return (
    <div className={styles.contact}>
      <FontAwesomeIcon icon={faPaperPlane} className={styles.contacticon} />

      <h4>{locale == "en" ? data.en.title : data.ja.title}</h4>
      <p>{locale == "en" ? parse(data.en.text) : parse(data.ja.text)}</p>
      <button
        className={styles.linkedbtn}
        onClick={() => openContactModal(true)}
      >
        {locale == "en" ? "Submit Feedback" : "意見を送る"}
      </button>
    </div>
  );
};

export default ToContactForm;
