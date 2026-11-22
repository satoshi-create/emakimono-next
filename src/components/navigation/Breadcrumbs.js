import styles from "@/styles/Breadcrumbs.module.css";
import Link from "next/link";
import { useRouter } from "next/router";

const Breadcrumbs = ({ name, test, testen }) => {
  const { locale } = useRouter();
  const normalizedHref =
    testen && (testen.startsWith("/") ? testen : `/${testen}`);

  return (
    <section className={styles.container}>
      <ul className={styles.breadcrumbs}>
        <Link href={"/"}>
          <a>Top</a>
        </Link>

        {test && (
          <>
            <p>{">"}</p>
            <Link href={normalizedHref} locale={locale}>
              <a>{test}</a>
            </Link>
          </>
        )}

        <p> {" > "} </p>
        <p>{name}</p>
      </ul>
    </section>
  );
};

export default Breadcrumbs;
