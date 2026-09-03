/**
 * 絵巻メタ情報の登場人物リンク（代表人物のみ YAML に載せた想定）。
 * 九相図の「モデル」リンク（KusouzuModelLink）とは別。
 */
import styles from "@/styles/EmakiPersonLinks.module.css";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

const EmakiPersonLinks = ({ personname }) => {
  const { t } = useTranslation("common");
  const { locale } = useRouter();

  if (!personname || personname.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <p className={styles.heading}>{t("personname.emakiSectionTitle")}</p>
      <ul className={styles.list}>
        {personname.map((person) => {
          const label = locale === "en" ? person.id : person.name;
          return (
            <li key={person.slug}>
              <Link href={`/personname/${person.slug}`}>
                <a className={styles.link}>
                  <span className={styles.name}>{label}</span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </a>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default EmakiPersonLinks;
