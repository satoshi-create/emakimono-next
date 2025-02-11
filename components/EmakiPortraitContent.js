import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/EmakiPortraitContent.module.css";
import { AppContext } from "../pages/_app";
import {
  eraColor,
  filterdKeywords,
  keywordItem,
  useLocaleData,
} from "../libs/func";
import EmakiConteiner from "../components/EmakiConteiner";
import Image from "next/image";
import Footer from "./Footer";
import ChapterDesc from "./ChapterDesc";
import SnsShareBox from "./SnsShareBox";
import ToContactForm from "./ToContactForm";
import ContactFormGoogle from "./ContactFormGoogle";
import EditionLinks from "./EditionLinks";
import LinkToNote from "./LinkToNote";
import BannerToHelp from "./BannerToHelp";
import LikeButton from "./LikeButton";
import RecommendEmaki from "./RecommendEmaki";
import ChapterList from "./ChapterList";
import CustomTagCloud from "./CustomTagCloud";
import ExtractingListData from "../libs/ExtractingListData";
import noteData from "../libs/note/data.json";
import ChapterTimeline from "./ChapterTimeline";
import { Box, VStack } from "@chakra-ui/react";
import MarkdownContent from "./MarkdownContent";
import {
  ScrollText,
  Play,
  NotebookTabs,
  PenLine,
  LibraryBig,
  UserRound,
  NotebookPen,
  TableOfContents,
} from "lucide-react";

const EmakiPortraitContent = ({ data, selectedRef, navIndex, articleRef }) => {
  const { handleToId, handleFullScreen, setnavIndex, isContactModalOpen } =
    useContext(AppContext);

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
    genjieslug,
    personname,
    kotobagaki,
    note,
    titleen,
  } = data;

  console.log(desc);

  const removeNestedArrayObj = ExtractingListData();
  const allKeywords = keywordItem(removeNestedArrayObj);

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
            <h1 className={styles.title}>
              {locale === "ja" ? title : titleen} {locale === "ja" && edition}
              {author && (
                <Link href={`/author/${authoren}`}>
                  <a className={styles.authorLink}>
                    <h2 className={styles.author}>
                      {locale === "ja"
                        ? `絵師：${author}`
                        : `Attributed:${authoren}`}
                    </h2>
                  </a>
                </Link>
              )}
            </h1>
            <div className={styles.likebutton}>
              <LikeButton title={title} edition={edition} author={author} />
            </div>
            <button
              type="button"
              value="Lock Landscape"
              onClick={() => handleFullScreen("landscape")}
              className={styles.linkedbutton}
            >
              <Play />
              {locale === "en"
                ? "Enjoy the picture scroll in full screen"
                : "フルスクリーンで絵巻を楽しむ"}
            </button>
            <div className={styles.snsbutton}>
              <SnsShareBox
                titleen={titleen}
                title={title}
                edition={edition}
                ort={"prt"}
              />
            </div>
          </div>
          {/* H2:絵巻の紹介 */}
          <div className={styles.metadataB}>
            <h2>
              <ScrollText />
              {locale === "ja" ? "絵巻の紹介" : "Introduction"}
            </h2>
            <MarkdownContent
              desc={desc}
              descen={descen}
              title={title}
              titleen={titleen}
              author={author}
              authoren={authoren}
              edition={edition}
              typeen={typeen}
            />
            {!kotobagaki && (
              <>
                <h2>
                  <TableOfContents />
                  {locale === "ja"
                    ? "各段のタイトル"
                    : "Titles of Each Chapter"}
                </h2>
                <VStack alignItems="flex-start" spacing={6} position="relative">
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

            {/* H2:各段の解説 */}
            {kotobagaki && (
              <>
                <h2>
                  <PenLine />
                  {locale === "ja" ? "各段の解説" : "Scene Breakdown"}
                </h2>
                {<ChapterDesc emakis={emakis} data={data} />}
              </>
            )}
            {/* H2:他の巻を見る */}
            {editionLinks.length > 0 && (
              <>
                <h2>
                  <LibraryBig />
                  {locale === "ja" ? "他の巻を見る" : "View Other Volumes"}
                </h2>
                <EditionLinks
                  title={title}
                  edition={edition}
                  editionLinks={editionLinks}
                />
              </>
            )}
            {title.includes("九相") && (
              <>
                <h2>
                  <LibraryBig />
                  {locale === "ja" ? "他の巻を見る" : "View Other Volumes"}
                </h2>
                <EditionLinks
                  title={title}
                  edition={edition}
                  editionLinks={LinksToKusouzu}
                />
              </>
            )}

            {/* H2:noteへのリンク */}
            {reletedEmakisToNote.length > 0 && (
              <>
                <h2>
                  <NotebookPen />
                  Note
                </h2>
                <LinkToNote
                  title={title}
                  reletedEmakisToNote={reletedEmakisToNote}
                />
              </>
            )}

            {/* H2:登場人物 */}
            {personname && (
              <>
                <h2>
                  <UserRound />
                  {locale === "ja" ? "登場人物" : "Characters"}
                </h2>
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
            {/*H2:詳細情報*/}
            <h2>
              <NotebookTabs />
              {locale === "ja" ? "詳細情報" : "Detailed Information"}
            </h2>
            <div className={styles.datailInfo}>
              {/*H3:時代背景*/}
              <h3>{locale === "ja" ? "時代背景" : "Historical Context"}</h3>
              <Link href={`/era/${eraen}`}>
                <a className={styles.era}>
                  {locale === "ja" ? `${era}時代` : `${eraen} period`}
                </a>
              </Link>
              {/*H3:タイプ*/}
              <h3>{locale === "ja" ? "タイプ" : "Type"}</h3>
              <Link href={`/type/${typeen}`}>
                <a className={styles.type}>{locale === "en" ? typeen : type}</a>
              </Link>
              {/*H3:タグ*/}
              {keyword && (
                <>
                  <h3>{locale === "ja" ? "タグ" : "Tags"}</h3>
                  <p className={styles.keywordItems}>
                    {keyword?.map((item, index) => {
                      const { name, id, slug, total, ruby } = item;
                      return (
                        <Link href={`./keyword/${slug}`} key={index}>
                          <a>
                            <span className={styles.keywordItem}>
                              #{locale === "en" ? id : name}
                            </span>
                          </a>
                        </Link>
                      );
                    })}
                  </p>
                </>
              )}
              {/*H3:出典*/}
              {sourceImage && (
                <>
                  <h3>
                    {locale === "ja" ? "出典・所蔵" : "Source & Collection"}
                  </h3>
                  <Link href={sourceImageUrl}>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      {sourceImage}
                    </a>
                  </Link>
                </>
              )}
              {/*H3:参照*/}
              {reference && (
                <>
                  <h3>{locale === "ja" ? "関連リンク" : "Related Links"}</h3>
                  {reference?.map((item, i) => {
                    return (
                      <li key={i} className={styles.reference}>
                        <Link href={item.url ? item.url : "/"}>
                          <a target="_blank" rel="noopener noreferrer">
                            {`${item.title}`}
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <ToContactForm />
          {isContactModalOpen && <ContactFormGoogle />}
          {/* <SnsShareBox
            titleen={titleen}
            title={title}
            edition={edition}
            ort={"prt"}
          /> */}
          {/* {(typeen === "seiyoukaiga" || keyword) && <CardC data={data} />} */}
          <RecommendEmaki data={data} />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiPortraitContent;
