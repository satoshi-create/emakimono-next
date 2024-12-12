import React, { useState,useContext} from "react";
import SingleChapterDesc from "./SingleChapterDesc";
import styles from "../styles/ChapterDesc.module.css";
import {
  Accordion,
  Text
} from "@chakra-ui/react";
import { AppContext } from "../pages/_app";


const ChapterDesc = ({ emakis, data }) => {

  const [toggle, setToggle] = useState(true);


    const [expandedIndex, setExpandedIndex] = useState(null);

    const handleToggle = (index) => {
      setExpandedIndex((prevIndex) => (prevIndex === index ? null : index));
    };


  return (
    <>
      {toggle && (
        <div className={styles.chapterDescBox}>
          <article>
            <Accordion
              allowToggle
              index={expandedIndex}
              onChange={(index) => handleToggle(index)}
            >
              {emakis.map((item, index) => {
                const { cat } = item;
                if (cat === "ekotoba") {
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
            </Accordion>
          </article>
        </div>
      )}
      <p
        onClick={() => setToggle(!toggle)}
        className={styles.toggleChapterDesc}
      >
        <Text fontSize={{ base: "0.75rem", sm: "0.85rem", md: "1.0rem" }} textAlign="right">
          {toggle ? "...各段の解説を閉じる" : "...各段の解説を読む"}
        </Text>
      </p>
    </>
  );
};

export default ChapterDesc;
