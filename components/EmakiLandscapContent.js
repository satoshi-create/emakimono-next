import React, { useContext, useState } from "react";
import EmakiConteiner from "./EmakiConteiner";
import styles from "../styles/EmakiLandscapContent.module.css";
import { AppContext } from "../pages/_app";
import Link from "next/link";
import { eraColor } from "../libs/func";
import { useRouter } from "next/router";
import Image from "next/image";
import CardC from "./CardC";
import Footer from "./Footer";
import SnsShareBox from "./SnsShareBox";
import ChapterDesc from "./ChapterDesc";

// TODO : FIX - 目次がオーバーフローされるときに、目次の下にボーダーが入らない

const EmakiLandscapContent = ({
  data,
  selectedRef,
  navIndex,
  articleRef,
}) => {
  const { handleToId, handleFullScreen } = useContext(AppContext);
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
    sourceImage,
    sourceImageUrl,
    reference,
    personname,
    keyword,
    genjieslug,
    kotobagaki,
  } = data;

  const descTemp = `「${title} ${edition ? edition : ""}」${
    author ? `（${author}）` : ""
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;



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
            <h4 className={styles.chapterTitle}>目次</h4>
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
                      dangerouslySetInnerHTML={{ __html: chapter }}
                    ></span>
                  </li>
                );
              }
            })}
          </ul>
          {/* metadata */}
          <div className={styles.metadata}>
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
                dangerouslySetInnerHTML={{ __html: desc ? desc : descTemp }}
              ></div>
              {/* 各段の詞書・解説 */}
              {kotobagaki && <ChapterDesc emakis={emakis} />}

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
              <div className={styles.authority}>
                <Link href={sourceImageUrl}>
                  <a target="_blank" className={styles.sourceLink}>
                    出典 - {sourceImage}
                  </a>
                </Link>
                <ul>
                  参照 -
                  {reference?.map((item, i) => {
                    return (
                      <li key={i}>
                        <Link href={item.url ? item.url : "/"}>
                          <a target="_blank" className={styles.sourceLink}>
                            {`【${item.type}】
                          ${item.title}`}
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
          {/* <CardC data={data} /> */}
          {data.keyword && <CardC data={data} />}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiLandscapContent;
