import React, { useState } from "react";
import FullScreenComp from "./FullScreenComp";
import EmakiConteiner from "./EmakiConteiner";
import Title from "./Title";
import Button from "./Button";
import { useRouter } from "next/router";
import styles from "../styles/FullscreenContents.module.css";
import { Italic } from "react-feather";

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

  return (
    <>
      <section className={`section-center section-padding `}>
        {/* <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} /> */}
        {emakis.map((item, i) => {
          return (
            <div
              className={`${styles.container}  ${
                i % 2 ? styles.left : styles.right
              }`}
              key={i}
            >
              {/* title */}
              {/* <h4 className={`${styles.title}`}>
                <Link href={`/${item.titleen}`}>
                  <a>{item.edition}</a>
                </Link>
              </h4> */}
              {/* waka */}
              <h4
                className={`${styles.waka} ${styles.kami}`}
                dangerouslySetInnerHTML={{
                  __html: item.waka_kami,
                }}
              ></h4>
              <h4
                className={`${styles.waka} ${styles.simo}`}
                dangerouslySetInnerHTML={{
                  __html: item.waka_simo,
                }}
              ></h4>
              <FullScreenComp index={i} width={"60vw"} edition={item.edition} titleen={item.titleen}>
                <EmakiConteiner
                  data={item}
                  height={"30vh"}
                  // width={"80vw"}
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

export default FlowEmaki;
