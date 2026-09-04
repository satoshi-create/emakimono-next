import LazyImage from "@/components/emaki/viewer/LazyImage";
import { AppContext } from "@/context/AppContext";
import styles from "@/styles/EmakiImage.module.css";
import { useContext } from "react";

const EmakiImage = ({
  item: { config, index, navIndex, uniqueIndex },
  item,
  isPlayMode,
  sceneIndex,
  emakiId,
}) => {
  const { scrollDialog } = useContext(AppContext);

  return (
    <div
      className={`section ${styles.emakiimage}`}
      ref={navIndex === index ? scrollDialog : null}
    >
      <LazyImage
        src={item}
        alt={item.name}
        width={item.srcWidth}
        height={item.srcHeight}
        config={config}
        uniqueIndex={uniqueIndex}
        navIndex={navIndex}
        sceneIndex={sceneIndex}
        isPlayMode={isPlayMode}
        emakiId={emakiId}
      />
    </div>
  );
};

export default EmakiImage;
