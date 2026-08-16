import TopRanking from "@/components/emaki/ranking/TopRanking";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import CardA from "@/components/ui/CardA";
import ExtractingListData from "@/utils/ExtractingListData";
import { isKusouzuScroll } from "@/utils/buildKusouzuHubData";
import { useLocale } from "@/utils/func";
import styles from "@/styles/EmakiHub.module.css";
import "lazysizes";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Home = () => {
  const { t } = useLocale();
  const { t: tCommon } = useTranslation("common");
  const removeNestedArrayObj = ExtractingListData();

  const kusouzuEmakis = removeNestedArrayObj.filter(isKusouzuScroll);

  const cyouzyuuEmakis = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("鳥獣人物戯画絵巻")
  );

  return (
    <main>
      <Head />
      <Header fixed={false} />
      <Link href="/emaki-hub">
        <a className={styles.topBanner}>
          <span className={styles.topBannerTitle}>
            {tCommon("emakiHub.topBannerTitle")}
          </span>
          <span className={styles.topBannerCta}>
            {tCommon("emakiHub.topBannerCta")}
          </span>
        </a>
      </Link>
      <section className="section-grid section-padding">
        <div className="hero">
          <h1 className="heroTitle">{t.top.title}</h1>
          <p className="heroDesc">{t.top.desc}</p>
        </div>
      </section>
      <CardA
        emakis={cyouzyuuEmakis}
        columns={t.cyouzyuu.columns}
        sectiontitle={t.cyouzyuu.title}
        sectiontitleen={t.cyouzyuu.titleen}
        sectiondesc={t.cyouzyuu.desc}
        sectionname={t.cyouzyuu.name}
        linktitle={t.cyouzyuu.title}
        linktitleen={t.cyouzyuu.title}
        linkpath={"flow-cyouzyuu"}
        bcg={"#f9fbff"}
      />
      <TopRanking />
      <CardA
        emakis={kusouzuEmakis}
        columns={t.kusouzu.columns}
        sectiontitle={t.kusouzu.title}
        sectiontitleen={t.kusouzu.titleen}
        sectiondesc={t.kusouzu.desc}
        sectionname={t.kusouzu.name}
        linktitle={t.kusouzu.title}
        linktitleen={t.kusouzu.title}
        linkpath={"flow-kusouzu"}
        bcg={"#f9fbff"}
      />
      <Footer />
    </main>
  );
};

export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
    },
  };
};

export default Home;
