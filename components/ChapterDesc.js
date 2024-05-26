import React, { useState } from "react";
import SingleChapterDesc from "./SingleChapterDesc";
import styles from "../styles/ChapterDesc.module.css";

const ChapterDesc = ({ emakis,data }) => {
  const [toggle, setToggle] = useState(false);

  return (
    <>
      <p
        onClick={() => setToggle(!toggle)}
        className={styles.toggleChapterDesc}
      >
        {toggle ? "...各段の詞書・解説を閉じる" : "...各段の詞書・解説を読む"}
      </p>
      {toggle && (
        <div className={styles.chapterDescBox}>
          {emakis.map((item, index) => {
            const { cat } = item;
            if (( cat === "ekotoba")) {
              return (
                <SingleChapterDesc
                  item={item}
                  index={index}
                  key={index}
                  emakis={emakis}
                  data={data}
                />
              );
            }
          })}
        </div>
      )}
    </>
  );
};

export default ChapterDesc;
