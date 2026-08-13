import styles from "@/styles/EmakiInfo.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { eraNameEn } from "@/utils/func";

// 教育現場向けUI: isUIVisible で静止UI耐性に対応
// 全画面ビューアの最小メタ表示（タイトル + 時代/種別）に絞り込む。
// 順位/PV・キーワードはページ下部のメタ情報に集約するため表示しない。
const EmakiInfo = ({ value, isUIVisible = true }) => {
  const { type, title, titleen, typeen, era, eraen, edition } = value;
  const { locale } = useRouter();

  return (
    <div
      className={styles.container}
      style={{
        opacity: isUIVisible ? 1 : 0,
        pointerEvents: isUIVisible ? "auto" : "none",
        transition: "opacity 0.3s linear",
      }}
    >
      <h1 className={styles.title}>
        {locale === "en"
          ? titleen
          : `${title}${edition ? ` ${edition}` : ""}`}
      </h1>
      <Link href={`/era/${eraen}`}>
        <a className={styles.tag}>{`${
          locale === "en" ? eraNameEn(eraen) : `${era}時代`
        }`}</a>
      </Link>
      <Link href={`/type/${typeen}`}>
        <a className={styles.tag}>{`${locale === "en" ? typeen : type}`}</a>
      </Link>
    </div>
  );
};

export default EmakiInfo;
