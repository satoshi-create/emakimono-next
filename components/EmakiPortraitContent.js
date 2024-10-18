import React, { useContext, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/EmakiPortraitContent.module.css";
import { AppContext } from "../pages/_app";
import { eraColor } from "../libs/func";
import EmakiConteiner from "../components/EmakiConteiner";
import CardC from "./CardC";
import Image from "next/image";
import Footer from "./Footer";
import ChapterDesc from "./ChapterDesc";
import SnsShareBox from "./SnsShareBox";
import ToContactForm from "./ToContactForm";
import ContactFormGoogle from "./ContactFormGoogle";
import EditionLinks from "./EditionLinks";
import LinkToNote from "./LinkToNote";
import NoteIcon from "../public/note-icon.png";
import BannerToHelp from "./BannerToHelp";
import LikeButton from "./LikeButton";

const EmakiPortraitContent = ({ data, selectedRef, navIndex, articleRef }) => {
  const { handleToId, handleFullScreen, setnavIndex, isContactModalOpen } =
    useContext(AppContext);
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
    kotobagaki,
    note,
    titleen,
  } = data;

  const filterDesc = desc.substring(0, 40);
  const descTemp = `「${title} ${edition ? edition : ""}」${
    author ? `（${author}）` : ""
    }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

    const descTJaSeiyoukaiga = desc
      ? desc
      : `「${title} ${edition ? edition : ""}」${
          author ? `（${author}）` : ""
        }の全シーンを、横スクロールで楽しむことができます。`;

    const descJa = typeen === "seiyoukaiga" ? descTJaSeiyoukaiga : descTemp;

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
            <LikeButton
              title={title}
              edition={edition}
              author={author}
              ort={"prt"}
            />
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
              dangerouslySetInnerHTML={{ __html: desc ? desc : descJa }}
            ></div>
            <BannerToHelp />
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

            <ul className={styles.chapter} style={{ color: eraColor(era) }}>
              {/* 絵巻の紹介 */}
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

            {/* 各段の詞書・解説 */}
            {kotobagaki && <ChapterDesc emakis={emakis} data={data} />}
            {/* noteへのリンク */}
            {/* 他巻へのリンク */}
            <EditionLinks title={title} edition={edition} />
            {/* noteへのリンク */}
            <LinkToNote title={title} />
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
            {/*キーワードタグ */}
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
          <ToContactForm />
          {isContactModalOpen && <ContactFormGoogle />}
          <SnsShareBox
            titleen={titleen}
            title={title}
            edition={edition}
            ort={"prt"}
          />
          {(typeen === "seiyoukaiga" || keyword) && <CardC data={data} />}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default EmakiPortraitContent;
