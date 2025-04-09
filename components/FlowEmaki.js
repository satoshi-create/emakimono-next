import { AppContext } from "@/pages/_app";
import styles from "@/styles/FullscreenContents.module.css";
import Link from "next/link";
import { useContext } from "react";
import EmakiConteiner from "./EmakiConteiner";
import FullScreenComp from "./FullScreenComp";
import Title from "./Title";

const FlowEmaki = ({
  flowEmakis: emakis,
  sectiontitle,
  sectiontitleen,
  center,
}) => {
  const { orientation } = useContext(AppContext);
  return (
    <>
      <section className={`section-center section-padding`}>
        <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
        {/* {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>} */}
        {emakis.map((item, i) => {
          return (
            <div
              className={`${styles.container}  ${
                !center && (i % 2 ? styles.left : styles.right)
              }`}
              key={i}
            >
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
              <FullScreenComp
                index={i}
                edition={item.edition}
                editionen={item.editionen}
                titleen={item.titleen}
                title={item.title}
                desc={item.desc}
                genjieslug={item.genjieslug}
              >
                <EmakiConteiner
                  data={item}
                  height={orientation === "portrait" ? "30vh" : "60vh"}
                  // width={"80vw"}
                  scroll={false}
                  overflowX={"auto"}
                  boxshadow={" 0 5px 15px rgba(0, 0, 0, 20%)"}
                />
              </FullScreenComp>
              <div className={styles.link}>
                <Link href={`/${item.titleen}`}>
                  <a className={styles.linkedbutton}> 横スクロールで見る</a>
                </Link>
              </div>
            </div>
          );
        })}
        {/* {linktitle && (
          <Button
            title={
              locale === "en"
                ? `More flowing scrolls !!`
                : `流れる巻物をもっと見る`
            }
            path={`/${linkpath}`}
            style={columns}
          />
        )} */}
      </section>
    </>
  );
};

export default FlowEmaki;
