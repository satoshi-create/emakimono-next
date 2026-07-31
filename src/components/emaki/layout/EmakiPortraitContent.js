import ToContactForm from "@/components/_archive_unused/ToContactForm";
import EmakiConteiner from "@/components/emaki/layout/EmakiConteiner";
import ChapterDesc from "@/components/emaki/metadata/ChapterDesc";
import ChapterTimeline from "@/components/emaki/metadata/ChapterTimeline";
import EditionLinks from "@/components/emaki/metadata/EditionLinks";
import SourceAttribution from "@/components/emaki/metadata/SourceAttribution";
import LikeButton from "@/components/emaki/metadata/LikeButton";
import ShareButtons from "@/components/emaki/viewer/ShareButtons";
import RecommendEmaki from "@/components/emaki/ranking/RecommendEmaki";
import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import KusouzuHubLink from "@/components/emaki/kusouzu/KusouzuHubLink";
import ChojuGigaHubLink from "@/components/emaki/chouju-giga/ChojuGigaHubLink";
import Footer from "@/components/layout/Footer";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/EmakiPortraitContent.module.css";
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
import { Box, VStack } from "@chakra-ui/react";
import parse from "html-react-parser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useMemo } from "react";
import { useTranslation } from "next-i18next";

const EmakiPortraitContent = ({ data, selectedRef, navIndex, articleRef }) => {
  const { handleFullScreen, rankingData } = useContext(AppContext);

  const { locale } = useRouter();
  const { t: alldata } = useLocaleData();
  const { t } = useTranslation("common");

  const {
    type,
    typeen,
    eraen,
    era,
    title,
    edition,
    author,
    authoren,
    desc,
    descen,
    emakis,
    sourceImage,
    sourceImageUrl,
    sourceAuthor,
    sourceCollection,
    reference,
    keyword,
    personname,
    kotobagaki,
    sceneText,
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
    : `You can enjoy all the scenes of the " ${titleen} ${
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
  const ekotobaIndices = emakis
    .map((item, i) => (item.cat === "ekotoba" ? i : -1))
    .filter((i) => i >= 0);
  const activeEkotobaIndex = ekotobaIndices.reduce(
    (prev, curr) => (curr <= navIndex ? curr : prev),
    ekotobaIndices[0]
  );

  return (
    <>
      <EmakiConteiner
        key={data.id}
        data={{ ...data }}
        scroll={true}
        selectedRef={selectedRef}
        navIndex={navIndex}
        articleRef={articleRef}
        height={"var(--vh-45)"}
        editionLinks={[
          ...editionLinks,
          ...(isKusouzu ? LinksToKusouzu : []),
        ]}
        showKusouzuHubLink={isKusouzu}
        showChojuGigaHubLink={isChojuGiga}
      />
      <div className={`${styles.wrapper} section-grid`}>
        <div className={styles.container}>
          <div className={styles.metadataA}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>
                {locale === "ja" ? title : titleen} {locale === "ja" && edition}
              </h3>
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
            <div className={styles.actionGroup}>
              <button
                type="button"
                value="Lock Landscape"
                onClick={() => handleFullScreen("landscape")}
                className={styles.linkedbutton}
              >
                {locale === "en" ? "View FullScreen" : "全画面で見る"}
              </button>
              <LikeButton
                title={title}
                titleen={titleen}
                edition={edition}
                author={author}
                ort={"prt"}
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
          </div>

          <div className={styles.metadataB}>
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
            {isKusouzu && <KusouzuHubLink variant="tag" />}
            {isChojuGiga && <ChojuGigaHubLink variant="tag" />}

            {!(kotobagaki || sceneText) && (
              <>
                <h4
                  className={styles.metaBtitle}
                  style={{
                    "--border-color": eraColor(era) || "black", // カスタムプロパティを渡す
                  }}
                >
                  {locale == "en" ? "Section Title" : "段タイトル"}
                </h4>
                <VStack alignItems="flex-start" spacing={6} position="relative">
                  {/* タイムラインの縦線 */}
                  <Box
                    position="absolute"
                    top={0}
                    bottom={0}
                    left={{ base: "18px", md: "21px" }} // レスポンシブで線の位置を変更
                    width={{ base: "1px", md: "2px" }} // レスポンシブで線の太さを変更
                    bg="gray.300"
                    zIndex={1}
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
                          sceneText={sceneText}
                          iconType={"location"}
                          isActive={idx === activeEkotobaIndex}
                        />
                      );
                    }
                  })}
                </VStack>
              </>
            )}

            {/* 各段の詞書・解説 */}
            {(kotobagaki || sceneText) && (
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
            {isChojuGiga && (
              <>
                <h4
                  className={styles.metaBtitle}
                  style={{
                    "--border-color": eraColor(era) || "black",
                  }}
                >
                  {t("choujuGigaHub.linkLabel")}
                </h4>
                <ChojuGigaHubLink variant="banner" />
                {LinksToChojuGiga.length > 0 && (
                  <>
                    <h4
                      className={styles.metaBtitle}
                      style={{
                        "--border-color": eraColor(era) || "black",
                      }}
                    >
                      {locale === "ja" ? "他の巻を見る" : "Other Scrolls"}
                    </h4>
                    <EditionLinks
                      title={title}
                      edition={edition}
                      editionLinks={LinksToChojuGiga}
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
                <div
                  className={`${styles.tags} ${
                    locale === "ja" && styles.jatags
                  }`}
                >
                  {personname?.map((item, index) => {
                    const { name, id, slug, total, ruby, portrait } = item;

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
            <span
              className={styles.borderline}
              style={{ margin: "1rem 0 0.5rem 0" }}
            ></span>
            {/*タグクラウド */}
            {keyword && (
              <div className={styles.tagCloud}>
                <CustomTagCloud
                  tags={filterdKeywords(keyword, allKeywords)}
                  emakiPage={true}
                />
              </div>
            )}
            {/*カテゴリー・時代タグ */}
            <div className={styles.cat}>
              <Link href={`/era/${eraen}`}>
                <a
                  className={styles.era}
                  style={{
                    border: eraColor(era),
                    backgroundColor: eraColor(era),
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

          <ToContactForm />
          {/* {(typeen === "seiyoukaiga" || keyword) && <CardC data={data} />} */}
          <RecommendEmaki data={data} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiPortraitContent;
