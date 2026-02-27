import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import { forwardRef } from "react";
import { useRouter } from "next/router";

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
      type,
      selectedRef,
      navIndex,
      scroll,
      uniqueIndex,
      isPlayMode, // 再生モード状態
    },
    ref
  ) => {
    const { locale } = useRouter();

    // 段タイトル（新スキーマ scene_title）: type に依存せず表示
    if (cat === "scene_title") {
      const titleText =
        locale === "en" ? (item.title_en ?? item.title) : (item.title ?? item.title_en);
      if (!titleText) return null;
      return (
        <section ref={ref} id={index} className="scene-title-block">
          <h2 className="scene-title-heading">{titleText}</h2>
        </section>
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
