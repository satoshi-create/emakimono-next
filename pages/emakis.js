import "lazysizes";
import emakisData from "../libs/data";
import Link from "next/link";
import ResposiveImage from "../components/ResposiveImage";
import styles from "../styles/Emakis.module.css";

export default function emakis() {
  return (
    <section className={`section-center ${styles.conteiner}`}>
      {emakisData.map((item, index) => {
        const {
          titleen,
          title,
          thumb,
          edition,
          author,
          era,
          desc,
          type,
          typeColor,
        } = item;
        return (
          <div className={styles.card} key={index}>
            <Link href={`/emakis/${titleen}`}>
              <div className={styles.single}>
                <picture>
                  <source data-srcset={thumb} type="image/webp" />
                  <img
                    src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                    className="lazyload loading"
                    alt={thumb}
                  />
                </picture>
                <div className={`${typeColor} ${styles.type}`}>{type}</div>
              </div>
            </Link>
            <div className={styles.info}>
              <div className={styles.header}>
                <h3>
                  {title}
                  {edition ? edition : ""}
                </h3>
                <h4 className={styles.author}>{author}</h4>
                <h4 className={styles.era}>{era}</h4>
              </div>
              <div className={styles.desc}>
                <p>{desc}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
