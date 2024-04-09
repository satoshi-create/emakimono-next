import React, { useContext, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/EmakiPortraitContent.module.css";
import { AppContext } from "../pages/_app";
import { eraColor } from "../libs/func";
import EmakiConteiner from "../components/EmakiConteiner";
import CardC from "./CardC";
import Image from "next/image";
import Footer from "./Footer";

const EmakiPortraitContent = ({ data, selectedRef, navIndex, articleRef }) => {
  const { handleToId, handleFullScreen, setnavIndex } = useContext(AppContext);
  const { locale } = useRouter();
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
    emakis,
    sourceImage,
    sourceImageUrl,
    reference,
    keyword,
    genjieslug,
    personname,
  } = data;

  const filterDesc = desc.substring(0, 40);
  const descTemp = `「${title} ${edition ? edition : ""}」${
    author ? `（${author}）` : ""
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  return (
    <>
      <EmakiConteiner
        data={{ ...data }}
        scroll={true}
        selectedRef={selectedRef}
        navIndex={navIndex}
        articleRef={articleRef}
        height={"40vh"}
      />
      <div className={`${styles.wrapper} section-grid`}>
        <div className={styles.container}>
          <div className={styles.metadataA}>
            <h3 className={styles.title}>
              {title} {edition}
            </h3>
            {author && (
              <Link href={`/author/${authoren}`}>
                <a className={styles.authorLink}>
                  <h4 className={styles.author}>{author}</h4>
                </a>
              </Link>
            )}
            <button
              type="button"
              value="Lock Landscape"
              onClick={() => handleFullScreen("landscape")}
              className={styles.linkedbutton}
            >
              横スクロールで見る
            </button>
          </div>
          <div className={styles.metadataB}>
            <div
              className={styles.desc}
              dangerouslySetInnerHTML={{ __html: desc ? desc : descTemp }}
            ></div>
            <ul className={styles.chapter} style={{ color: eraColor(era) }}>
              {emakis.map((item, index) => {
                const { cat, chapter } = item;
                if (cat === "ekotoba") {
                  return (
                    <li key={index}>
                      <span
                        onClick={() => handleToId(index)}
                        dangerouslySetInnerHTML={{ __html: chapter }}
                        className={`${styles[eraColor(era)]} ${
                          styles.chaptername
                        }`}
                      ></span>
                    </li>
                  );
                }
              })}
            </ul>
            {/* {genjieslug && (
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
            )} */}
            {personname && (
              <div
                className={`${styles.tags} ${locale === "ja" && styles.jatags}`}
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
            )}
            {keyword && (
              <div
                className={`${styles.tags} ${locale === "ja" && styles.jatags}`}
              >
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
          {data.type === "絵巻" && <CardC data={data} />}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiPortraitContent;
