import "lazysizes";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import Head from "../meta/Meta";
// import styles from '@/styles/Flow.css.module.css';
import { gridImages } from "@/libs/gridImages";
import { useLocale, useLocaleData } from "@/utils/func";
import { useRouter } from "next/router";
import GridImageList from "../GridImageList";
import Breadcrumbs from "../navigation/Breadcrumbs";

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
