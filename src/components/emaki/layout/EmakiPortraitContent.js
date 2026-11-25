import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import EmakiMetadataSection from "@/components/emaki/layout/EmakiMetadataSection";
import ViewerDiscoveryRail from "@/components/discovery/ViewerDiscoveryRail";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import { useSceneLikeCounts } from "@/context/SceneLikeCountsContext";
import styles from "@/styles/EmakiPortraitContent.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { isChojuGigaScroll } from "@/utils/buildChojuGigaHubData";
import { isHyakkiClusterScroll } from "@/utils/buildHyakkiHubData";
import { isByobuScroll } from "@/utils/isByobuScroll";
import { emakiDisplayTitle, getLocalizedField } from "@/utils/emakiDisplayTitle";
import {
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "@/utils/func";
import { faEye, faHeart, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import parse from "html-react-parser";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useMemo } from "react";
import { useTranslation } from "next-i18next";
import { getScrollCompositionForm } from "@/data/rakuchu-rakugai/rakuchuMotifMaster";
import { RAKUCHU_RAKUGAI_HUB_PATH } from "@/libs/constants/links";

const EmakiPortraitContent = ({
  data,
  emaki,
  locale: localeProp,
  selectedRef,
  navIndex,
  articleRef,
  viewerFullscreen = false,
}) => {
  const { rankingData } = useContext(AppContext);
  const { totalCount } = useSceneLikeCounts();

  const router = useRouter();
  const locale = localeProp ?? router.locale;
  const isJa = locale === "ja";
  const scrollMeta = emaki ?? data;
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

  const editionLinks = alldata.filter(
    (item) => item.title === title && item.edition !== edition
  );
  const LinksToKusouzu = alldata.filter(
    (item) => isKusouzuScroll(item) && item.titleen !== titleen
  );
  const LinksToChojuGiga = alldata.filter(
    (item) => isChojuGigaScroll(item) && item.titleen !== titleen
  );
  const LinksToHyakki = alldata.filter(
    (item) => isHyakkiClusterScroll(item) && item.titleen !== titleen
  );
  const isKusouzu = isKusouzuScroll(data);
  const isChojuGiga = isChojuGigaScroll(data);
  const isHyakki = isHyakkiClusterScroll(data);
  // 屏風（舟木本 等）は縦持ちでスライス幅が極小（約116px）になり、拡大時の
  // ラスタ解像度が不足する。高さにフロア（480px）を設けて初期レイアウト寸法を
  // 底上げする。buildSceneShellStyle 側の section 幅計算と必ず同値に保つこと。
  const isByobu = isByobuScroll(data);

  return (
    <>
      <EmakiConteiner
        key={data.id}
        data={{ ...data }}
        scroll={true}
        selectedRef={selectedRef}
        navIndex={navIndex}
        articleRef={articleRef}
        height={
          viewerFullscreen
            ? "var(--vh-100)"
            : "var(--vh-45)"
        }
        editionLinks={[
          ...editionLinks,
          ...(isKusouzu ? LinksToKusouzu : []),
          ...(isHyakki ? LinksToHyakki : []),
        ]}
        showKusouzuHubLink={isKusouzu}
        showChojuGigaHubLink={isChojuGiga}
        showHyakkiHubLink={isHyakki}
      />
      {!viewerFullscreen && (
      <div className={`${styles.wrapper} section-grid`}>
        <div className={styles.container}>
          <div className={styles.metadataA}>
            <div className={styles.titleRow}>
              <div className={styles.titleLeading}>
                <h3 className={styles.title}>
                  {emakiDisplayTitle(data, locale)}{" "}
                  {isJa && edition}
                </h3>
                {totalCount > 0 && (
                  <span
                    className={styles.totalLikesBadge}
                    aria-label={isJa ? "いいね総計" : "Total likes"}
                    title={isJa ? "いいね総計" : "Total likes"}
                  >
                    <FontAwesomeIcon icon={faHeart} aria-hidden />
                    {totalCount.toLocaleString()}
                  </span>
                )}
                {rankInfo && (
                  <Link href="/ranking">
                    <a className={styles.rankTag}>
                      <FontAwesomeIcon
                        icon={faTrophy}
                        className={styles.rankIcon}
                      />
                      {isJa
                        ? `${rankInfo.rank}位`
                        : `#${rankInfo.rank}`}
                      <span className={styles.rankDivider}>|</span>
                      <FontAwesomeIcon
                        icon={faEye}
                        className={styles.rankViewIcon}
                      />
                      {Number(rankInfo.pageView).toLocaleString()}
                    </a>
                  </Link>
                )}
                {getScrollCompositionForm(data?.titleen) && (
                  <Link
                    href={`${RAKUCHU_RAKUGAI_HUB_PATH}?form=${getScrollCompositionForm(data?.titleen).formId}#composition`}
                  >
                    <a
                      className={styles.compositionBadge}
                      title={
                        isJa
                          ? "洛中洛外図の構図形式と主要モチーフを見る"
                          : "View Rakuchū-rakugai-zu composition & motifs"
                      }
                    >
                      <span>
                        {isJa
                          ? getScrollCompositionForm(data?.titleen).badgeJa
                          : getScrollCompositionForm(data?.titleen).badgeEn}
                      </span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </Link>
                )}
              </div>
            </div>
            {author && (
              <Link href={`/author/${authoren}`}>
                <a className={styles.authorLink}>
                  <h4 className={styles.author}>
                    {getLocalizedField(data, "author", locale)}
                  </h4>
                </a>
              </Link>
            )}
          </div>

          <EmakiMetadataSection
            data={scrollMeta}
            emaki={scrollMeta}
            locale={locale}
            styles={styles}
            descContent={isJa ? parse(descJa) : parse(descEn)}
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
          <div className={styles.discoveryBelow}>
            <ViewerDiscoveryRail data={data} />
          </div>
        </div>
      </div>
      )}
      {!viewerFullscreen && <Footer />}
    </>
  );
};

export default EmakiPortraitContent;
