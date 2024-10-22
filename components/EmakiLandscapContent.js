import React, { useContext, useState } from "react";
import EmakiConteiner from "./EmakiConteiner";
import styles from "../styles/EmakiLandscapContent.module.css";
import { AppContext } from "../pages/_app";
import Link from "next/link";
import { eraColor, useLocale, useLocaleData } from "../libs/func";
import { useRouter } from "next/router";
import Image from "next/image";
import CardC from "./CardC";
import Footer from "./Footer";
import SnsShareBox from "./SnsShareBox";
import ChapterDesc from "./ChapterDesc";
import ToContactForm from "./ToContactForm";
import ContactFormGoogle from "./ContactFormGoogle";
import { ExternalLink } from "react-feather";
import EditionLinks from "./EditionLinks";
import LinkToNote from "./LinkToNote";
import BannerToHelp from "./BannerToHelp";import { conectKusouzuChapters, conectGenjiChapters,  ChaptersTitle } from "../libs/func";
import LikeButton from "./LikeButton";

// TODO : FIX - 目次がオーバーフローされるときに、目次の下にボーダーが入らない

const EmakiLandscapContent = ({ data, selectedRef, navIndex, articleRef }) => {
  const { handleToId, handleFullScreen, isContactModalOpen } =
    useContext(AppContext);
  const { emakis } = data;
  const { locale } = useRouter();

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
          {/* chapter */}
          <ul className={`${styles.chapter} scrollbar`}>
            <h4 className={styles.chapterTitle}>
              {typeen === "emaki" ? "段" : "タイトル"}
            </h4>
            <span className={styles.chapterBorderline}></span>
            {emakis.map((item, index) => {
              const { cat, chapter } = item;
              if (cat === "ekotoba") {
                return (
                  <li key={index}>
                    <span
                      onClick={() => handleToId(index)}
                      className={styles.chapterlink}
                      style={{ color: eraColor(era) }}
                      // dangerouslySetInnerHTML={{ __html: chapter }}
                    >
                      {ChaptersTitle(title, chapter)}
                    </span>
                  </li>
                );
              }
            })}
          </ul>
          {/* metadata */}
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
              {title.includes("絵師草紙") && (
                <div className={`${styles.genjieslugBox}`}>
                  <Link href={`/eshinososhi/chapters-eshinososhi`}>
                    <a className={styles.genjieslugTitle}>絵師草紙の諸段一覧</a>
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
                フルスクリーンで見る
              </button>
            </div>
            <div className={styles.metadataB}>
              {/* 絵巻の紹介 */}
              <div
                className={styles.desc}
                dangerouslySetInnerHTML={{
                  __html: locale === "en" ? descEn : descJa,
                }}
              ></div>
              {/* 他巻へのリンク */}
              <EditionLinks title={title} edition={edition} />
              <BannerToHelp />

              {/* 各段の詞書・解説 */}
              {kotobagaki && <ChapterDesc emakis={emakis} data={data} />}

              {/* noteへのリンク */}
              <LinkToNote title={title} />
              {/* 登場人物 */}
              {personname && (
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
              )}

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
              {/*カテゴリー・時代タグ */}
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
                  <a target="_blank" className={styles.sourceLink}>
                    【出典】 {sourceImage}
                  </a>
                </Link>
                <ul>
                  【参照】
                  {reference?.map((item, i) => {
                    return (
                      <li key={i}>
                        <Link href={item.url ? item.url : "/"}>
                          <a target="_blank" className={styles.sourceLink}>
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
          {(typeen === "seiyoukaiga" || keyword) && <CardC data={data} />}
          <ToContactForm />
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiLandscapContent;
