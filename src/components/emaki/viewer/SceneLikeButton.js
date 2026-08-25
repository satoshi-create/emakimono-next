import * as gtag from "@/libs/api/gtag";
import { postSceneLike } from "@/libs/api/ugcApi";
import styles from "@/styles/SceneLikeButton.module.css";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

/**
 * シーン別いいね（アイコンのみ）
 * variant: "overlay"（縦書き段タイトル） | "bar"（解説バー）
 */
const SceneLikeButton = ({
  titleen,
  title,
  chapter,
  index,
  variant = "overlay",
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useTranslation("common");

  const storageKey = `scene_like_${titleen}_${index}`;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved === "true") {
        setIsLiked(true);
      }
    }
  }, [storageKey]);

  const handleClick = (e) => {
    e.stopPropagation();
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    if (newLikedState) {
      setIsAnimating(true);
    }

    if (typeof window !== "undefined") {
      if (newLikedState) {
        localStorage.setItem(storageKey, "true");
      } else {
        localStorage.removeItem(storageKey);
      }
    }

    postSceneLike({
      emakiId: titleen,
      sceneIndex: index,
      action: newLikedState ? "like" : "unlike",
    });

    gtag.event("scene_like", {
      action: newLikedState ? "like" : "unlike",
      emaki_title: title,
      emaki_id: titleen,
      scene_index: index,
      scene_chapter: chapter,
    });
  };

  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };

  const isBar = variant === "bar";
  const label = isLiked ? t("viewer.unlikeScene") : t("viewer.likeScene");

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${isBar ? styles.barButton : styles.overlayButton} ${
        isLiked ? (isBar ? styles.barLiked : styles.overlayLiked) : ""
      }`}
      title={label}
      aria-label={label}
    >
      <FontAwesomeIcon
        icon={faThumbsUp}
        className={`${styles.icon} ${isAnimating ? styles.animating : ""}`}
        onAnimationEnd={handleAnimationEnd}
      />
    </button>
  );
};

export default SceneLikeButton;
