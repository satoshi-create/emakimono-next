import styles from "@/styles/EmakiInfo.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { eraNameEn } from "@/utils/func";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";
import GenjiHubLink from "@/components/genji/GenjiHubLink";

// 教育現場向けUI: isUIVisible で静止UI耐性に対応
// 全画面ビューアの最小メタ表示（タイトル + 時代/種別）に絞り込む。
// 順位/PV・キーワードはページ下部のメタ情報に集約するため表示しない。
const EmakiInfo = ({ value, isUIVisible = true }) => {
  const { type, title, titleen, typeen, era, eraen, edition } = value;
  const { locale } = useRouter();
  const isJa = locale === "ja";
  // 源氏物語系の絵巻のみハブリンクを表示
  const isGenji =
    typeof titleen === "string" &&
    (titleen === "genjimonogatari-emaki-tokugawa" || titleen.includes("genji"));

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
        {isJa
          ? `${title}${edition ? ` ${edition}` : ""}`
          : titleen}
      </h1>
      <Link href={`/era/${eraen}`}>
        <a className={styles.tag}>{`${
          isJa ? `${era}時代` : eraNameEn(eraen)
        }`}</a>
      </Link>
      <Link href={`/type/${typeen}`}>
        <a className={styles.tag}>{`${getLocalizedField(value, "type", locale)}`}</a>
      </Link>
      {isGenji && <GenjiHubLink />}
    </div>
  );
};

export default EmakiInfo;
