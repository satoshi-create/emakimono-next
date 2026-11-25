import styles from "@/styles/Title.module.css";
import { useRouter } from "next/router";

const Title = ({ sectiontitle, sectiontitleen }) => {
  const { locale } = useRouter();
  const isJa = locale === "ja";
  const heading = !isJa && sectiontitleen ? sectiontitleen : sectiontitle;

  return (
    <div className={styles.title}>
      <h2>{heading}</h2>
    </div>
  );
};

export default Title;
