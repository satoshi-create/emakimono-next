import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import PlaybackSceneSpacer from "@/components/emaki/viewer/PlaybackSceneSpacer";
import usePlaybackSceneMount from "@/hooks/emaki/usePlaybackSceneMount";
import ekotobaStyles from "@/styles/OverlayEkotoba.module.css";
import { forwardRef, memo } from "react";

const SwitcherEmaki = forwardRef(
  (
    {
      cat,
      data,
      item,
      index,
      src,
      backgroundImage,
      kotobagaki,
      sceneText,
      type,
      selectedRef,
      navIndex,
      scroll,
      uniqueIndex,
      sceneIndex, // 先読み用
    },
    ref
  ) => {
    const readyToMount = usePlaybackSceneMount(uniqueIndex, item, cat);

    if (data.type !== "古典文学") {
      if (cat === "image") {
        return (
          <section ref={ref} id={index} className="emaki-scene-section">
            {readyToMount ? (
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
                sceneIndex={sceneIndex}
                emakiId={data?.titleen}
              />
            ) : (
              <PlaybackSceneSpacer
                srcWidth={item.srcWidth}
                srcHeight={item.srcHeight}
              />
            )}
          </section>
        );
      }
      if (cat === "ekotoba") {
        return (
          <section
            ref={ref}
            id={index}
            className={`emaki-scene-section ${!src ? ekotobaStyles.markerSection : ""}`}
          >
            <OverlayEkotoba
              key={index}
              item={{
                ...item,
                cat,
                index,
                backgroundImage,
                kotobagaki,
                sceneText,
                type,
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
    }
    return null;
  }
);

SwitcherEmaki.displayName = "SwitcherEmaki";

const areSwitcherPropsEqual = (prev, next) =>
  prev.cat === next.cat &&
  prev.index === next.index &&
  prev.navIndex === next.navIndex &&
  prev.sceneIndex === next.sceneIndex &&
  prev.uniqueIndex === next.uniqueIndex &&
  prev.item === next.item;

export default memo(SwitcherEmaki, areSwitcherPropsEqual);
