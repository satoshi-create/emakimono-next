import { Box, VStack } from "@chakra-ui/react";
import parse from "html-react-parser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext } from "react";
import EmakiConteiner from "../components/EmakiConteiner";
import ExtractingListData from "../libs/ExtractingListData";
import {
  eraColor,
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "../libs/func";
import noteData from "../libs/note/data.json";
import { AppContext } from "../pages/_app";
import styles from "../styles/EmakiPortraitContent.module.css";
import ChapterDesc from "./ChapterDesc";
import ChapterTimeline from "./ChapterTimeline";
import ContactFormGoogle from "./ContactFormGoogle";
import CustomTagCloud from "./CustomTagCloud";
import EditionLinks from "./EditionLinks";
import Footer from "./Footer";
import LinkToNote from "./LinkToNote";
import RecommendEmaki from "./RecommendEmaki";
import SnsShareBox from "./SnsShareBox";
import ToContactForm from "./ToContactForm";

const EmakiPortraitContent = ({ data, selectedRef, navIndex, articleRef }) => {
  const { handleFullScreen, isContactModalOpen } = useContext(AppContext);

  const { locale } = useRouter();
  const { t: alldata } = useLocaleData();

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
    reference,
    keyword,
    personname,
    kotobagaki,
    titleen,
  } = data;

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
    (item) => item.title.includes("九相") && item.title !== title
  );
  const reletedEmakisToNote = noteData.filter((item) =>
    item.relatedEmakis.includes(title)
  );

  return (
    <>
      <EmakiConteiner
        data={{ ...data }}
        scroll={true}
        selectedRef={selectedRef}
        navIndex={navIndex}
        articleRef={articleRef}
        height={"45vh"}
      />
      <div className={`${styles.wrapper} section-grid`}>
        <div className={styles.container}>
          <div className={styles.metadataA}>
            <h3 className={styles.title}>
              {locale === "ja" ? title : titleen} {locale === "ja" && edition}
            </h3>
            {author && (
              <Link href={`/author/${authoren}`}>
                <a className={styles.authorLink}>
                  <h4 className={styles.author}>
                    {locale === "ja" ? author : authoren}
                  </h4>
                </a>
              </Link>
            )}
            <button
              type="button"
              value="Lock Landscape"
              onClick={() => handleFullScreen("landscape")}
              className={styles.linkedbutton}
            >
              {locale === "en" ? "View FullScreen" : "全画面で見る"}
            </button>
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
            {/* {genjieslug && (
              <div className={`${styles.genjieslugBox}`}>
                <Link href={`/genjie/chapters-genji`}>
                  <a className={styles.genjieslugTitle}>源氏物語54帖一覧</a>
                </Link>
              </div>
            )} */}

            {!kotobagaki && (
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
                          iconType={"location"}
                        />
                      );
                    }
                  })}
                </VStack>
              </>
            )}

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

            {/* noteへのリンク */}
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
              <h4
                className={styles.metaBtitle}
                style={{
                  "--border-color": eraColor(era) || "black", // カスタムプロパティを渡す
                }}
              >
                note
              </h4>
            )}
            <LinkToNote
              title={title}
              reletedEmakisToNote={reletedEmakisToNote}
            />
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

          <ToContactForm />
          {isContactModalOpen && <ContactFormGoogle />}
          <SnsShareBox
            titleen={titleen}
            title={title}
            edition={edition}
            ort={"prt"}
          />
          {/* {(typeen === "seiyoukaiga" || keyword) && <CardC data={data} />} */}
          <RecommendEmaki data={data} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiPortraitContent;
