import "lazysizes";
import Footer from "../common/Footer";
import Header from "../common/Header";
import Head from "../common/Meta";
// import styles from '@/styles/Flow.css.module.css';
import { useLocale, useLocaleData } from "@/libs/func";
import { gridImages } from "@/libs/gridImages";
import { useRouter } from "next/router";
import Breadcrumbs from "../common/Breadcrumbs";
import GridImageList from "../GridImageList";

const Famousscene = ({ cyouzyuuzinbutugiga, seiyoukaiga, suibokuga, mone }) => {
  const { t } = useLocale();
  const { t: data } = useLocaleData();
  const { locale } = useRouter();
  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={locale === "en" ? "famousscene" : "絵巻名場面集!!"} />
      <GridImageList
        images={gridImages}
        sectiontitle={t.famousscene.title}
        sectiontitleen={t.famousscene.titleen}
        sectiondesc={t.famousscene.desc}
        sectionname={t.famousscene.name}
      />
      <Footer />
    </>
  );
};

export default Famousscene;
