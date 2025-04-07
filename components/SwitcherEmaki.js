import React, { forwardRef } from "react";
import EmakiImage from "./EmakiImage";
import OverlayEkotoba from "./OverlayEkotoba";

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
      isBlurVisible,
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
              isBlurVisible={isBlurVisible}
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
              isBlurVisible={isBlurVisible}
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
