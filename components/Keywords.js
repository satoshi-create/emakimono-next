import React from "react";
import Title from "./Title";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/KeywordList.module.css";
import { keywordItem, personnameItem } from "../libs/func";
import { useRouter } from "next/router";
import Button from "./Button";

const Keywords = ({ sectiontitle, sectiontitleen, path, allTags }) => {
  const { locale } = useRouter();
  return (
    <section className={`section-grid section-padding `}>
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <div className={`${styles.tags} ${locale === "ja" && styles.jatags}`}>
        {allTags.map((item, index) => {
          const { name, id, slug, total, ruby } = item;

          return (
            <Link href={`/keyword/${slug}`} key={index}>
              <a className={styles.title}>
                <p>
                  {locale === "en" ? id : name}
                  <span className={styles.total}>{`(${total})`}</span>
                </p>
              </a>
            </Link>
          );
        })}
      </div>
      {path && (
        <Button
          title={
            locale === "en"
              ? "View a list of keywords !!"
              : "キーワード一覧を見る"
          }
          path={path}
          style={"tag"}
        />
      )}
    </section>
  );
};

export default Keywords;
