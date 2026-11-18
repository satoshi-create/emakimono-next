import styles from "@/styles/QuizModal.module.css";
import { AppContext } from "@/context/AppContext";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "next-i18next";

// =============================================================================
// デバッグスイッチ（検証完了後は false にして一括停止）
// =============================================================================
const DEBUG_QUIZ_FAB = false;

function logDebug(tag, ...args) {
  if (!DEBUG_QUIZ_FAB) return;
  const time = performance.now().toFixed(1);
  console.log(`%c[${time}ms][${tag}]`, "color: #3b82f6; font-weight: bold;", ...args);
}

/**
 * 観察力クイズ入口 / 再開。
 * @param {"float"|"bar"} [variant] float=PC・SP横 / bar=SP縦コメンタリーバー内
 * @param {"start"|"resume"} [mode]
 */
const QuizFab = ({
  onOpen,
  isUIVisible = true,
  mode = "start",
  variant = "float",
}) => {
  const { t } = useTranslation("common");
  const { orientation, toggleFullscreen } = useContext(AppContext);
  const [mounted, setMounted] = useState(false);
  const fabWrapRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof document === "undefined") return;
    const portalTarget =
      variant === "float"
        ? document.querySelector(".entry-container") || document.body
        : null;
    const timerId = setTimeout(() => {
      requestAnimationFrame(() => {
        const el = fabWrapRef.current;
        const entry = document.querySelector(".entry-container");
        let rect;
        let cs;
        if (el) {
          const r = el.getBoundingClientRect();
          rect = {
            top: r.top,
            bottom: r.bottom,
            left: r.left,
            right: r.right,
            width: r.width,
            height: r.height,
          };
          const s = getComputedStyle(el);
          cs = {
            position: s.position,
            bottom: s.bottom,
            left: s.left,
            opacity: s.opacity,
            display: s.display,
            zIndex: s.zIndex,
            commentaryBarFullH: s.getPropertyValue("--commentary-bar-full-h"),
          };
        }
        let entryRect;
        if (entry) {
          const er = entry.getBoundingClientRect();
          entryRect = {
            top: er.top,
            bottom: er.bottom,
            left: er.left,
            right: er.right,
            height: er.height,
          };
        }
        logDebug("QUIZ_FAB_DOM", {
          variant,
          mode,
          isUIVisible,
          mounted,
          portalTarget: portalTarget
            ? {
                tagName: portalTarget.tagName,
                className: portalTarget.className,
                dataset: { ...portalTarget.dataset },
              }
            : null,
          parentClassName: el?.parentElement?.className ?? null,
          fabRect: rect ?? null,
          computedStyle: cs ?? null,
          entryContainerRect: entryRect ?? null,
          innerHeight: window.innerHeight,
        });
      });
    }, 100);
    return () => clearTimeout(timerId);
  }, [variant, mode, isUIVisible, mounted, orientation, toggleFullscreen]);

  const label =
    mode === "resume" ? t("quiz.resumeLabel") : t("quiz.fabLabel");

  // float（PC / SP横）はナビ idle に連動。bar（SP縦）は非連動
  const hideWithIdle = false;

  const fabElement = (
    <div
      ref={fabWrapRef}
      className={`${styles.fabWrap} ${hideWithIdle ? styles.fabHidden : ""}`}
      style={
        variant === "float"
          ? { position: "absolute", left: "16px", bottom: "16px", zIndex: 70 }
          : undefined
      }
      data-variant={variant}
      data-orientation={orientation || "landscape"}
      data-fullscreen={toggleFullscreen ? "true" : "false"}
    >
      <button
        type="button"
        className={styles.fab}
        onClick={onOpen}
        aria-label={label}
        title={label}
      >
        <FontAwesomeIcon
          icon={faLightbulb}
          className={styles.fabIcon}
          aria-hidden
        />
        <span className={styles.fabLabel}>{label}</span>
      </button>
    </div>
  );

  if (
    variant === "float" &&
    mounted &&
    typeof document !== "undefined"
  ) {
    return createPortal(
      fabElement,
      document.querySelector(".entry-container") || document.body
    );
  }

  return fabElement;
};

export default QuizFab;
