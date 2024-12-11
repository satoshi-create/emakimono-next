import React, { useContext, useEffect } from "react";
import Image from "next/image";
import { eraColor } from "../libs/func";
import Link from "next/link";
import { AppContext } from "../pages/_app";
import styles from "../styles/CardA.module.css";
import { useRouter } from "next/router";

const SingleCardA = ({ item, sectiontitle, columns, needdesc, variant }) => {
  const { locale } = useRouter();
  const { closeSearchModal } = useContext(AppContext);
  const {
    titleen,
    title,
    thumb,
    edition,
    author,
    authoren,
    era,
    eraen,
    desc,
    typeen,
    type,
    subtype,
    keyword,
  } = item;

  const filterDesc = desc.substring(0, 40);
  const descTemp = `${title} ${
    author && `（${author}）`
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;
  return (
    <div onClick={closeSearchModal}>
      {sectiontitle === "さまざまな絵巻" && (
        <h4 className={styles.subtype} id="alart" value="test">
          {sectiontitle === "さまざまな絵巻" && `${subtype}絵巻`}
          {sectiontitle === "横スクロールで楽しむワイド美術" && type}
        </h4>
      )}
      <div className={styles.card}>
        <div className={styles.single}>
          <Link href={`/${titleen}`}>
            <a>
              <Image
                src={thumb}
                width={533}
                height={300}
                sizes="100vw"
                alt={title}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
              />
            </a>
          </Link>
        </div>
        <div className={styles.footer}>
          <div className={styles.cat}>
            <Link href={`/type/${typeen}`}>
              <a className={styles.type}>{locale === "en" ? typeen : type}</a>
            </Link>
            <Link href={`/era/${eraen}`}>
              <a
                className={`${styles.era}`}
                style={{
                  border: eraColor(era),
                  backgroundColor: eraColor(era),
                  color: eraColor(era) ? "white" : "black",
                }}
              >
                {locale === "en" ? `${eraen} period` : `${era}時代`}
              </a>
            </Link>
          </div>
          <Link href={`/${titleen}`}>
            <a>
              <h3 className={styles.title}>
                {locale === "ja" ? title : titleen} {locale === "ja" && edition}
              </h3>
            </a>
          </Link>
          {author ? (
            <Link href={`/author/${authoren}`}>
              <a className={styles.authorLink}>
                <h4 className={styles.author}>
                  {locale === "ja" ? author : authoren}
                </h4>
              </a>
            </Link>
          ) : (
            <br />
          )}
          {needdesc && (
            <div className={styles.desc}>
              {desc ? `${filterDesc}...` : descTemp}
            </div>
          )}
          {variant !== "editionlink" && (
            <div className={styles.viewemaki}>
              <Link href={`/${titleen}`}>
                <a>
                  <button className={styles.viewemakiBtn}>
                    {locale === "en"
                      ? "Enjoy by right to left scroll !!"
                      : "横スクロールで見る"}
                  </button>
                </a>
              </Link>
            </div>
          )}

          {keyword && (
            <div className={styles.keyword}>
              {keyword.slice(0, 3).map((item, index) => {
                const { name, slug, id } = item;
                return (
                  <Link href={`/keyword/${slug}`} key={index}>
                    <a className={styles.keywordLink}>
                      {locale === "en" ? id : name}
                    </a>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleCardA;
