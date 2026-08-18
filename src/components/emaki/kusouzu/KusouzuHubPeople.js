import ClassicalFontLink from "@/components/meta/ClassicalFontLink";
import Title from "@/components/ui/Title";
import hubStyles from "@/styles/KusouzuHub.module.css";
import { personProfileItem } from "@/utils/func";
import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const KUSOUZU_PERSON_SLUGS = ["danrinkougou", "ononokomachi"];

/** 九相図ハブの「登場人物」セクション。モデルとされる人物の紹介ページへリンクする。 */
const KusouzuHubPeople = () => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  const people = personProfileItem(emakisData).filter((p) =>
    KUSOUZU_PERSON_SLUGS.includes(p.slug)
  );

  return (
    <section className={`section-grid section-padding ${hubStyles.peopleSection}`}>
      <ClassicalFontLink />
      <Title sectiontitle={t("kusouzuHub.peopleSectionTitle")} />
      <p className={hubStyles.peopleIntro}>{t("kusouzuHub.peopleIntro")}</p>
      <ul className={hubStyles.peopleGrid}>
        {people.map((person) => {
          const displayName = locale === "en" ? person.id : person.name;
          return (
            <li key={person.slug}>
              <Link href={`/personname/${person.slug}`}>
                <a className={hubStyles.peopleCard}>
                  <span className={hubStyles.peopleAvatar} aria-hidden="true">
                    {person.name.slice(0, 1)}
                  </span>
                  <span className={hubStyles.peopleName}>{displayName}</span>
                  <span className={hubStyles.peopleRuby}>
                    {locale === "ja" ? person.ruby : ""}
                  </span>
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default KusouzuHubPeople;
