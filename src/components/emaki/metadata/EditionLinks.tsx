import SingleCardC from "@/components/ui/SingleCardC";
import styles from "@/styles/EditionLinks.module.css";
import type { EmakiImageMetadata } from '@/types/metadata';

// Define Props interface
interface EditionLinksProps {
  editionLinks: EmakiImageMetadata[]; // Expecting the pre-filtered array
}

const EditionLinks = ({ editionLinks }: EditionLinksProps) => {
  // const { locale } = useRouter();
  // const { t: alldata } = useLocaleData();
  // const editionLinks = alldata.filter(
  //   (item) => item.title === title && item.edition !== edition
  // );

  return (
    <div className={styles.container}>
      {editionLinks.map((item, i) => {
        return <SingleCardC item={item} key={i} />;
      })}
    </div>
  );
};

export default EditionLinks;
