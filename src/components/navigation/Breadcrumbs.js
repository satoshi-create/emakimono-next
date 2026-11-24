import styles from "@/styles/Breadcrumbs.module.css";
import { getHubBySlug } from "@/libs/hubPages";
import Link from "next/link";
import { useRouter } from "next/router";

const Breadcrumbs = ({ name, test, testen, items }) => {
  const { locale, asPath } = useRouter();
  const isEn = locale === "en";
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
          label: isEn ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
          href: "/hub",
        },
        {
          label: isEn ? genjiHub.titleEn : genjiHub.titleJa,
          href: genjiHub.path || "/hub/genji-world",
        },
      ];
    }
  } else if (/^\/kusouzu\/[^/]+$/.test(cleanPath) && cleanPath !== "/kusouzu/chapters-kusouzu") {
    const kusouzuHub = getHubBySlug("kusouzu");
    if (kusouzuHub) {
      resolvedTrails = [
        {
          label: isEn ? "Curated Themes & Hub Directory" : "テーマ・特集ハブ一覧",
          href: "/hub",
        },
        {
          label: isEn ? kusouzuHub.titleEn : kusouzuHub.titleJa,
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