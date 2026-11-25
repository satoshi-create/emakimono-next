import { AppContext } from "@/context/AppContext";
import styles from "@/styles/CardForSearchResults.module.css";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";
import { eraColor } from "@/utils/func";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";

const CardForSearchResults = ({ emakis, columns, needdesc }) => {
  const { closeSearchModal } = useContext(AppContext);
  const { locale } = useRouter();
  const isJa = locale === "ja";

  return (
    <div className={styles.searchbox}>
      {emakis.map((item, index) => {
        const {
          titleen,
          title,
          thumb,
          edition,
          author,
          authoren,
          era,
          eraen,
          desc,
          typeen,
          type,
          keyword,
        } = item;

        const filterDesc = typeof desc === "string" ? desc.substring(0, 40) : "";
        const descTemp = `${title} ${
          author && `（${author}）`
        }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

        return (
          <div key={index} onClick={closeSearchModal} className={styles.card}>
            <div className={styles.single}>
              <Link href={`/${titleen}`}>
                <a target="_blank">
                  <Image
                    src={thumb}
                    width={533}
                    height={300}
                    sizes="100vw"
                    alt={title}
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                  />
                </a>
              </Link>
            </div>
            <div className={styles.footer}>
              <div className={styles.cat}>
                <Link href={`/type/${typeen}`}>
                  <a className={styles.type}>
                    {getLocalizedField(item, "type", locale)}
                  </a>
                </Link>
                <Link href={`/era/${eraen}`}>
                  <a
                    className={`${styles.era}`}
                    style={{
                      border: eraColor(era),
                      backgroundColor: eraColor(era),
                      color: eraColor(era) ? "white" : "black",
                    }}
                  >
                    {isJa
                      ? `${getLocalizedField(item, "era", locale)}時代`
                      : `${getLocalizedField(item, "era", locale)} period`}
                  </a>
                </Link>
              </div>
              <h3 className={styles.title}>
                {getLocalizedField(item, "title", locale)}{" "}
                {isJa && edition}
              </h3>
              {author ? (
                <Link href={`/author/${authoren}`}>
                  <a className={styles.authorLink}>
                    <h4 className={styles.author}>
                      {getLocalizedField(item, "author", locale)}
                    </h4>
                  </a>
                </Link>
              ) : (
                <br />
              )}
              {needdesc && (
                <div className={styles.desc}>
                  {desc ? `${filterDesc}...` : descTemp}
                </div>
              )}
              <div className={styles.viewemaki}>
                <Link href={`/${titleen}`}>
                  <a>
                    <button className={styles.viewemakiBtn}>
                      {isJa ? "横スクロールで見る" : "Enjoy by right to left scroll !!"}
                    </button>
                  </a>
                </Link>
              </div>
              {keyword && (
                <div className={styles.keyword}>
                  {keyword.slice(0, 3).map((item, index) => {
                    const { name, slug, id } = item;
                    return (
                      <Link href={`/keyword/${slug}`} key={index}>
                        <a className={styles.keywordLink}>
                          {getLocalizedField({ name, nameen: id }, "name", locale)}
                        </a>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardForSearchResults;
