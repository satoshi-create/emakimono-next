import React, { useState } from "react";
import Keywords from "./Keywords";
import allKeywords from "../libs/allKeywords";
import allPersonNames from "../libs/allPersonNames";
import Title from "./Title";
import styles from "../styles/ToggleTag.module.css";

const ToggleTag = () => {
  const [value, setValue] = useState(0);

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
