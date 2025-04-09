import SingleCardC from "@/components/SingleCardC";
import styles from "@/styles/EditionLinks.module.css";

const EditionLinks = ({ editionLinks }) => {
  // const { locale } = useRouter();
  // const { t: alldata } = useLocaleData();
  // const editionLinks = alldata.filter(
  //   (item) => item.title === title && item.edition !== edition
  // );

  return (
    <div className={styles.container}>
      {editionLinks.map((item, i) => {
        return <SingleCardC item={item} key={i} variant={"editionlink"} />;
      })}
    </div>
  );
};

export default EditionLinks;
