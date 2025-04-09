import { eraColor } from "@/libs/func";
import styles from "@/styles/CardB.module.css";
import parse from "html-react-parser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Button from "./common/Button";
import Title from "./Title";

const CardB = ({
  columns,
  sectiontitle,
  sectionname,
  sectiondesc,
  sectiontitleen,
  bcg,
  linkpath,
  linktitle,
  linktitleen,
}) => {
  const { locale } = useRouter();
  const historyemakis = [
    {
      path: "/era/heiann",
      era: "平安",
      eraen: "heian",
      src: "/cyoujyuu_yamazaki_kou_13-375.webp",
      eracolor: "orange",
    },
    {
      path: "/era/kamakura",
      era: "鎌倉",
      eraen: "kamakura",
      src: "/naomoto_03-1080.webp",
      eracolor: "green",
    },
    {
      path: "/era/muromachi",
      era: "室町",
      eraen: "muromachi",
      src: "/sessyu_sikisansuizu_07-1080.webp",
      eracolor: "purple",
    },
    {
      path: "/era/aduchimomoyama",
      era: "安土・桃山",
      eraen: "aduchi<br/>momoyama",
      src: "/unryuzu_01-1080.webp",
      eracolor: "gold",
    },
    {
      path: "/era/edo",
      era: "江戸",
      eraen: "edo",
      src: "/tokugawagyouretsu_32-1080.webp",
      eracolor: "skyblue",
    },
    {
      path: "/era/meiji",
      era: "明治",
      eraen: "meiji",
      src: "/yoroboushi_01-1080.webp",
      eracolor: "firebrick",
    },
  ];
  return (
    <section
      className={`section-grid section-padding`}
      style={{ background: bcg }}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      {sectiondesc && <p className={styles.sectiondesc}>{sectiondesc}</p>}
      <section className={styles.container}>
        {historyemakis.map((item, index) => {
          const { path, era, eraen, src, eracolor } = item;
          return (
            <div
              className={`${styles.cardContainer} ${styles[columns]}`}
              key={index}
            >
              <Link href={path}>
                <a className={styles.link}>
                  <figure className={styles.figure} key={index}>
                    <Image
                      src={src}
                      layout="fill"
                      objectFit="cover"
                      // width={533}
                      // height={300}
                      className={styles.image}
                      alt={era}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                    />
                    <div
                      className={styles.info}
                      style={{
                        border: eraColor(era),
                        backgroundColor: eraColor(era),
                      }}
                    >
                      <p className={styles.title}>
                        {locale === "en" ? parse(eraen) : parse(era)}
                      </p>
                    </div>
                  </figure>
                </a>
              </Link>
            </div>
          );
        })}
        {/* <Button
          title={
            locale === "en" ? "View a list of EMAKIMONO !!" : "絵巻一覧を見る"
          }
          path={"/category/emaki"}
          style={"cardB"}
        /> */}
        {linktitle && (
          <Button
            title={
              locale === "en"
                ? `View a list of ${linktitleen} !!`
                : `${linktitle}一覧を見る`
            }
            path={linkpath}
            style={columns}
          />
        )}
      </section>
    </section>
  );
};

export default CardB;
