import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiMetadataSection from "@/components/emaki/layout/EmakiMetadataSection";
import RecommendEmaki from "@/components/emaki/ranking/RecommendEmaki";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/EmakiPortraitContent.module.css";
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
import { useTranslation } from "next-i18next";

const EmakiPortraitContent = ({ data, selectedRef, navIndex, articleRef, viewerFullscreen = false }) => {
  const { rankingData } = useContext(AppContext);

  const { locale } = useRouter();
  const { t: alldata } = useLocaleData();
  const { t } = useTranslation("common");

  const {
    typeen,
    title,
    edition,
    author,
    authoren,
    desc,
    descen,
    keyword,
    titleen,
  } = data;

  // ランキング順位・閲覧数を検索
  const rankInfo = useMemo(() => {
    const index = rankingData.findIndex((item) => item.titleen === titleen);
    if (index < 0) return null;
    return { rank: index + 1, pageView: rankingData[index].pageView };
  }, [rankingData, titleen]);

  const removeNestedArrayObj = ExtractingListData();
  const allKeywords = keywordItem(removeNestedArrayObj);

  const descTemp = `「${title} ${edition ? edition : ""}」${
    author ? `（${author}）` : ""
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const descTJaSeiyoukaiga = desc
    ? desc
    : `「${title} ${edition ? edition : ""}」${
        author ? `（${author}）` : ""
      }の全シーンを、横スクロールで楽しむことができます。`;

  const descJa = typeen === "seiyoukaiga" ? descTJaSeiyoukaiga : descTemp;

  const descEn = descen
    ? descen
    : `You can enjoy all the scenes of the " ${emakiDisplayTitle(data, "en")} ${
        authoren && `（${authoren}）`
      } " in vertical and right to left scrolling mode.`;

  const editionLinks = alldata.filter(
    (item) => item.title === title && item.edition !== edition
  );
  const LinksToKusouzu = alldata.filter(
    (item) => isKusouzuScroll(item) && item.titleen !== titleen
  );
  const LinksToChojuGiga = alldata.filter(
    (item) => isChojuGigaScroll(item) && item.titleen !== titleen
  );
  const isKusouzu = isKusouzuScroll(data);
  const isChojuGiga = isChojuGigaScroll(data);

  return (
    <>
      <EmakiConteiner
        key={data.id}
        data={{ ...data }}
        scroll={true}
        selectedRef={selectedRef}
        navIndex={navIndex}
        articleRef={articleRef}
        height={viewerFullscreen ? "var(--vh-100)" : "var(--vh-45)"}
        editionLinks={[
          ...editionLinks,
          ...(isKusouzu ? LinksToKusouzu : []),
        ]}
        showKusouzuHubLink={isKusouzu}
        showChojuGigaHubLink={isChojuGiga}
      />
      {!viewerFullscreen && (
      <div className={`${styles.wrapper} section-grid`}>
        <div className={styles.container}>
          <div className={styles.metadataA}>
            <div className={styles.titleRow}>
              <div className={styles.titleLeading}>
                <h3 className={styles.title}>
                  {emakiDisplayTitle(data, locale)}{" "}
                  {locale === "ja" && edition}
                </h3>
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
                  <h4 className={styles.author}>
                    {locale === "ja" ? author : authoren}
                  </h4>
                </a>
              </Link>
            )}
          </div>

          <EmakiMetadataSection
            data={data}
            locale={locale}
            styles={styles}
            descContent={locale === "en" ? parse(descEn) : parse(descJa)}
            tagCloud={
              keyword && (
                <div className={styles.tagCloud}>
                  <CustomTagCloud
                    tags={filterdKeywords(keyword, allKeywords)}
                    emakiPage={true}
                    compact
                  />
                </div>
              )
            }
          />

          {/* {(typeen === "seiyoukaiga" || keyword) && <CardC data={data} />} */}
          <RecommendEmaki data={data} />
        </div>
      </div>
      )}
      {!viewerFullscreen && <Footer />}
    </>
  );
};

export default EmakiPortraitContent;
