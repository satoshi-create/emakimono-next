import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import SpotPins from "@/components/emaki/viewer/SpotPins";
import { AppContext } from "@/context/AppContext";
import ekotobaStyles from "@/styles/OverlayEkotoba.module.css";
import { buildSceneShellStyle } from "@/utils/emakiContentWindow";
import { isByobuScroll } from "@/utils/isByobuScroll";
import { sceneSectionId } from "@/utils/emakiSceneDom";
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
      // 解説カードのフローティング化（非全画面 md+横）: 画像高基準を実キャンバス高へ
      floatLandscape = false,
    },
    ref
  ) => {
    const { orientation, toggleFullscreen } = useContext(AppContext);

    if (cat !== "image" && cat !== "ekotoba") {
      return null;
    }

    const sectionClass =
      cat === "ekotoba" && !src ? ekotobaStyles.markerSection : undefined;
    // 殻↔中身差し替えで flex 幅が変わらないよう、幅は常に section に載せる
    const sectionStyle = buildSceneShellStyle(item, {
      toggleFullscreen,
      orientation,
      floatLandscape,
    });
    // 屏風のみ: 段タイトルバー（黒帯）を非表示化（マーカー要素・DOM 構造は不変）
    const isByobu = isByobuScroll(data);
    // 名所スポットピンの基準座標系を section に固定する（spots がある時だけ付与）
    const spots = cat === "image" ? item.spots : null;
    // buildSceneShellStyle は画像スライスに overflow:hidden を返すため、
    // スポットピンが扇の境界をはみ出せるよう spots 保持スライスだけ visible に上書きする。
    // 併せて独立スタッキングコンテキスト化（zIndex:1）し、後段 DOM の隣接スライス画像が
    // 上に描かれてもピンが潜り込まないようにする（.prt の sticky よりは下に留まる）。
    const imageSectionStyle = spots?.length
      ? {
          ...sectionStyle,
          position: "relative",
          overflow: "visible",
          zIndex: 1,
        }
      : sectionStyle;

    if (!mountContent) {
      return (
        <section
          ref={ref}
          id={sceneSectionId(index)}
          className={sectionClass}
          style={sectionStyle}
        >
          <div className="section" style={{ width: "100%", height: "100%" }} aria-hidden />
        </section>
      );
    }

    if (cat === "image") {
      return (
        <section
          ref={ref}
          id={sceneSectionId(index)}
          style={imageSectionStyle}
        >
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
          {spots?.length ? <SpotPins spots={spots} linkId={item.linkId} /> : null}
        </section>
      );
    }

    return (
      <section
        ref={ref}
        id={sceneSectionId(index)}
        className={sectionClass}
        style={sectionStyle}
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
          hideChapterTitle={isByobu}
        />
      </section>
    );
  }
);

SwitcherEmaki.displayName = "SwitcherEmaki";

export default SwitcherEmaki;
