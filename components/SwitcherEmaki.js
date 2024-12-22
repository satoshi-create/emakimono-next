import React, { forwardRef } from "react";
import OverlayEkotoba from "./OverlayEkotoba";
import EmakiImage from "./EmakiImage";
import KotenText from "./KotenText";

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
          <section ref={ref}>
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
          <section ref={ref}>
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
              }}
            />
          </section>
        );
      }
    }
    if (data.type === "古典文学") {
      return (
        <section ref={ref}>
          <KotenText
            key={index}
            item={{
              ...item,
              index,
              backgroundImage,
              kotobagaki,
              type,
              scroll,
              selectedRef,
              navIndex,
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
