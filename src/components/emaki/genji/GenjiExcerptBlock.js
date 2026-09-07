import styles from "@/styles/GenjiHub.module.css";
import { useTranslation } from "next-i18next";

const GenjiExcerptBlock = ({
  label,
  text,
  href,
  linkLabel,
  classical = false,
}) => {
  const { t } = useTranslation("common");
  if (!text && !href) return null;

  return (
    <div className={styles.excerptBlock}>
      <p className={styles.excerptLabel}>{label}</p>
      {text ? (
        <p
          className={
            classical ? styles.excerptTextClassical : styles.excerptTextModern
          }
        >
          {text}
        </p>
      ) : (
        <p className={styles.excerptTextModern}>{t("genjiHub.excerptEmpty")}</p>
      )}
      {href && (
        <a
          className={styles.excerptLink}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkLabel}
        </a>
      )}
    </div>
  );
};

export default GenjiExcerptBlock;
