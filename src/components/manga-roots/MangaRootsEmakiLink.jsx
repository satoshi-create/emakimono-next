import { getMangaRootsEgoGraph, isMangaRootsEmaki } from "@/data/mangaRoots";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import styles from "@/styles/MangaRootsEmakiLink.module.css";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const DynamicMangaRootsNetwork = dynamic(
  () => import("@/components/manga-roots/MangaRootsNetwork"),
  { ssr: false, loading: () => <div className={styles.loading} /> }
);

const MangaRootsEmakiLink = ({ titleen, locale }) => {
  const { t } = useTranslation("common");
  if (!isMangaRootsEmaki(titleen)) return null;
  const graph = getMangaRootsEgoGraph(titleen, emakisData);
  if (!graph) return null;

  return (
    <div className={styles.block}>
      <h4 className={styles.title}>{t("mangaRoots.emakiMetaTitle")}</h4>
      <p className={styles.desc}>{t("mangaRoots.emakiMetaDesc")}</p>
      <DynamicMangaRootsNetwork graph={graph} t={t} locale={locale} variant="ego" />
      <Link href={`/manga-roots?emaki=${encodeURIComponent(titleen)}#network`}>
        <a className={`${styles.cta} ${styles.footer}`}>{t("mangaRoots.emakiMetaCta")}</a>
      </Link>
    </div>
  );
};

export default MangaRootsEmakiLink;
