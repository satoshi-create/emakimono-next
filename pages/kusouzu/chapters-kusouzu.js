import ChaptersKusouzuTable from "@/components/emaki/ChaptersKusouzuTable";
import Breadcrumbs from "@/components/common/Breadcrumbs";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Head from "@/components/common/Meta";
import ExtractingListData from "@/libs/utils/ExtractingListData";
import { useLocaleData } from "@/libs/utils/func";

const ChaptersKusouzulist = () => {
  const { t: data } = useLocaleData();
  const { locale } = useLocaleData();
  const removeNestedArrayObj = ExtractingListData();

  // const ExistKusouzuChapters = kusouzuSlugItem(removeNestedArrayObj);

  const KusouzuArrObj = data.filter((item) => item.title.includes("九相"));

  console.log(KusouzuArrObj);

  const tPageDesc =
    locale === "en"
      ? `This is the page for the list of the Nine stages of decay. We are producing a list of picture scrolls with each scene of the Nine stages of decay.`
      : `九相図一覧のページです。九相図の各場面が描かれた絵巻物の一覧リストを制作しています。`;
  return (
    <>
      <Head
        pagetitle={locale === "en" ? "chapters-kusouzu-list" : "九相図一覧"}
        pageDesc={tPageDesc}
      />
      <Header />
      <Breadcrumbs
        name={locale === "en" ? "chapters-kusouzu-list" : "九相図一覧"}
      />
      <ChaptersKusouzuTable
        sectiontitle={"九相図一覧"}
        sectiontitleen={"List of Nine stages of decay"}
        // ExistKusouzuChapters={ExistKusouzuChapters}
        KusouzuArrObj={KusouzuArrObj}
      />
      <Footer />
    </>
  );
};

export default ChaptersKusouzulist;
