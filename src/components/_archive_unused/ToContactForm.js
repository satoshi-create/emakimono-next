import { NOTION_CONTACT_URL } from "@/libs/constants/links";
import styles from "@/styles/ToContactForm.module.css";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const ToContactForm = () => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");

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
        href={NOTION_CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={t("header.feedback")}
        className={styles.linkedbtn}
      >
        {locale == "en" ? "Submit Feedback" : "意見を送る"}
      </a>
    </div>
  );
};

export default ToContactForm;
