import React, { useContext, useEffect } from "react";
import Link from "next/link";
import styles from "../styles/CardA.module.css";
import Title from "./Title";
import { eraColor } from "../libs/func";
import Button from "./Button";
import Image from "next/image";
import { AppContext } from "../pages/_app";
import { useRouter } from "next/router";

const CardA = ({
  emakis,
  columns,
  needdesc,
  sectiontitle,
  sectionname,
  sectiondesc,
  sectiontitleen,
}) => {
  const { setisModalOpen } = useContext(AppContext);
    const { locale } = useRouter();

  useEffect(() => {
    setisModalOpen(false);
  }, []);

  return (
    <section
      className={`section-center section-padding ${styles[sectionname]}`}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <section className={styles.conteiner}>
        {emakis.map((item, index) => {
          const {
            titleen,
            title,
            thumb,
            edition,
            author,
            era,
            eraen,
            desc,
            typeen,
            type,
            subtype,
            data,
            keyword,
          } = item;

          const filterDesc = desc.substring(0, 40);
          const descTemp = `${title} ${
            author && `（${author}）`
          }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

          return (
            <div
              className={`${styles.cardContainer} ${styles[columns]}`}
              key={index}
            >
              <h4 className={styles.subtype} id="alart" value="test">
                {sectiontitle === "さまざまな絵巻" && `${subtype}絵巻`}
                {sectiontitle === "横スクロールで楽しむワイド美術" && type}
              </h4>
              <div className={styles.card}>
                <div className={styles.single}>
                  <Link href={`/${titleen}`}>
                    <a>
                      {/* <img src={thumb} loading="lazy" alt={title} /> */}
                      <Image
                        src={thumb}
                        layout="fill"
                        objectFit="responsive"
                        className={styles.image}
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
                    <Link href={`/category/${typeen}`}>
                      <a className={styles.type}>{type}</a>
                    </Link>
                    <Link href={`/era/${eraen}`}>
                      <a
                        className={`era ${styles[eraColor(era)]} ${styles.era}`}
                      >
                        {`${era}時代`}
                      </a>
                    </Link>
                    {/* <div>3巻</div> */}
                  </div>
                  <h3 className={styles.title}>
                    {title}　{edition}
                  </h3>
                  <h4 className={styles.author}>
                    {author ? author : "絵師不明"}
                  </h4>
                  {needdesc && (
                    <div className={styles.desc}>
                      {desc ? `${filterDesc}...` : descTemp}
                    </div>
                  )}
                  <div className={styles.viewemaki}>
                    <Button
                      title={
                        locale === "en"
                          ? "Enjoy by right to left scroll !!"
                          : "横スクロールで見る"
                      }
                      path={titleen}
                      style={"carda"}
                    />
                  </div>
                  {keyword && (
                    <div className={styles.keyword}>
                      {keyword.slice(0, 3).map((item, index) => {
                        const { name, slug } = item;
                        return (
                          <Link href={`/keyword/${slug}`} key={index}>
                            <a className={styles.keywordLink}>{name}</a>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </section>
  );
};

export default CardA;
