import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import Head from "@/components/meta/Meta";
import CardA from "@/components/ui/CardA";
import { getScrollList } from "@/libs/api/scrollService";
import ExtractingListData from "@/utils/ExtractingListData";
import { useLocale } from "@/utils/func";
import "lazysizes";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

const Home = ({ scrollList = [] }) => {
  const { t } = useLocale();
  const removeNestedArrayObj = ExtractingListData();

  // Supabase から取得した一覧があれば CardA 用にマッピング（リンクは従来の /titleen 形式）
  const mappedScrollList =
    scrollList.length > 0
      ? scrollList.map((m) => ({
          id: m.id,
          title: m.title,
          titleen: m.titleen ?? m.scroll_id,
          thumb: m.thumbnail,
          author: m.author,
          authoren: m.author,
          era: m.era,
          eraen: m.era,
          desc: m.description ?? "",
          type: "絵巻",
          typeen: "emaki",
          keyword: m.keyword ?? [],
          edition: "",
        }))
      : [];

  const listSource =
    mappedScrollList.length > 0 ? mappedScrollList : removeNestedArrayObj;

  const kusouzuEmakis = listSource.filter((emaki) =>
    emaki.title && emaki.title.includes("九相")
  );

  const cyouzyuuEmakis = listSource.filter((emaki) =>
    emaki.title && emaki.title.includes("鳥獣人物戯画絵巻")
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
        linkpath="flow-cyouzyuu"
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
        linkpath="flow-kusouzu"
      />
      <Footer />
    </main>
  );
};

export const getStaticProps = async ({ locale }) => {
  let scrollList = [];
  try {
    scrollList = await getScrollList();
  } catch (e) {
    console.warn("Supabase getScrollList failed, using fallback list:", e?.message);
  }

  // リンクを従来の /Chōjū-jinbutsu-giga_first 形式にするため、image-metadata-cache から titleen（slug）をマージ
  if (scrollList.length > 0) {
    const metadataCache = require("@/data/image-metadata-cache/image-metadata-cache.json");
    scrollList = scrollList.map((s) => {
      const cached = metadataCache.find((c) => c.id === s.id);
      return { ...s, titleen: cached?.titleen ?? s.scroll_id };
    });
  }

  return {
    props: {
      ...(await serverSideTranslations(locale ?? "ja", ["common"])),
      scrollList,
    },
  };
};

export default Home;
