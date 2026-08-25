import HubPageShell from "@/components/layout/HubPageShell";
import PersonProfile from "@/components/personname/PersonProfile";
import CardA from "@/components/ui/CardA";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import {
  findPersonProfile,
  personProfileItem,
  removeNestedEmakisObj,
} from "@/utils/func";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { DISPLAY_PERSON_SLUGS } from "@/libs/constants/displayPersonSlugs";
import { useTranslation } from "next-i18next";

const PersonnameDetail = ({ person, posts, slug }) => {
  const { locale } = useRouter();
  const { t } = useTranslation("common");
  const displayName = locale === "en" ? person.id : person.name;

  const tPageDesc =
    locale === "en"
      ? person.slug === "ononokomachi"
        ? `Ono no Komachi — peerless beauty and model of kusōzu (the Nine Stages of Decay). Explore the Ono no Komachi kusōzu scroll and the works she appears in, browsing right to left.`
        : `${person.id} — introduction to a person related to emaki picture scrolls. Discover the scrolls this person appears in.`
      : person.slug === "ononokomachi"
      ? `${person.name}（${person.ruby}）— 六歌仙の一の絶世の美女で、「小野小町九相図」のモデルとされる歌人。小野小町九相図（Wellcome コレクション）を中心に、本人が登場する絵巻を縦書き・横スクロールで楽しめます。`
      : `${person.name}（${person.ruby}）— 絵巻物に関連する人物の紹介ページ。この人物が登場する絵巻を、縦書き・横スクロールで楽しめます。`;

  return (
    <HubPageShell
      meta={{ pagetitle: displayName, pageDesc: tPageDesc }}
      headerSlug={`personname/${slug}`}
      breadcrumb={{
        name: displayName,
        test: locale === "en" ? "personname list" : "人物名一覧",
        testen: "personname/personnamelist",
      }}
      hero={<PersonProfile person={person} />}
      sections={[
        {
          id: "works",
          content:
            posts.length > 0 ? (
              <CardA
                emakis={posts}
                columns={"three"}
                sectionname={"recommend"}
                sectiontitle={t("personname.worksTitle")}
                sectiontitleen={locale === "en" ? person.id : person.name}
              />
            ) : (
              <section className="section-grid section-padding">
                <h2 className="personname-empty">{t("personname.noWorks")}</h2>
              </section>
            ),
        },
      ]}
    />
  );
};

export default PersonnameDetail;

export const getStaticPaths = async () => {
  // 一覧掲載人物（DISPLAY_PERSON_SLUGS）または cache に登場する人物（total > 0）のみビルド
  const allSlugs = personProfileItem(emakisData)
    .filter((p) => p.total > 0 || DISPLAY_PERSON_SLUGS.includes(p.slug))
    .map((p) => p.slug);

  const paths = allSlugs.map((slug) => ({
    params: { slug },
    locale: "ja",
  }));
  paths.push(...paths.map((item) => ({ ...item, locale: "en" })));
  return { paths, fallback: false };
};

export const getStaticProps = async (context) => {
  const { locale } = context;
  const personnameslug = context.params.slug;

  const person = findPersonProfile(personnameslug);

  if (!person) {
    return { notFound: true };
  }

  // 関連絵巻: dataEmakis.json の personname マッピング（正本）→ 閲覧可能なキャッシュ絵巻のみ表示
  const relatedTitleens = emakisData
    .filter((x) => x.personname?.some((y) => y.slug === personnameslug))
    .map((x) => x.titleen);

  const posts = emakisData
    .filter((x) => relatedTitleens.includes(x.titleen))
    .map((item) => removeNestedEmakisObj(item));

  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
      person,
      posts,
      slug: personnameslug,
    },
  };
};
