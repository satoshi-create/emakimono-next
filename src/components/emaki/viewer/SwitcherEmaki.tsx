import EmakiImage from "@/components/emaki/viewer/EmakiImage";
import OverlayEkotoba from "@/components/emaki/viewer/OverlayEkotoba";
import React, { forwardRef, RefObject } from "react";
import type { EmakiImageMetadata } from '@/types/metadata'; // Main metadata type
import type { EmakiSegment } from '@/types/segment'; // Segment type

// Define Props interface
interface SwitcherEmakiProps {
  cat: "ekotoba" | "image"; // The category determining which component to render
  data: EmakiImageMetadata; // The full metadata for the emaki
  item: EmakiSegment; // The specific segment data for this instance
  index: number; // The index of this segment in the original emakis array
  src?: string; // Image source (potentially redundant with item.src, but passed)
  backgroundImage?: string; // Background image for ekotoba
  kotobagaki: boolean; // Flag indicating if kotobagaki exists
  type: string; // Type of the artwork (e.g., 絵巻)
  selectedRef?: RefObject<any>; // Ref for selection (optional, type loosely)
  navIndex?: number; // Index for navigation (optional)
  isBlurVisible: boolean; // State for lazy image blur effect
  scroll: boolean; // Indicates if the container is scrollable
  uniqueIndex: number | null; // Specific index for image or ekotoba segments
}

// Wrap the component with forwardRef to handle the ref correctly
// The ref points to the outer <section> element, so use HTMLElement
const SwitcherEmaki = forwardRef<HTMLElement, SwitcherEmakiProps>(
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
          <section ref={ref} id={index.toString()}>
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
          <section ref={ref} id={index.toString()}>
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
