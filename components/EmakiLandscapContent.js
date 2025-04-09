import ExtractingListData from "@/libs/ExtractingListData";
import {
  eraColor,
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "@/libs/func";
import noteData from "@/libs/note/data.json";
import { AppContext } from "@/pages/_app";
import styles from "@/styles/EmakiLandscapContent.module.css";
import { Box, VStack } from "@chakra-ui/react";
import parse from "html-react-parser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";
import ChapterDesc from "./ChapterDesc";
import ChapterTimeline from "./ChapterTimeline";
import CustomTagCloud from "./CustomTagCloud";
import EditionLinks from "./EditionLinks";
import EmakiConteiner from "./EmakiConteiner";
import Footer from "./Footer";
import LikeButton from "./LikeButton";
import LinkToNote from "./LinkToNote";
import RecommendEmaki from "./RecommendEmaki";
import SnsShareBox from "./SnsShareBox";
import ToContactForm from "./ToContactForm";

const EmakiLandscapContent = ({ data, selectedRef, navIndex, articleRef }) => {
  const { handleFullScreen } = useContext(AppContext);
  const { emakis } = data;
  const { locale } = useRouter();
  const { t: alldata } = useLocaleData();

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
    reference,
    personname,
    keyword,
    genjieslug,
    kotobagaki,
    note,
  } = data;

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
    (item) => item.title === title && item.edition !== edition
  );

  const LinksToKusouzu = alldata.filter(
    (item) => item.title.includes("九相") && item.title !== title
  );

  const reletedEmakisToNote = noteData.filter((item) =>
    item.relatedEmakis.includes(title)
  );

  return (
    <>
      <div className={`emaki-page-landscape-grid`}>
        <div className={styles.wrapper}>
          <EmakiConteiner
            data={{ ...data }}
            scroll={true}
            selectedRef={selectedRef}
            navIndex={navIndex}
            articleRef={articleRef}
            overflowX={"scroll"}
            height={"75vh"}
          />
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
              {title.includes("九相") && (
                <div className={`${styles.genjieslugBox}`}>
                  <Link href={`/kusouzu/chapters-kusouzu`}>
                    <a className={styles.genjieslugTitle}>九相図一覧</a>
                  </Link>
                </div>
              )}
              <SnsShareBox
                titleen={titleen}
                title={title}
                edition={edition}
                ort={"land"}
              />
              <LikeButton
                title={title}
                edition={edition}
                author={author}
                ort={"land"}
              />
              <button
                type="button"
                value="Lock Landscape"
                onClick={() => handleFullScreen("landscape")}
                className={styles.linkedbutton}
              >
                {locale === "en"
                  ? "Enjoy the picture scroll in full screen"
                  : "フルスクリーンで絵巻を楽しむ"}
              </button>
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
              {title.includes("九相") && (
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
                    editionLinks={LinksToKusouzu}
                  />
                </>
              )}
              {/* noteへのリンク */}
              {reletedEmakisToNote.length > 0 && (
                <>
                  <h4
                    className={styles.metaBtitle}
                    style={{
                      "--border-color": eraColor(era) || "black", // カスタムプロパティを渡す
                    }}
                  >
                    note
                  </h4>
                  <LinkToNote
                    title={title}
                    reletedEmakisToNote={reletedEmakisToNote}
                  />
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
                <Link href={sourceImageUrl}>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.sourceLink}
                  >
                    {locale == "en" ? "【source】" : "【出典】"}
                    {sourceImage}
                  </a>
                </Link>
                ran
                <ul>
                  {locale == "en" ? "【reference】" : "【出典】"}
                  {reference?.map((item, i) => {
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
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiLandscapContent;
