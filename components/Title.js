import styles from "@/styles/Title.module.css";

const Title = ({ sectiontitle }) => {
  return (
    <div className={styles.title}>
      {/* <h3>{sectiontitleen}</h3> */}
      <h2>{sectiontitle}</h2>
    </div>
  );
};

export default Title;
