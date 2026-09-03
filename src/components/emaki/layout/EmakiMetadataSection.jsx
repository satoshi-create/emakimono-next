/**
 * 絵巻ページのメタ情報セクション（紹介文・時代/カテゴリ・ハブリンク・出典・参考文献）。
 *
 * EmakiLandscapContent / EmakiPortraitContent の metadataB を共通化したもの。
 * metadataA（タイトル・ランキング・author・操作ボタン）は各レイアウトに残す。
 *
 * 差分は props で吸収:
 * - descContent: 紹介文のレンダリング結果（段落分割 or parse は呼び出し側で決める）
 * - eraTagTextColor: Landscape のみ（era タグの文字色を白/黒に強制）
 * - showRepresentativeLink: Landscape のみ（九相図代表巻リンク）
 * - tagCloud: Portrait のみ（metadataB 内 compact タグクラウド。Landscape は subgrid 側に配置）
 */
import KusouzuHubLink from "@/components/emaki/kusouzu/KusouzuHubLink";
import KusouzuModelLink from "@/components/emaki/kusouzu/KusouzuModelLink";
import EmakiPersonLinks from "@/components/emaki/metadata/EmakiPersonLinks";
import ChojuGigaHubLink from "@/components/emaki/chouju-giga/ChojuGigaHubLink";
import SightseeingMapLink from "@/components/emaki/hub/SightseeingMapLink";
import SourceAttribution from "@/components/emaki/metadata/SourceAttribution";
import MangaRootsEmakiLink from "@/components/manga-roots/MangaRootsEmakiLink";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { eraColor } from "@/utils/func";
import Link from "next/link";
import { useTranslation } from "next-i18next";

const EmakiMetadataSection = ({
  data,
  locale,
  styles,
  descContent,
  eraTagTextColor = false,
  showRepresentativeLink = false,
  tagCloud = null,
}) => {
  const { t } = useTranslation("common");
  const {
    type,
    typeen,
    eraen,
    era,
    title,
    titleen,
    sourceImage,
    sourceImageUrl,
    sourceAuthor,
    sourceCollection,
    sourceLicense,
    reference,
    personname,
  } = data;

  const isKusouzu = isKusouzuScroll(data);
  const isChojuGiga = isChojuGigaScroll(data);

  return (
    <div className={styles.metadataB}>
      {/* 絵巻の紹介 */}
      <h4
        className={styles.metaBtitle}
        style={{
          "--border-color": eraColor(era) || "black", // カスタムプロパティを渡す
        }}
      >
        {locale == "en" ? "Introduction to Emaki" : "絵巻の紹介"}
      </h4>
      <div className={styles.desc}>{descContent}</div>
      {/*カテゴリー・時代タグ（紹介文の直後に置く）*/}
      <div className={styles.cat}>
        <Link href={`/era/${eraen}`}>
          <a
            className={styles.era}
            style={{
              border: eraColor(era),
              backgroundColor: eraColor(era),
              ...(eraTagTextColor
                ? { color: eraColor(era) ? "white" : "black" }
                : {}),
            }}
          >
            {locale === "en" ? `${eraen} period` : `${era}`}
          </a>
        </Link>
        <Link href={`/type/${typeen}`} className={styles.type}>
          <a>{locale === "en" ? typeen : type}</a>
        </Link>
      </div>
      <span
        className={styles.borderline}
        style={{ margin: "1rem 0 0.5rem 0" }}
      ></span>
      {isKusouzu && (
        <>
          <KusouzuHubLink variant="banner" />
          <KusouzuModelLink personname={personname} />
          {showRepresentativeLink && (
            <Link href="/kusouzumaki">
              <a className={styles.representativeLink}>
                {t("kusouzuHub.representativeLinkLabel")}
              </a>
            </Link>
          )}
        </>
      )}
      {!isKusouzu && <EmakiPersonLinks personname={personname} />}
      {isChojuGiga && <ChojuGigaHubLink variant="banner" />}
      <SightseeingMapLink titleen={titleen} variant="banner" />
      <MangaRootsEmakiLink titleen={titleen} locale={locale} />
      {tagCloud}
      {/*メタ情報（出典・参考文献は折りたたみ表示）*/}
      <details className={styles.authority}>
        <summary className={styles.authoritySummary}>
          {locale === "en" ? "Source & References" : "出典・参考文献"}
        </summary>
        <SourceAttribution
          sourceImageUrl={sourceImageUrl}
          sourceImage={sourceImage}
          sourceTitle={title}
          sourceTitleen={titleen}
          sourceAuthor={sourceAuthor}
          sourceCollection={sourceCollection}
          license={sourceLicense}
          linkClassName={styles.sourceLink}
          showGuide={false}
        />
        {reference?.length > 0 && (
          <>
            <p className={styles.refLabel}>
              {locale === "en" ? "References" : "参考文献"}
            </p>
            <ul>
              {reference.map((item, i) => (
                <li key={i}>
                  <Link href={item.url ? item.url : "/"}>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      {item.title}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </details>
    </div>
  );
};

export default EmakiMetadataSection;
