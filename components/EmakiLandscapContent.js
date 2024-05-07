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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTwitter, faFacebook, faLinkedin} from "@fortawesome/free-brands-svg-icons";

// TODO : FIX - 目次がオーバーフローされるときに、目次の下にボーダーが入らない

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
    encodeUrl
  } = data;

  const descTemp = `「${title} ${edition ? edition : ""}」${
    author ? `（${author}）` : ""
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;
  
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${titleen}`;
  // console.log(url);
  

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
            overflowX={"scroll"}
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
                {title} {edition}
              </h3>
              {author && (
                <Link href={`/author/${authoren}`}>
                  <a className={styles.authorLink}>
                    <h4 className={styles.author}>{author}</h4>
                  </a>
                </Link>
              )}
              {genjieslug && (
                <div className={`${styles.genjieslugBox}`}>
                  <Link href={`/genjie/chaptersgenjilist`}>
                    <a className={styles.genjieslugTitle}>源氏物語54帖</a>
                  </Link>
                </div>
              )}
              <div className={styles.snsShareBox}>
                <Link
                  href={`https://twitter.com/share?url=${url}&text=${title} ${
                    edition ? edition : ""
                  }`}
                >
                  <a target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon
                      icon={faTwitter}
                      className={`${styles.snsShareIcon} ${styles.twitter}`}
                    />
                  </a>
                </Link>
                <Link
                  href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
                >
                  <a target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon
                      icon={faFacebook}
                      className={`${styles.snsShareIcon} ${styles.facebook}`}
                    />
                  </a>
                </Link>
                <Link
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}
                >
                  <a target="_blank" rel="noopener noreferrer">
                    <FontAwesomeIcon
                      icon={faLinkedin}
                      className={`${styles.snsShareIcon} ${styles.linkedin}`}
                    />
                  </a>
                </Link>
              </div>
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
                  参照
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

          {data.type === "絵巻" && <CardC data={data} />}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiLandscapContent;
