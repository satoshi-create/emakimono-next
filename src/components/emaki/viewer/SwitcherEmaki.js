import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import { forwardRef } from "react";

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
    },
    ref
  ) => {
    if (data.type !== "古典文学") {
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
    }
    return null;
  }
);

SwitcherEmaki.displayName = "SwitcherEmaki";

export default SwitcherEmaki;
