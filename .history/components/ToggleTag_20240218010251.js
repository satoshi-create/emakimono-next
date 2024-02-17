import React, { useState } from "react";
import Keywords from "./Keywords";
import Title from "./Title";
import styles from "../styles/ToggleTag.module.css";
import emakisData from "../libs/data";
import { keywordItem, personnameItem } from "../libs/func";
import { useRouter } from "next/router";
import Button from "./Button";

const ToggleTag = ({ sectiontitle, sectiontitleen }) => {
  const { locale } = useRouter();
  const [value, setValue] = useState(0);
  const allPersonNames = personnameItem(emakisData);
  const allKeywords = keywordItem(emakisData);

  const allTag = [
    {
      tagtitle: "キーワード",
      tagtitleen: "keywords",
      allTags: allKeywords,
      path: "keyword",
    },

  ];

  const { tagtitle, tagtitleen, allTags, path } = allTag[value];

  return (
    <section className="section-center section-padding">
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <div className={styles.tabcontainer}>
        {allTag.map((item, index) => {
          const { tagtitle, tagtitleen } = item;
          return (
            <button
              onClick={() => setValue(index)}
              className={`btn ${styles.tabbtn} ${
                value === index ? styles.activebtn : ""
              }`}
              key={index}
            >
              {locale === "en" ? tagtitleen : tagtitle}
            </button>
          );
        })}
      </div>
      <Keywords
        sectiontitle={tagtitle}
        sectiontitleen={tagtitleen}
        allTags={allTags}
        path={path}
      />
      {tagtitle === "キーワード" ? (
        <Button
          title={
            locale === "en"
              ? "View a list of keywords !!"
              : "キーワード一覧を見る"
          }
          path={"/keywords"}
          style={"tag"}
        />
      ) : (
        <Button
          title={
            locale === "en"
              ? "View a list of personnames !!"
              : "人物名一覧を見る"
          }
          path={"/personnames"}
          style={"tag"}
        />
      )}
    </section>
  );
};

export default ToggleTag;
