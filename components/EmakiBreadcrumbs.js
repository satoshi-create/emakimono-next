import styles from "@/styles/EmakiBreadcrumbs.module.css";
import Link from "next/link";

const EmakiBreadcrumbs = ({ nameA, nameAen, nameB, orientation }) => {
  return (
    <section
      className={`${orientation === "portrait" && styles.prt}  ${
        styles.container
      }`}
    >
      <div className={styles.breadcrumbs}>
        <Link href={"/"}>
          <a>home</a>
        </Link>

        {nameA && (
          <>
            <span>{">"}</span>
            <Link href={`/${nameAen}`}>{nameA}</Link>
          </>
        )}

        <span> {">"} </span>
        <p>{nameB}</p>
      </div>
    </section>
  );
};

export default EmakiBreadcrumbs;
