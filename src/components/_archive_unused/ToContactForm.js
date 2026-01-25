import { AppContext } from "@/pages/_app";
import styles from "@/styles/ToContactForm.module.css";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
import { useRouter } from "next/router";
import { useContext } from "react";

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
      <a
        href="https://sour-brain-48f.notion.site/2f3994f0dfcd80409097f4cb44d2a80a?pvs=105"
        target="_blank"
        title="ご意見をお寄せください"
        className={styles.linkedbtn}
      >
        {locale == "en" ? "Submit Feedback" : "意見を送る"}
      </a>
    </div>
  );
};

export default ToContactForm;
