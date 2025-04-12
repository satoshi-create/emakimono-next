import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import styles from "@/styles/PersonNameList.module.css";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

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
            <Link href={`/personname/${slug}`} key={index}>
              <a className={styles.portrait}>
                <Image
                  src={portrait ? portrait : "/question-solid.svg"}
                  width={130}
                  height={130}
                  objectFit="contain"
                  className={styles.portraitImage}
                  alt={name}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                />

                <p className={styles.name}>
                  {locale === "en" ? id : name}
                  <span className={styles.totalcount}>{`(${total})`}</span>
                </p>
              </a>
            </Link>
          );
        })}
      </div>
      {path && (
        <Button
          title={
            locale === "en"
              ? "View a list of personnames !!"
              : "人物名一覧を見る"
          }
          path={path}
          style={"tag"}
        />
      )}
    </section>
  );
};

export default PersonNames;
