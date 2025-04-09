import CardA from "@/components/common/CardA";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Head from "@/components/common/Meta";
import ExtractingListData from "@/utils/ExtractingListData";
import { useLocale } from "@/utils/func";
import "lazysizes";

const Home = () => {
  const { t } = useLocale();
  const removeNestedArrayObj = ExtractingListData();

  const kusouzuEmakis = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("九相")
  );

  const cyouzyuuEmakis = removeNestedArrayObj.filter((emaki) =>
    emaki.title.includes("鳥獣人物戯画絵巻")
  );

  return (
    <main>
      <Head />
      <Header fixed={false} />
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
      />
      <Footer />
    </main>
  );
};

export default Home;
