import React, { useState } from "react";
import FullScreenComp from "./FullScreenComp";
import EmakiConteiner from "./EmakiConteiner";
import Title from "./Title";
import Button from "./Button";
import { useRouter } from "next/router";
import styles from "../styles/FullscreenContents.module.css";
import { Italic } from "react-feather";
import Link from "next/link";

const FlowEmaki = ({
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
  const Left = {
    justifyContent: "flex-start",
  };
  const Right = {
    justifyContent: "flex-end",
  };

  return (
    <>
      <section className={`section-center section-padding`}>
        <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
        {emakis.map((item, i) => {
          return (
            <div
              className={`${styles.container}`}
              // style={i % 2 ? Right : Left}
              style={{
                justifyContent: `${i % 2 ? "flex-start" : "flex-end"}`,
                backgroundColor: `${toggleMode ? "rgb(20 20 20)" : "#f9fbff"}`,
              }}
              key={i}
            >
              <h4
                className={`${styles.title} ${
                  i % 2 ? styles.left : styles.right
                }`}
                style={{
                  backgroundImage: `${
                    i % 2
                      ? "linear-gradient(90deg,#ffdadb, #f2f3fd)"
                      : "linear-gradient(270deg,#ffdadb, #f2f3fd)"
                  }`,
                }}
              >
                <Link href={`/${item.titleen}`}>
                  <a>
                    {item.title}
                    <span>{item.edition}</span>
                  </a>
                </Link>
              </h4>
              <FullScreenComp iconStyle={i % 2 ? false : true} width={"80vw"}>
                <EmakiConteiner
                  data={item}
                  height={"50vh"}
                  // width={"80vw"}
                  scroll={false}
                  overflowX={"auto"}
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

export default FlowEmaki;
