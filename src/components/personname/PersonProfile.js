import styles from "@/styles/PersonProfile.module.css";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";
import { createCloudinaryHeroLoader } from "@/utils/cloudinaryUrl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

const heroLoader = createCloudinaryHeroLoader("g_face");

// フォールバックヒーロー画像: 九相図ハブと同じ画像（kuso-zu-emaki）
// personprofiles.json の person.heroCloudinary で個別指定できる
const HERO_CLOUDINARY =
  "v1774936234/emakimono/kuso-zu-emaki__kuso-zu-emaki_1_01_01.jpg";

/**
 * 絵巻関連人物の紹介ヒーロー。
 * 九相図ハブと同様の「全幅ヒーロー画像 + 中央1200pxテキスト」構造。
 * 肖像（未設定なら名前の頭文字モノグラム）・名前・ふりがな・時代・人物紹介文・関連ハブを表示。
 */
const PersonProfile = ({ person }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const { name, id, nameen, ruby, era, eraen, bio, bioen, hub, featuredLinks } =
    person;

  const displayName = isJa ? name : nameen || id;
  const displayBio = isJa ? bio : bioen;
  const heroSrc = person.heroCloudinary || HERO_CLOUDINARY;
  const links =
    Array.isArray(featuredLinks) && featuredLinks.length > 0
      ? featuredLinks
      : hub
        ? [{ path: hub.path, labelJa: hub.labelJa, labelEn: hub.labelEn }]
        : [];

  return (
    <section className={styles.hero}>
      <div className={styles.heroImageWrap}>
        <Image
          loader={heroLoader}
          src={heroSrc}
          alt="九相図巻"
          width={2100}
          height={900}
          sizes="100vw"
          priority
          className={styles.heroImage}
        />
      </div>
      <div className={styles.heroText}>
        <div className={styles.headerText}>
          <p className={styles.nameEn}>{nameen || id}</p>
          <h1 className={styles.name}>
            {isJa ? (
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
                {isJa
                  ? `${getLocalizedField(person, "era", locale)}時代`
                  : `${getLocalizedField(person, "era", locale)} period`}
              </a>
            </Link>
          )}
        </div>

        {displayBio && <p className={styles.bio}>{displayBio}</p>}

        {links.length > 0 && (
          <div className={styles.linkStack}>
            {links.map((link) => (
              <Link key={link.path} href={link.path}>
                <a
                  className={
                    link.path.includes("chapters-kusouzu")
                      ? styles.hubLink
                      : styles.workLink
                  }
                >
                  <span className={styles.hubLabel}>
                    {getLocalizedField(
                      { label: link.labelJa, labelen: link.labelEn },
                      "label",
                      locale
                    )}
                  </span>
                  <span className={styles.hubArrow}>→</span>
                </a>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PersonProfile;
