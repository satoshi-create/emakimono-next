import Image from "next/image";
import styles from "@/styles/KusouzuHub.module.css";
import { createCloudinaryHeroLoader } from "@/utils/cloudinaryUrl";
import { useTranslation } from "next-i18next";

const heroLoader = createCloudinaryHeroLoader("g_face");

const KusouzuHubIntro = ({ heroThumb, heroCloudinary }) => {
  const { t } = useTranslation("common");

  return (
    <>
      {(heroCloudinary || heroThumb) && (
        <div className={styles.heroImageWrap}>
          {heroCloudinary ? (
            <Image
              loader={heroLoader}
              src={heroCloudinary}
              alt={t("kusouzuHub.introTitle")}
              width={1600}
              height={900}
              sizes="100vw"
              priority
              className={styles.heroImage}
            />
          ) : (
            <Image
              src={heroThumb}
              alt={t("kusouzuHub.introTitle")}
              width={800}
              height={450}
              sizes="100vw"
              priority
              className={styles.heroImage}
            />
          )}
        </div>
      )}
    </>
  );
};

export default KusouzuHubIntro;
