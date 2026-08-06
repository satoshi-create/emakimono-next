import Button from "@/components/ui/Button";
import Title from "@/components/ui/Title";
import styles from "@/styles/PersonNameList.module.css";
import { eraColor } from "@/utils/func";
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
          const { name, id, slug, total, ruby, era, eraen, portrait } = item;
          const eraColorValue = eraColor(era);

          return (
            <Link href={`/personname/${slug}`} key={index}>
              <a className={styles.portrait}>
                <span className={styles.avatarWrap}>
                  {portrait ? (
                    <Image
                      src={portrait}
                      width={130}
                      height={130}
                      objectFit="contain"
                      className={styles.portraitImage}
                      alt={name}
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className={styles.monogram}
                      style={
                        eraColorValue
                          ? { backgroundColor: eraColorValue }
                          : undefined
                      }
                      aria-hidden="true"
                    >
                      {name.slice(0, 1)}
                    </span>
                  )}
                </span>
                <p className={styles.name}>
                  {locale === "en" ? id : name}
                  <span className={styles.totalcount}>{`(${total})`}</span>
                </p>
                {locale === "ja" && ruby && (
                  <p className={styles.ruby}>{ruby}</p>
                )}
                {era && (
                  <p className={styles.era}>
                    {locale === "en" ? `${eraen} period` : `${era}時代`}
                  </p>
                )}
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
