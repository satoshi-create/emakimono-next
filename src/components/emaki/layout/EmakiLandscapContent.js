import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import SourceAttribution from "@/components/emaki/metadata/SourceAttribution";
import LikeButton from "@/components/emaki/metadata/LikeButton";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import RecommendEmaki from "@/components/emaki/ranking/RecommendEmaki";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import KusouzuHubLink from "@/components/emaki/kusouzu/KusouzuHubLink";
import KusouzuModelLink from "@/components/emaki/kusouzu/KusouzuModelLink";
import ChojuGigaHubLink from "@/components/emaki/chouju-giga/ChojuGigaHubLink";
import SightseeingMapLink from "@/components/emaki/hub/SightseeingMapLink";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/EmakiLandscapContent.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import {
  eraColor,
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "@/utils/func";
import { faEye, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useMemo } from "react";

const EmakiLandscapContent = ({
  data,
  selectedRef,
  navIndex,
  articleRef,
  viewerFullscreen = false,
}) => {
  const { handleFullScreen, rankingData } = useContext(AppContext);
  const { locale } = useRouter();
  const { t: alldata } = useLocaleData();
  const { t } = useTranslation("common");

  const removeNestedArrayObj = ExtractingListData();
  const allKeywords = keywordItem(removeNestedArrayObj);

  const {
    type,
    typeen,
    eraen,
    era,
    title,
    titleen,
    edition,
    author,
    authoren,
    desc,
    descen,
    sourceImage,
    sourceImageUrl,
    sourceAuthor,
    sourceCollection,
    sourceLicense,
    reference,
    personname,
    keyword,
    genjieslug,
  } = data;

  // ランキング順位・閲覧数を検索
  const rankInfo = useMemo(() => {
    const index = rankingData.findIndex((item) => item.titleen === titleen);
    if (index < 0) return null;
    return { rank: index + 1, pageView: rankingData[index].pageView };
  }, [rankingData, titleen]);

  const descTJa = desc
    ? desc
    : `「${title} ${edition ? edition : ""}」${
        author ? `（${author}）` : ""
      }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const descTJaSeiyoukaiga = desc
    ? desc
    : `「${title} ${edition ? edition : ""}」${
        author ? `（${author}）` : ""
      }の全シーンを、横スクロールで楽しむことができます。`;

  const descJa = typeen === "seiyoukaiga" ? descTJaSeiyoukaiga : descTJa;

  const descEn = descen
    ? descen
    : `You can enjoy all the scenes of the " ${titleen} ${
        authoren && `（${authoren}）`
      } " in vertical and right to left scrolling mode.`;

  // 紹介文を「。」/「.」で段落分割して複数 <p> で表示（HTML を含む desc は分割しない）
  const descToParagraphs = (text) => {
    if (!text || text.includes("<")) return null;
    return text
      .split(/(?<=[。.])/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((p, i) => <p key={i}>{p}</p>);
  };

  const editionLinks = alldata.filter(
    (item) => item.title === title && item.edition !== edition,
  );

  const LinksToKusouzu = alldata.filter(
    (item) => isKusouzuScroll(item) && item.titleen !== titleen,
  );

  const LinksToChojuGiga = alldata.filter(
    (item) => isChojuGigaScroll(item) && item.titleen !== titleen,
  );

  const isKusouzu = isKusouzuScroll(data);
  const isChojuGiga = isChojuGigaScroll(data);

  return (
    <>
      <div
        className={
          viewerFullscreen ? styles.fullscreenShell : "emaki-page-landscape-grid"
        }
      >
        <div
          className={viewerFullscreen ? styles.fullscreenViewer : styles.wrapper}
        >
          <EmakiConteiner
            key={data.id}
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            articleRef={articleRef}
            overflowX={"scroll"}
            height={
              viewerFullscreen
                ? "var(--vh-100)"
                : "var(--vh-75)"
            }
            editionLinks={[
              ...editionLinks,
              ...(isKusouzu ? LinksToKusouzu : []),
            ]}
            showKusouzuHubLink={isKusouzu}
            showChojuGigaHubLink={isChojuGiga}
          />
          {!viewerFullscreen && (
            <>
          <div className={styles.metadata}>
            <div className={styles.metadataA}>
              <h1 className={styles.title}>
                {locale === "ja" ? title : titleen} {locale === "ja" && edition}
              </h1>
              {rankInfo && (
                <Link href="/ranking">
                  <a className={styles.rankTag}>
                    <FontAwesomeIcon icon={faTrophy} className={styles.rankIcon} />
                    {locale === "en" ? `#${rankInfo.rank}` : `${rankInfo.rank}位`}
                    <span className={styles.rankDivider}>|</span>
                    <FontAwesomeIcon icon={faEye} className={styles.rankViewIcon} />
                    {Number(rankInfo.pageView).toLocaleString()}
                  </a>
                </Link>
              )}
              <div className={styles.actionGroup}>
                <button
                  type="button"
                  value="Lock Landscape"
                  onClick={() => handleFullScreen("landscape")}
                  className={styles.linkedbutton}
                >
                  {t("viewer.fullscreeBtn")}
                </button>
                <LikeButton
                  title={title}
                  titleen={titleen}
                  edition={edition}
                  author={author}
                  ort={"land"}
                />
                <ShareButtons
                  variant="inline"
                  navIndex={0}
                  emakiId={titleen}
                  shareTitle={
                    locale === "en"
                      ? titleen || title
                      : `${title ?? ""}${edition ? ` ${edition}` : ""}`.trim()
                  }
                />
              </div>
              {author && (
                <Link href={`/author/${authoren}`}>
                  <a className={styles.authorLink}>
                    <h2 className={styles.author}>
                      {locale === "ja" ? author : authoren}
                    </h2>
                  </a>
                </Link>
              )}
              {genjieslug && (
                <div className={`${styles.genjieslugBox}`}>
                  <Link href={`/genjie/chapters-genji`}>
                    <a className={styles.genjieslugTitle}>源氏物語54帖一覧</a>
                  </Link>
                </div>
              )}
              {/* ハブリンクは metadataB のバナーで提示するため、ここには置かない */}
            </div>
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
              <div className={styles.desc}>
                {descToParagraphs(locale === "en" ? descEn : descJa) ??
                  parse(locale === "en" ? descEn : descJa)}
              </div>
              {/*カテゴリー・時代タグ（紹介文の直後に置く）*/}
              <div className={styles.cat}>
                <Link href={`/era/${eraen}`}>
                  <a
                    className={styles.era}
                    style={{
                      border: eraColor(era),
                      backgroundColor: eraColor(era),
                      color: eraColor(era) ? "white" : "black",
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
                  {titleen !== "kusouzumaki" && (
                    <Link href="/kusouzumaki">
                      <a className={styles.representativeLink}>
                        {t("kusouzuHub.representativeLinkLabel")}
                      </a>
                    </Link>
                  )}
                </>
              )}
              {isChojuGiga && (
                <>
                  <ChojuGigaHubLink variant="banner" />
                </>
              )}
              <SightseeingMapLink titleen={titleen} variant="banner" />
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
                      {reference.map((item, i) => {
                        return (
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
                        );
                      })}
                    </ul>
                  </>
                )}
              </details>
            </div>
          </div>
          <div className={styles.subgrid}>
            {/* おすすめの絵巻 */}
            {keyword && (
              <div className={styles.tagCloud}>
                <CustomTagCloud
                  tags={filterdKeywords(keyword, allKeywords)}
                  emakiPage={true}
                />
              </div>
            )}
            <aside className={`${styles.recommendEmaki} scrollbar`}>
              <RecommendEmaki data={data} />
              {/* {(typeen === "seiyoukaiga" || keyword) && <CardC data={result} />} */}
            </aside>
          </div>
          {/* <RankingCard /> */}
            </>
          )}
        </div>
      </div>
      {!viewerFullscreen && <Footer />}
    </>
  );
};

export default EmakiLandscapContent;
