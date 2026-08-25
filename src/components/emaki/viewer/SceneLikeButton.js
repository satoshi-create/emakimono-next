import * as gtag from "@/libs/api/gtag";
import { useSceneLikeCounts } from "@/context/SceneLikeCountsContext";
import styles from "@/styles/SceneLikeButton.module.css";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { FaThumbsUp } from "react-icons/fa";
import { FiThumbsUp } from "react-icons/fi";

/**
 * シーン別いいね（アイコンのみ）
 * variant: "overlay"（縦書き段タイトル） | "bar"（解説バー）
 * 未押下: 縁のみ（outline）／押下後: 塗りつぶし
 * 押下状態・件数は Context 共有（縦書きとバーで同期）
 */
const SceneLikeButton = ({
  titleen,
  title,
  chapter,
  index,
  variant = "overlay",
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useTranslation("common");
  const { getCount, isLiked, hydrateLiked, toggleLike } = useSceneLikeCounts();

  const liked = isLiked(index);
  const count = getCount(index);

  useEffect(() => {
    hydrateLiked(index);
  }, [hydrateLiked, index]);

  const handleClick = async (e) => {
    e.stopPropagation();

    const result = await toggleLike(index);
    if (!result) return;

    if (result.liked) {
      setIsAnimating(true);
    }

    if (result.ok) {
      gtag.event("scene_like", {
        action: result.liked ? "like" : "unlike",
        emaki_title: title,
        emaki_id: titleen,
        scene_index: index,
        scene_chapter: chapter,
      });
    }
  };

  const handleAnimationEnd = () => {
    setIsAnimating(false);
  };

  const isBar = variant === "bar";
  const label = liked ? t("viewer.unlikeScene") : t("viewer.likeScene");
  const ariaLabel = count > 0 ? `${label} (${count})` : label;
  // Fi = strokeのみ（FA regular は袖が塗りつぶしのため使わない）
  const ThumbIcon = liked ? FaThumbsUp : FiThumbsUp;

  return (
    <span
      className={`${
        isBar ? styles.barLikeGroup : styles.overlayLikeGroup
      } ${
        count > 0 ? (isBar ? styles.barFramed : styles.overlayFramed) : ""
      } ${
        count > 0 && liked
          ? isBar
            ? styles.barLikedGroup
            : styles.overlayLikedGroup
          : ""
      }`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={handleClick}
        className={`${isBar ? styles.barButton : styles.overlayButton} ${
          liked ? (isBar ? styles.barLiked : styles.overlayLiked) : ""
        }`}
        title={ariaLabel}
        aria-label={ariaLabel}
      >
        <ThumbIcon
          className={`${styles.icon} ${isAnimating ? styles.animating : ""}`}
          aria-hidden
          onAnimationEnd={handleAnimationEnd}
        />
      </button>
      {count > 0 && (
        <span className={isBar ? styles.barCount : styles.overlayCount}>
          {count.toLocaleString()}
        </span>
      )}
    </span>
  );
};

export default SceneLikeButton;
