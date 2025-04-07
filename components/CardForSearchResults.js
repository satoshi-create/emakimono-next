import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useEffect } from "react";
import { eraColor } from "../libs/func";
import { AppContext } from "../pages/_app";
import styles from "../styles/CardForSearchResults.module.css";

const CardForSearchResults = ({ emakis, columns, needdesc }) => {
  const { setisModalOpen, closeSearchModal } = useContext(AppContext);
  const { locale } = useRouter();

  useEffect(() => {
    setisModalOpen(false);
  }, [setisModalOpen]);

  return (
    <div className={styles.searchbox}>
      {emakis.map((item, index) => {
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
          keyword,
        } = item;

        const filterDesc = desc.substring(0, 40);
        const descTemp = `${title} ${
          author && `（${author}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

        return (
          <div key={index} onClick={closeSearchModal} className={styles.card}>
            <div className={styles.single}>
              <Link href={`/${titleen}`}>
                <a target="_blank">
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
                  <a className={styles.type}>
                    {locale === "en" ? typeen : type}
                  </a>
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
              <h3 className={styles.title}>
                {locale === "ja" ? title : titleen} {locale === "ja" && edition}
              </h3>
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
        );
      })}
    </div>
  );
};

export default CardForSearchResults;
