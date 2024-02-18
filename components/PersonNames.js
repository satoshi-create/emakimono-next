import React from "react";
import Title from "./Title";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestion } from "@fortawesome/free-solid-svg-icons";
import Button from "./Button";
import { useRouter } from "next/router";
import styles from "../styles/Tags.module.css";

const PersonNames = ({ sectiontitle, sectiontitleen, path, allTags, bcg }) => {
  const { locale } = useRouter();

  return (
    <section
      className={`section-grid section-padding`}
      style={{ background: bcg }}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <div className={`${styles.tags} ${locale === "ja" && styles.jatags}`}>
        {allTags.map((item, index) => {
          const { name, id, slug, total, ruby, portrait } = item;
          return (
            <Link href={`./${path}/${slug}`} key={index}>
              <a>
                {portrait ? (
                  <img src={portrait} alt={name} className={styles.portrait} />
                ) : (
                  <div className={styles.noportrait}>
                    <FontAwesomeIcon
                      icon={faQuestion}
                      className={styles.helpcircleicon}
                    />
                  </div>
                )}
                <p className={styles.name}>
                  {locale === "en" ? id : name}
                  <span className={styles.totalcount}>{`(${total})`}</span>
                </p>
              </a>
            </Link>
            // </div>
          );
        })}
      </div>
      <Button
        title={
          locale === "en" ? "View a list of personnames !!" : "人物名一覧を見る"
        }
        path={"/personnames"}
        style={"tag"}
      />
    </section>
  );
};

export default PersonNames;
