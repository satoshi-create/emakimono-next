import { useEffect } from "react";

/** Stable DOM marker for card scroll wheel handling (not CSS-module hashed) */
const POLAROID_CARD_SELECTOR = "[data-polaroid-card]";

/**
 * モーダル表示中の背面スクロール遮断および写真枠外での wheel 漏洩を防止するフック
 */
export function usePolaroidScrollLock({ isOpen, frameRef }) {
  useEffect(() => {
    if (!isOpen) return;

    // 背景ページの縦スクロールを物理的にロック
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleDocumentWheel = (e) => {
      const isInsidePhoto = frameRef?.current && frameRef.current.contains(e.target);
      // photoFrame 内のホイール操作（ズーム用）以外は、モーダル内外問わずスクロール漏れを抑止
      if (!isInsidePhoto) {
        // カード内テキスト等の縦スクロールを妨げないため、data-polaroid-card 内のスクロール可能要素以外は preventDefault
        const isScrollableCard = e.target.closest?.(POLAROID_CARD_SELECTOR);
        if (!isScrollableCard || e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("wheel", handleDocumentWheel, {
      capture: true,
      passive: false,
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("wheel", handleDocumentWheel, {
        capture: true,
      });
    };
  }, [isOpen, frameRef]);
}
