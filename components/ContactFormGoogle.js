import React, { useContext, useState } from "react";
import { AppContext } from "../pages/_app";
import { useRouter } from "next/router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/ContactFormGoogle.module.css";

const ContactFormGoogle = () => {
  const { closeContactModal } = useContext(AppContext);
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
      pathname: `/`,
    });
  };
  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeContactModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeContactModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>
        <div onLoad={redirect} className={styles.iframebox}>
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLScLvpswhpnpEuJwFvlcH_rsXr6ZTi2kPo25Fv1uZYaaMZFBwg/viewform?embedded=true"
            // width="640"
            // height="509"
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
            className={`${styles.iframe} scrollbar`}
          >
            読み込んでいます…
          </iframe>
        </div>
      </div>
    </div>
  );
};

export default ContactFormGoogle;
