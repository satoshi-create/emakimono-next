import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import overlayStyles from "@/styles/OverlayEkotoba.module.css";
import { forwardRef } from "react";

const SwitcherEmaki = forwardRef(
  (
    {
      cat,
      data,
      item,
      index,
      src,
      overlayTitle,
      backgroundImage,
      kotobagaki,
      type,
      selectedRef,
      navIndex,
      scroll,
      uniqueIndex,
      isPlayMode, // 再生モード状態
    },
    ref
  ) => {
    // 段タイトル（新スキーマ scene_title）: src で独立ブロック vs オーバーレイを切り替え
    if (cat === "scene_title") {
      const hasImageUrl = src && src !== "show_original";
      if (hasImageUrl) {
        return (
          <section ref={ref} id={index}>
            <OverlayEkotoba
              key={index}
              item={{
                ...item,
                cat,
                index,
                backgroundImage,
                kotobagaki,
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
      // 画像なし: スクロールID維持用のマーカーのみ（見た目は空白）
      return (
        <section ref={ref} id={index} className={overlayStyles.sceneMarker} />
      );
    }

    // 古典文学の場合は image / ekotoba を出し分けしない（別UIで表示する想定）
    // 新スキーマで type が未定義の場合は表示する
    if (data.type === "古典文学") {
      return null;
    }

    if (cat === "image") {
      return (
        <section ref={ref} id={index}>
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
            overlayTitle={overlayTitle}
            isPlayMode={isPlayMode}
            emakiId={data?.id}
          />
        </section>
      );
    }
    if (cat === "ekotoba") {
      return (
        <section ref={ref} id={index}>
          <OverlayEkotoba
            key={index}
            item={{
              ...item,
              cat,
              index,
              backgroundImage,
              kotobagaki,
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
    return null;
  }
);

SwitcherEmaki.displayName = "SwitcherEmaki";

export default SwitcherEmaki;
