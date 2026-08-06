import styles from "@/styles/PersonProfile.module.css";
import { eraColor } from "@/utils/func";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const CLOUDINARY_BASE =
  "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive";

// 暫定ヒーロー画像: 九相図ハブと同じ画像（kuso-zu-emaki）
// 将来 personprofiles.json に person.heroCloudinary を追加すれば個別指定できる
const HERO_CLOUDINARY =
  "v1774936234/emakimono/kuso-zu-emaki__kuso-zu-emaki_1_01_01.jpg";

/**
 * Cloudinary loader for hero images.
 * Applies smart fill crop, auto format, quality, and a subtle dark
 * gradient overlay at the bottom for text readability.
 */
const heroLoader = ({ src, width, quality }) => {
  return `${CLOUDINARY_BASE},w_${width},ar_16:9,c_fill,g_face` +
    `,f_auto,q_${quality || 75}` +
    `,co_black,e_gradient_fade:y_-0.4/${src}`;
};

/**
 * 絵巻関連人物の紹介ヒーロー。
 * 九相図ハブと同様の「全幅ヒーロー画像 + 中央1200pxテキスト」構造。
 * 肖像（未設定なら名前の頭文字モノグラム）・名前・ふりがな・時代・人物紹介文・関連ハブを表示。
 */
const PersonProfile = ({ person }) => {
  const { locale } = useRouter();
  const { name, id, ruby, era, eraen, bio, bioen, hub } = person;

  const displayName = locale === "en" ? id : name;
  const displayBio = locale === "en" ? bioen : bio;
  const heroSrc = person.heroCloudinary || HERO_CLOUDINARY;

  return (
    <section className={styles.hero}>
      <div className={styles.heroImageWrap}>
        <Image
          loader={heroLoader}
          src={heroSrc}
          alt="九相図巻"
          width={1600}
          height={900}
          sizes="100vw"
          priority
          className={styles.heroImage}
        />
      </div>
      <div className={styles.heroText}>
        <div className={styles.headerText}>
          <p className={styles.nameEn}>{id}</p>
          <h1 className={styles.name}>
            {locale === "ja" ? (
              <ruby>
                {name}
                <rp>（</rp>
                <rt>{ruby}</rt>
                <rp>）</rp>
              </ruby>
            ) : (
              displayName
            )}
          </h1>
          {era && (
            <Link href={`/era/${eraen}`}>
              <a className={styles.era}>
                {locale === "en" ? `${eraen} period` : `${era}時代`}
              </a>
            </Link>
          )}
        </div>

        {displayBio && <p className={styles.bio}>{displayBio}</p>}

        {hub && (
          <Link href={hub.path}>
            <a className={styles.hubLink}>
              <span className={styles.hubLabel}>
                {locale === "en" ? hub.labelEn : hub.labelJa}
              </span>
              <span className={styles.hubArrow}>→</span>
            </a>
          </Link>
        )}
      </div>
    </section>
  );
};

export default PersonProfile;
