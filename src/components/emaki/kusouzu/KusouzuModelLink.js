import styles from "@/styles/KusouzuHubLink.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

/**
 * 九相図絵巻の「主題となったモデル」リンク。
 * personname の先頭人物（例: 檀林皇后）の紹介ページへ誘導する。
 */
const KusouzuModelLink = ({ personname }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  if (!personname || personname.length === 0) return null;

  const model = personname[0];
  const modelName = locale === "en" ? model.id : model.name;

  return (
    <Link href={`/personname/${model.slug}`}>
      <a className={styles.model}>
        <span className={styles.modelLabel}>
          {t("kusouzuHub.modelLinkLabel")}
        </span>
        <span className={styles.modelName}>{modelName}</span>
        <span className={styles.modelArrow}>→</span>
      </a>
    </Link>
  );
};

export default KusouzuModelLink;
