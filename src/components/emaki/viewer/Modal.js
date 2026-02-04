import ChapterList from "@/components/emaki/metadata/ChapterList";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/Modal.module.css";
import { eraColor } from "@/utils/func";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import { useTranslation } from "next-i18next";

const Modal = ({ data }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const { closeModal } = useContext(AppContext);

  const {
    reference,
    sourceImageUrl,
    sourceImage,
    era,
    typeen,
    title,
    titleen,
  } = data;
  const emakis = data.emakis;

  const [value, setValue] = useState(0);

  const allMap = [
    {
      label: typeen === "emaki" ? t("modal.chapter") : t("modal.title"),
    },
    {
      label: t("modal.bibliography"),
    },
    {
      label: t("modal.references"),
    },
  ];

  const toggleContets = (v) => {
    if (v === 0) {
      return (
        <ChapterList data={emakis} era={era} titleen={titleen} title={title} />
      );
    } else if (v === 1) {
      return (
        <p className={styles.source}>
          {t("modal.createdByModifying")}
          <br />
          <br />
          <Link href={sourceImageUrl}>
            <a
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sourceLink}
              style={{ color: eraColor(era) }}
            >
              {sourceImage}
            </a>
          </Link>
        </p>
      );
    } else if (v === 2) {
      return (
        <ul className={styles.reference}>
          {reference?.map((item, i) => {
            return (
              <li key={i}>
                <Link href={item.url}>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                    style={{ color: eraColor(era) }}
                  >
                    {`【${item.type}】
                          ${item.title}`}
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      );
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.MuiBackdrop} onClick={closeModal}></div>
      <div className={styles.container}>
        <div className={`${styles.closebtn} btn`} onClick={closeModal}>
          <FontAwesomeIcon icon={faClose} />
        </div>

        <div className={styles.tabcontainer}>
          {allMap.map((item, i) => {
            const { label } = item;
            return (
              <button
                onClick={() => setValue(i)}
                className={`btn ${styles.tabbtn} ${
                  value === i ? styles.activebtn : ""
                }`}
                key={i}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className={`${styles.contents} scrollbar`}>
          {toggleContets(value)}
        </div>
      </div>
    </div>
  );
};

export default Modal;
