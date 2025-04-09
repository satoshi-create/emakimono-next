import GridImageCard from "@/components/GridImageCard";
import styles from "@/styles/GridImageList.module.css";
import { useRouter } from "next/router";
import { useReducer } from "react";
import Button from "../common/Button";
import Title from "../common/Title";

const GridImageList = ({
  images,
  sectiontitle,
  sectionname,
  sectiondesc,
  sectiontitleen,
  linktitle,
  linktitleen,
  linkpath,
  columns,
  bcg,
  slice,
}) => {
  const { locale } = useRouter();

  const init = {
    gridImages: images,
  };

  const enterImage = (id) => {
    dispatch({ type: "ENTERIMAGE", payload: id });
  };
  const leaveImage = (id) => {
    dispatch({ type: "LEAVEIMAGE", payload: id });
  };
  const reducer = (state, action) => {
    if (action.type === "ENTERIMAGE") {
      let tempgridImages = state.gridImages.map((item) => {
        if (item.id === action.payload) {
          return { ...item, bln: true };
        }
        return item;
      });
      return { gridImages: tempgridImages };
    }
    if (action.type === "LEAVEIMAGE") {
      let tempgridImages = state.gridImages.map((item) => {
        if (item.id === action.payload) {
          return { ...item, bln: false };
        }
        return item;
      });
      return { gridImages: tempgridImages };
    }
  };

  const [state, dispatch] = useReducer(reducer, init);

  const GridImagesData = (slice) => {
    if (slice) {
      const slicedGridImages = state.gridImages.slice(0, 5);
      return slicedGridImages;
    } else {
      return state.gridImages;
    }
  };

  return (
    <section
      className={`section-grid section-padding`}
      style={{ background: bcg }}
    >
      <Title sectiontitle={sectiontitle} sectiontitleen={sectiontitleen} />
      <div className={styles.gridconteinter}>
        {GridImagesData(slice).map((item, index) => {
          return (
            <GridImageCard
              item={item}
              key={index}
              enterImage={enterImage}
              leaveImage={leaveImage}
            />
          );
        })}
      </div>
      {linktitle && (
        <Button
          title={
            locale === "en"
              ? `More flowing ${linktitleen} !!`
              : `${linktitle}をもっと見る`
          }
          path={`/${linkpath}`}
          style={columns}
        />
      )}
    </section>
  );
};

export default GridImageList;
