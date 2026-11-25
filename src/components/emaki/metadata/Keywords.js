import CustomTagCloud from "@/components/keyword/CustomTagCloud";
import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import styles from "@/styles/KeywordList.module.css";
import { useRouter } from "next/router";

const Keywords = ({ sectiontitle, sectiontitleen, path, allTags }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  return (
    <section className={`section-grid section-padding `}>
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />

      <div className={`${styles.tags} ${isJa && styles.jatags}`}>
        <CustomTagCloud tags={allTags} />
        {/* {allTags.map((item, index) => {
          const { name, id, slug, total, ruby } = item;

          return (
            <Link href={`/keyword/${slug}`} key={index}>
              <a className={styles.title}>
                <p>
                  {isJa ? name : id}
                  <span className={styles.total}>{`(${total})`}</span>
                </p>
              </a>
            </Link>
          );
        })} */}
      </div>
      {path && (
        <Button
          title={
            isJa
              ? "キーワード一覧を見る"
              : "View a list of keywords !!"
          }
          path={path}
          style={"tag"}
        />
      )}
    </section>
  );
};

export default Keywords;
