import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/ContactFormGoogle.module.css";

const ContactFormGoogle = () => {
  const { locale } = useRouter();
  const { closeContactModal, setIsContactModalOpen } = useContext(AppContext);
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

  const formUrl =
    locale === "ja"
      ? "https://docs.google.com/forms/d/e/1FAIpQLScLvpswhpnpEuJwFvlcH_rsXr6ZTi2kPo25Fv1uZYaaMZFBwg/viewform?embedded=true"
      : "https://docs.google.com/forms/d/e/1FAIpQLSfBYAvwIKy2-8nWjDrFxX8QBMaY2I7B0VC13n3Lt2lRnvJHXA/viewform?embedded=true";

  https: return (
    <div className={`${styles.modal}`}>
      <div className={styles.MuiBackdrop} onClick={closeContactModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeContactModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <div onLoad={redirect} className={`${styles.iframebox} scrollbar`}>
          <iframe
            // src={process.env.NEXT_PUBLIC_GOOGLE_FORM_URL}
            src={formUrl}
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
            className={`${styles.iframe}`}
          >
            読み込んでいます…
          </iframe>
        </div>
      </div>
    </div>
  );
};

export default ContactFormGoogle;

// Next.js(React)でGoogleフォーム回答後に任意のページにリダイレクトさせる// https://zenn.dev/tsukasa/articles/e09afca57ebe86
