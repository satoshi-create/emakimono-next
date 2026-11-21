import { EbikiPickerOverlay } from "@/components/dev/EbikiCoordinatePicker";
import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import { SceneChapterOverlay } from "@/components/emaki/viewer/SceneChapterOverlay";
import SpotPins from "@/components/emaki/viewer/SpotPins";
import { useSwitcherEmakiState } from "@/components/emaki/viewer/useSwitcherEmakiState";
import { AppContext } from "@/context/AppContext";
import { sceneSectionId } from "@/utils/emakiSceneDom";
import { useRouter } from "next/router";
import { forwardRef, useContext } from "react";

/** 絵巻シーンを cat に応じて image / ekotoba に振り分け。幅は section 常置・中身は mountContent。 */
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
      floatLandscape = false,
      ebikiPickerEnabled = false,
      onEbikiPick,
      onSelectSpot,
      selectedSpotId,
    },
    ref
  ) => {
    const { orientation, toggleFullscreen, chapterToggle, handleToId } =
      useContext(AppContext);
    const { locale } = useRouter();

    const {
      isSupportedCat,
      isImage,
      isByobu,
      isEditSpotsMode,
      chapterTitle,
      showChapterTitle,
      spots,
      sectionStyle,
      sectionWithChapterStyle,
      setActiveSliceIdx,
    } = useSwitcherEmakiState({
      cat,
      data,
      item,
      index,
      locale,
      orientation,
      toggleFullscreen,
      chapterToggle,
      floatLandscape,
      ebikiPickerEnabled,
    });

    if (!isSupportedCat) {
      return null;
    }

    const sectionClass = undefined;

    if (!mountContent) {
      return (
        <section
          ref={ref}
          id={sceneSectionId(index)}
          className={sectionClass}
          style={sectionStyle}
        >
          <div
            className="section"
            style={{ width: "100%", height: "100%" }}
            aria-hidden
          />
        </section>
      );
    }

    return (
      <section
        ref={ref}
        id={sceneSectionId(index)}
        className={sectionClass}
        style={sectionWithChapterStyle}
        onPointerDownCapture={() => setActiveSliceIdx(index)}
      >
        {item?.src ? (
          <div style={{ position: "relative", zIndex: 1 }}>
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
              isByobu={isByobu}
            />
          </div>
        ) : null}

        {showChapterTitle ? (
          <SceneChapterOverlay
            chapterTitle={chapterTitle}
            index={index}
            locale={locale}
            onSelectChapter={handleToId}
            orientation={orientation}
            title={data?.title}
            titleen={data?.titleen}
          />
        ) : null}

        {isImage && (spots?.length || isEditSpotsMode) ? (
          <SpotPins
            spots={spots ?? []}
            sliceIndex={index}
            linkId={item.linkId}
            data={data}
            ebikiPickerEnabled={ebikiPickerEnabled}
            onSelectSpot={onSelectSpot}
            selectedSpotId={selectedSpotId}
          />
        ) : null}

        {isImage && ebikiPickerEnabled ? (
          <EbikiPickerOverlay
            linkId={item.linkId ?? index}
            onPick={onEbikiPick}
          />
        ) : null}
      </section>
    );
  }
);

SwitcherEmaki.displayName = "SwitcherEmaki";

export default SwitcherEmaki;