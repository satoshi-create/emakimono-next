import React, { useContext } from "react";
import EmakiConteiner from "./EmakiConteiner";
import styles from "../styles/EmakiLandscapContent.module.css";
import { AppContext } from "../pages/_app";
import Link from "next/link";
import { eraColor } from "../libs/func";
import { useRouter } from "next/router";
import Image from "next/image";
import CardC from "./CardC";
import Footer from "./Footer";

const EmakiLandscapContent = ({
  data,
  selectedRef,
  navIndex,
  articleRef,
  height,
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
    edition,
    author,
    desc,
    sourceImage,
    sourceImageUrl,
    reference,
    personname,
    keyword,
    genjieslug,
  } = data;

  const descTemp = `${title} ${
    author && `（${author}）`
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
            height={height}
          />
          {/* chapter */}
          <ul className={styles.chapter}>
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
                {title} {edition}
              </h3>
              <h4 className={styles.author}>
                {author
                  ? author
                  : `${locale == "en" ? "artist unknown" : "絵師不詳"}`}
              </h4>
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
              <div
                className={styles.desc}
                dangerouslySetInnerHTML={{ __html: desc ? desc : descTemp }}
              ></div>
              {genjieslug && (
                <div className={`${styles.genjieslugBox}`}>
                  {genjieslug.map((item, i) => {
                    return (
                      <h4 className={`${styles.genjieslugTitle}`} key={i}>
                        <Link href={`/genjie/${item.path}`}>
                          <a>{item.title}</a>
                        </Link>
                      </h4>
                    );
                  })}
                </div>
              )}
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
                    }}
                  >
                    {locale === "en" ? `${eraen} period` : `${era}`}
                  </a>
                </Link>
                <Link href={`/category/${typeen}`} className={styles.type}>
                  <a>{locale === "en" ? typeen : type}</a>
                </Link>
              </div>
              <div className={styles.authority}>
                <Link href={sourceImageUrl}>
                  <a target="_blank" className={styles.sourceLink}>
                    出典 - {sourceImage}
                  </a>
                </Link>
                <div> {reference ? `参照 - ${reference}` : ""}</div>
              </div>
            </div>
          </div>

          {data.type === "絵巻" && <CardC data={data} />}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiLandscapContent;
