import styles from "@/styles/HomeSectionLink.module.css";
import Link from "next/link";
import { useTranslation } from "next-i18next";

/** トップ各セクション末尾 — 絵巻ギャラリー（/type/emaki）への導線 */
const HomeGalleryLink = ({ surface }) => {
  const { t } = useTranslation("common");

  return (
    <div
      className={`section-grid ${styles.wrap} ${
        surface ? styles.wrapSurface : ""
      }`}
    >
      <Link href="/type/emaki">
        <a>
          <button type="button" className={styles.btn}>
            {t("home.galleryLink")}
          </button>
        </a>
      </Link>
    </div>
  );
};

export default HomeGalleryLink;
