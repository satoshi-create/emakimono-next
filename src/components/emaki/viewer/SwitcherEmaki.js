import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import { AppContext } from "@/context/AppContext";
import ekotobaStyles from "@/styles/OverlayEkotoba.module.css";
import { buildSceneShellStyle } from "@/utils/emakiContentWindow";
import { sceneSectionId } from "@/utils/emakiSceneDom";
import { forwardRef, useContext } from "react";

/** 絵巻シーンを cat に応じて image / ekotoba に振り分け。殻は常置・中身は mountContent。 */
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
      mountContent = true,
    },
    ref
  ) => {
    const { orientation, toggleFullscreen } = useContext(AppContext);

    if (cat !== "image" && cat !== "ekotoba") {
      return null;
    }

    const sectionClass =
      cat === "ekotoba" && !src ? ekotobaStyles.markerSection : undefined;

    if (!mountContent) {
      return (
        <section ref={ref} id={sceneSectionId(index)} className={sectionClass}>
          <div
            className="section"
            style={buildSceneShellStyle(item, {
              toggleFullscreen,
              orientation,
            })}
            aria-hidden
          />
        </section>
      );
    }

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

    return (
      <section
        ref={ref}
        id={sceneSectionId(index)}
        className={sectionClass}
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
);

SwitcherEmaki.displayName = "SwitcherEmaki";

export default SwitcherEmaki;
