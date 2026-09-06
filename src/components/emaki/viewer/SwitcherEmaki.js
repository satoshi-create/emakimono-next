import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import ekotobaStyles from "@/styles/OverlayEkotoba.module.css";
import { sceneSectionId } from "@/utils/emakiSceneDom";
import { forwardRef } from "react";

/** 絵巻シーンを cat に応じて image / ekotoba に振り分け（現行 type は絵巻のみ） */
const SwitcherEmaki = forwardRef(
  (
    {
      cat,
      data,
      item,
      index,
      src,
      backgroundImage,
      selectedRef,
      navIndex,
      scroll,
      uniqueIndex,
      isPlayMode,
      sceneIndex,
    },
    ref
  ) => {
    if (cat === "image") {
      return (
        <section ref={ref} id={sceneSectionId(index)}>
          <EmakiImage
            key={index}
            item={{
              ...item,
              index,
              scroll,
              selectedRef,
              navIndex,
              uniqueIndex,
            }}
            isPlayMode={isPlayMode}
            sceneIndex={sceneIndex}
            emakiId={data?.titleen}
          />
        </section>
      );
    }
    if (cat === "ekotoba") {
      return (
        <section
          ref={ref}
          id={sceneSectionId(index)}
          className={!src ? ekotobaStyles.markerSection : undefined}
        >
          <OverlayEkotoba
            key={index}
            item={{
              ...item,
              cat,
              index,
              backgroundImage,
              scroll,
              selectedRef,
              navIndex,
              data,
              uniqueIndex,
            }}
          />
        </section>
      );
    }
    return null;
  }
);

SwitcherEmaki.displayName = "SwitcherEmaki";

export default SwitcherEmaki;
