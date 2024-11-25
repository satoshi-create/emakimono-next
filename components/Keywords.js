import React,{useMemo} from "react";
import Title from "./Title";
import emakisData from "../libs/data";
import Link from "next/link";
import styles from "../styles/KeywordList.module.css";
import { keywordItem, personnameItem } from "../libs/func";
import { useRouter } from "next/router";
import Button from "./Button";
import CustomTagCloud from "../components/CustomTagCloud";

const Keywords = ({ sectiontitle, sectiontitleen, path, allTags }) => {

    const tags = useMemo(() => [
    { name: 'JavaScript', count: 38 },
    { name: 'React', count: 30 },
    { name: 'Nodejs', count: 28 },
    { name: 'Express.js', count: 25 },
    { name: 'HTML5', count: 33 },
    { name: 'MongoDB', count: 18 },
    { name: 'CSS3', count: 20 },
    ], []);

  console.log(allTags);



  const { locale } = useRouter();
  return (
    <section className={`section-grid section-padding `}>
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />

      <div className={`${styles.tags} ${locale === "ja" && styles.jatags}`}>
        <CustomTagCloud tags={allTags} />
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
