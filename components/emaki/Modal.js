import ChapterList from "@/components/emaki/ChapterList";
import { eraColor } from "@/libs/func";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/Modal.module.css";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useState } from "react";

const Modal = ({ data }) => {
  const { locale } = useRouter();
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
      title: typeen === "emaki" ? "段" : "タイトル",
    },
    {
      title: "書誌情報",
    },
    {
      title: "参照",
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
          {locale === "en"
            ? "Created by modifying the following"
            : "以下を加工して作成"}
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
            const { title } = item;
            return (
              <button
                onClick={() => setValue(i)}
                className={`btn ${styles.tabbtn} ${
                  value === i ? styles.activebtn : ""
                }`}
                key={i}
              >
                {title}
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
