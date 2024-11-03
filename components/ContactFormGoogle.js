import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/ContactFormGoogle.module.css";

const ContactFormGoogle = () => {

  const { closeContactModal, setIsContactModalOpen  } = useContext(AppContext);
  const router = useRouter();
  // 初回表示か否かを判定するステートを定義しておく
  const [isFirst, setIsFirst] = useState(true);

    // フォーム回答後はリダイレクトさせる
  const redirect = () => {
    // 初回表示時はリダイレクトさせない
    if (isFirst) {
      setIsFirst(false);
      return;
    }

    router.push({
      // リダイレクト先のページ
      pathname: `/redirect-form`,
    });
   document.querySelector("html").classList.remove("open");
    setIsContactModalOpen(false);
  };
  return (
    <div className={`${styles.modal}`}>
      <div className={styles.MuiBackdrop} onClick={closeContactModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeContactModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <div onLoad={redirect} className={`${styles.iframebox} scrollbar`}>

          <iframe
           title="apply"
            src={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
            width="640"
            height="2446"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            className={`${styles.iframe}`}
          >
            読み込んでいます...
          </iframe>
        </div>
      </div>
    </div>
  );
};

export default ContactFormGoogle;

// Next.js(React)でGoogleフォーム回答後に任意のページにリダイレクトさせる// https://zenn.dev/tsukasa/articles/e09afca57ebe86
