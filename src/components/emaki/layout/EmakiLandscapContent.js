import ToContactForm from "@/components/_archive_unused/ToContactForm";
import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import ChapterDesc from "@/components/emaki/metadata/ChapterDesc";
import ChapterTimeline from "@/components/emaki/metadata/ChapterTimeline";
import EditionLinks from "@/components/emaki/metadata/EditionLinks";
import SourceAttribution from "@/components/emaki/metadata/SourceAttribution";
import LikeButton from "@/components/emaki/metadata/LikeButton";
import RecommendEmaki from "@/components/emaki/ranking/RecommendEmaki";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import KusouzuHubLink from "@/components/emaki/kusouzu/KusouzuHubLink";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/EmakiLandscapContent.module.css";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import {
  eraColor,
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "@/utils/func";
import { faEye, faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, VStack } from "@chakra-ui/react";
import parse from "html-react-parser";
import { useTranslation } from "next-i18next";
import Image from "next/image";
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
  const { emakis } = data;
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
    reference,
    personname,
    keyword,
    genjieslug,
    kotobagaki,
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

  const editionLinks = alldata.filter(
    (item) => item.title === title && item.edition !== edition,
  );

  const LinksToKusouzu = alldata.filter(
    (item) => isKusouzuScroll(item) && item.titleen !== titleen,
  );

  const isKusouzu = isKusouzuScroll(data);

  const ekotobaIndices = emakis
    .map((item, i) => (item.cat === "ekotoba" ? i : -1))
    .filter((i) => i >= 0);
  const activeEkotobaIndex = ekotobaIndices.reduce(
    (prev, curr) => (curr <= navIndex ? curr : prev),
    ekotobaIndices[0]
  );

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
            height={viewerFullscreen ? "var(--vh-100)" : "var(--vh-75)"}
            editionLinks={[
              ...editionLinks,
              ...(isKusouzu ? LinksToKusouzu : []),
            ]}
            showKusouzuHubLink={isKusouzu}
          />
          {!viewerFullscreen && (
            <>
          <div className={`${styles.chapter} scrollbar`}>
            <h4 className={styles.chapterTitle}>
              {/* {typeen === "emaki" ? "段タイトル" : "タイトル"} */}
              {locale == "en" ? "Section Title" : "段タイトル"}
            </h4>
            <span className={styles.borderline}></span>
            {/* タイムライン */}
            <VStack alignItems="flex-start" spacing={6} position="relative">
              {/* タイムラインの縦線 */}
              <Box
                position="absolute"
                top={0}
                bottom={0}
                left={{ base: "12px", md: "18px" }} // レスポンシブで線の位置を変更
                width={{ base: "1px", md: "2px" }} // レスポンシブで線の太さを変更
                bg="gray.300"
                zIndex={-1}
              />
              {emakis.map((item, idx) => {
                const { cat, chapter, ekotobaId } = item;
                if (cat === "ekotoba") {
                  return (
                    <ChapterTimeline
                      key={idx}
                      titleen={titleen}
                      title={title}
                      chapter={chapter}
                      era={era}
                      index={idx}
                      ekotobaId={ekotobaId}
                      kotobagaki={kotobagaki}
                      iconType={"location"}
                      isActive={idx === activeEkotobaIndex}
                      scrollOnActive={true}
                    />
                  );
                }
              })}
            </VStack>
          </div>

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
              {isKusouzu && <KusouzuHubLink variant="tag" />}
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
                {locale === "en" ? parse(descEn) : parse(descJa)}
              </div>
              {/* 各段の詞書・解説 */}
              {kotobagaki && (
                <>
                  <h4
                    className={styles.metaBtitle}
                    style={{
                      "--border-color": eraColor(era) || "black", // カスタムプロパティを渡す
                    }}
                  >
                    {locale == "en" ? "Sectional Explanation" : "各段の解説"}
                  </h4>
                  {<ChapterDesc emakis={emakis} data={data} />}
                </>
              )}
              {/* 他の巻を見る */}
              {editionLinks.length > 0 && (
                <>
                  <h4
                    className={styles.metaBtitle}
                    style={{
                      "--border-color": eraColor(era) || "black", // カスタムプロパティを渡す
                    }}
                  >
                    {locale == "en" ? "View Other Scrolls" : "他の巻を見る"}
                  </h4>
                  <EditionLinks
                    title={title}
                    edition={edition}
                    editionLinks={editionLinks}
                  />
                </>
              )}
              {isKusouzu && (
                <>
                  <h4
                    className={styles.metaBtitle}
                    style={{
                      "--border-color": eraColor(era) || "black",
                    }}
                  >
                    {t("kusouzuHub.linkLabel")}
                  </h4>
                  <KusouzuHubLink variant="banner" />
                  {LinksToKusouzu.length > 0 && (
                    <>
                      <h4
                        className={styles.metaBtitle}
                        style={{
                          "--border-color": eraColor(era) || "black",
                        }}
                      >
                        {t("kusouzuHub.otherScrollsTitle")}
                      </h4>
                      <EditionLinks
                        title={title}
                        edition={edition}
                        editionLinks={LinksToKusouzu}
                      />
                    </>
                  )}
                </>
              )}
              {/* 登場人物 */}
              {personname && (
                <>
                  <h4
                    className={styles.metaBtitle}
                    style={{
                      "--border-color": eraColor(era) || "black", // カスタムプロパティを渡す
                    }}
                  >
                    {locale == "en" ? "Person Name" : "登場人物"}
                  </h4>
                  <div className={styles.tags}>
                    {personname?.map((item, index) => {
                      const { name, id, slug, portrait } = item;

                      return (
                        <Link href={`./personname/${slug}`} key={index}>
                          <a className={styles.portrait}>
                            <Image
                              src={portrait ? portrait : "/question-solid.svg"}
                              width={80}
                              height={80}
                              className={styles.portraitImage}
                              alt={name}
                              loading="lazy"
                              placeholder="blur"
                              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                            />
                            <p className={styles.name}>
                              {locale === "en" ? id : name}
                            </p>
                          </a>
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
              {/*カテゴリー・時代タグ */}
              <span
                className={styles.borderline}
                style={{ margin: "1rem 0 0.5rem 0" }}
              ></span>
              {/*キーワードタグ */}
              {keyword && (
                <div className={styles.tags}>
                  {keyword?.map((item, index) => {
                    const { name, id, slug, total, ruby } = item;

                    return (
                      <Link href={`./keyword/${slug}`} key={index}>
                        <a className={styles.keywodtTitle}>
                          <p>#{locale === "en" ? id : name}</p>
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
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
              {/*メタ情報*/}
              <div className={styles.authority}>
                <SourceAttribution
                  sourceImageUrl={sourceImageUrl}
                  sourceImage={sourceImage}
                  sourceTitle={title}
                  sourceTitleen={titleen}
                  sourceAuthor={sourceAuthor}
                  sourceCollection={sourceCollection}
                  linkClassName={styles.sourceLink}
                />
                {reference?.length > 0 && (
                <ul>
                  {locale == "en" ? "【reference】" : "【参考文献】"}
                  {reference.map((item, i) => {
                    return (
                      <li key={i}>
                        <Link href={item.url ? item.url : "/"}>
                          <a
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.sourceLink}
                          >
                            {`　　${item.title}`}
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                )}
              </div>
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
          <ToContactForm />
            </>
          )}
        </div>
      </div>
      {!viewerFullscreen && <Footer />}
    </>
  );
};

export default EmakiLandscapContent;
