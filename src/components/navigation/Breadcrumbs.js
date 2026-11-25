import styles from "@/styles/Breadcrumbs.module.css";
import { getHubBySlug } from "@/libs/hubPages";
import { getLocalizedField } from "@/utils/emakiDisplayTitle";
import Link from "next/link";
import { useRouter } from "next/router";

const Breadcrumbs = ({ name, test, testen, items }) => {
  const { locale, asPath } = useRouter();
  const isJa = locale === "ja";
  const cleanPath = (asPath || "").split(/[?#]/)[0];

  let resolvedTrails = [];
  if (Array.isArray(items) && items.length > 0) {
    resolvedTrails = items;
  } else if (test) {
    const normalizedHref =
      testen && (testen.startsWith("/") ? testen : `/${testen}`);
    resolvedTrails = normalizedHref ? [{ label: test, href: normalizedHref }] : [];
  } else if (/^\/genji\/[^/]+$/.test(cleanPath)) {
    const genjiHub = getHubBySlug("genji-world");
    if (genjiHub) {
      resolvedTrails = [
        {
          label: isJa ? "テーマ・特集ハブ一覧" : "Curated Themes & Hub Directory",
          href: "/hub",
        },
        {
          label: getLocalizedField(
            { title: genjiHub.titleJa, titleen: genjiHub.titleEn },
            "title",
            locale
          ),
          href: genjiHub.path || "/hub/genji-world",
        },
      ];
    }
  } else if (/^\/kusouzu\/[^/]+$/.test(cleanPath) && cleanPath !== "/kusouzu/chapters-kusouzu") {
    const kusouzuHub = getHubBySlug("kusouzu");
    if (kusouzuHub) {
      resolvedTrails = [
        {
          label: isJa ? "テーマ・特集ハブ一覧" : "Curated Themes & Hub Directory",
          href: "/hub",
        },
        {
          label: getLocalizedField(
            { title: kusouzuHub.titleJa, titleen: kusouzuHub.titleEn },
            "title",
            locale
          ),
          href: kusouzuHub.path || "/hub/kusouzu",
        },
      ];
    }
  }

  return (
    <section className={styles.container}>
      <ul className={styles.breadcrumbs}>
        <Link href="/">
          <a>Top</a>
        </Link>

        {resolvedTrails.map((trail) => (
          <span key={trail.href} style={{ display: "contents" }}>
            <p>{">"}</p>
            <Link href={trail.href} locale={locale}>
              <a>{trail.label}</a>
            </Link>
          </span>
        ))}

        <p> {" > "} </p>
        <p>{name}</p>
      </ul>
    </section>
  );
};

export default Breadcrumbs;