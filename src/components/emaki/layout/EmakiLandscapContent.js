import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiMetadataSection from "@/components/emaki/layout/EmakiMetadataSection";
import RecommendEmaki from "@/components/emaki/ranking/RecommendEmaki";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/EmakiLandscapContent.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { emakiDisplayTitle } from "@/utils/emakiDisplayTitle";
import {
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "@/utils/func";
import { faEye, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
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
  const { rankingData } = useContext(AppContext);
  const { locale } = useRouter();
  const { t: alldata } = useLocaleData();

  const removeNestedArrayObj = ExtractingListData();
  const allKeywords = keywordItem(removeNestedArrayObj);

  const {
    typeen,
    title,
    titleen,
    edition,
    author,
    authoren,
    desc,
    descen,
    keyword,
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
    : `You can enjoy all the scenes of the " ${emakiDisplayTitle(data, "en")} ${
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
              <div className={styles.titleRow}>
                <div className={styles.titleLeading}>
                  <h1 className={styles.title}>
                    {emakiDisplayTitle(data, locale)}{" "}
                    {locale === "ja" && edition}
                  </h1>
                  {rankInfo && (
                    <Link href="/ranking">
                      <a className={styles.rankTag}>
                        <FontAwesomeIcon
                          icon={faTrophy}
                          className={styles.rankIcon}
                        />
                        {locale === "en"
                          ? `#${rankInfo.rank}`
                          : `${rankInfo.rank}位`}
                        <span className={styles.rankDivider}>|</span>
                        <FontAwesomeIcon
                          icon={faEye}
                          className={styles.rankViewIcon}
                        />
                        {Number(rankInfo.pageView).toLocaleString()}
                      </a>
                    </Link>
                  )}
                </div>
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
              {/* ハブリンクは metadataB のバナーで提示するため、ここには置かない */}
            </div>
            <EmakiMetadataSection
              data={data}
              locale={locale}
              styles={styles}
              descContent={
                descToParagraphs(locale === "en" ? descEn : descJa) ??
                parse(locale === "en" ? descEn : descJa)
              }
              eraTagTextColor
              showRepresentativeLink={isKusouzu && titleen !== "kusouzumaki"}
            />
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
