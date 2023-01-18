import React, { useState } from "react";
import FullScreenComp from "./FullScreenComp";
import EmakiConteiner from "./EmakiConteiner";
import Title from "./Title";
import Button from "./Button";
import { useRouter } from "next/router";
import styles from "../styles/FullscreenContents.module.css";

const FullscreenContents = ({
  flowEmakis: emakis,
  sectiontitle,
  sectiontitleen,
  linktitle,
  linktitleen,
  linkpath,
  columns,
}) => {
  const { locale } = useRouter();

  const [toggleMode, setToggleMode] = useState(false);
  console.log(toggleMode);

  const Left = {
    justifyContent: "flex-start",
  };
  const Right = {
    justifyContent: "flex-end",
  };

  return (
    <>
      {/* <button onClick={() => setToggleMode(!toggleMode)}>toggle</button> */}
      <section className={`section-center`}>
        <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
        {emakis.map((item, i) => {
          return (
            <div
              className={`${styles.container}`}
              // style={i % 2 ? Right : Left}
              style={{
                justifyContent: `${i % 2 ? "flex - start" : "flex-end"}`,
                backgroundColor: `${toggleMode ? "rgb(20 20 20)" : "white"}`,
              }}
              key={i}
            >
              <h4
                className={`${styles.title} ${
                  i % 2 ? styles.left : styles.right
                }`}
                style={{
                  color: `${
                    toggleMode ? "rgb(44 44 44)" : "rgb(233, 233, 233)"
                  }`,
                }}
              >
                {item.title} <br /> {item.edition}
              </h4>
              <FullScreenComp iconStyle={i % 2 ? true : false}>
                <EmakiConteiner
                  data={item}
                  height={"50vh"}
                  width={"80vw"}
                  scroll={false}
                  overflowX={"hidden"}
                  boxshadow={" 0 5px 15px rgba(0, 0, 0, 20%)"}
                />
              </FullScreenComp>
            </div>
          );
        })}
        {linktitle && (
          <Button
            title={
              locale === "en"
                ? `More flowing scrolls !!`
                : `流れる巻物をもっと見る`
            }
            path={`/${linkpath}`}
            style={columns}
          />
        )}
      </section>
    </>
  );
};

export default FullscreenContents;
