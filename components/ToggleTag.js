import React, { useState } from "react";
import Keywords from "./Keywords";
import Title from "./Title";
import styles from "../styles/ToggleTag.module.css";
import emakisData from "../libs/data";
import { keywordItem, personnameItem } from "../libs/func";

const ToggleTag = () => {
  const [value, setValue] = useState(0);
  const allPersonNames = personnameItem(emakisData);
  const allKeywords = keywordItem(emakisData);

  const allTag = [
    {
      sectiontitle: "キーワード",
      sectiontitleen: "keywords",
      allTags: allKeywords,
      path: "keyword",
    },
    {
      sectiontitle: "人物名",
      sectiontitleen: "personnames",
      allTags: allPersonNames,
      path: "personname",
    },
  ];

  const { sectiontitle, sectiontitleen, allTags, path } = allTag[value];

  return (
    <>
      <Title
        sectiontitle={"索引から見る絵巻"}
        sectiontitleen={"index of emaki"}
      />
      <div className={styles.tabcontainer}>
        {allTag.map((item, index) => {
          const { sectiontitle } = item;
          return (
            <button
              onClick={() => setValue(index)}
              className={`btn ${styles.tabbtn} ${
                value === index ? styles.activebtn : ""
              }`}
              key={index}
            >
              {sectiontitle}
            </button>
          );
        })}
      </div>
      <Keywords
        sectiontitle={sectiontitle}
        sectiontitleen={sectiontitleen}
        allTags={allTags}
        path={path}
      />
    </>
  );
};

export default ToggleTag;
