import styles from "@/styles/Breadcrumbs.module.css";
import Link from "next/link";

const Breadcrumbs = ({ name, test, testen }) => {
  return (
    <section className={styles.container}>
      <ul className={styles.breadcrumbs}>
        <Link href={"/"}>
          <a>Top</a>
        </Link>

        {test && (
          <>
            <p>{">"}</p>
            <Link href={`/${testen}`}>
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
