import * as gtag from "@/libs/api/gtag";
import { postSceneLike } from "@/libs/api/ugcApi";
import styles from "@/styles/SceneLikeButton.module.css";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";

/**
 * シーン別いいね（お気に入り）ボタン
 * ローカルストレージで状態を永続化
 * variant: "overlay"（詞書帯） | "bar"（ボトムコメントバー）
 */
const SceneLikeButton = ({ titleen, title, chapter, index, variant = "overlay" }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { t } = useTranslation("common");

  // ローカルストレージのキー
  const storageKey = `scene_like_${titleen}_${index}`;

  // 初期化時にローカルストレージから状態を復元
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved === "true") {
        setIsLiked(true);
      }
    }
  }, [storageKey]);

  const handleClick = () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    // アニメーション開始
    if (newLikedState) {
      setIsAnimating(true);
    }

    // ローカルストレージに保存
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

  return (
    <button
      onClick={handleClick}
      className={`${isBar ? styles.barButton : styles.button} ${
        isLiked ? (isBar ? styles.barLiked : styles.liked) : ""
      }`}
      title={isLiked ? t("viewer.unlike") : t("viewer.like")}
      aria-label={isLiked ? t("viewer.unlike") : t("viewer.like")}
    >
      <FontAwesomeIcon
        icon={faThumbsUp}
        className={`${styles.icon} ${isAnimating ? styles.animating : ""}`}
        style={{ fontSize: isBar ? "1rem" : undefined }}
        onAnimationEnd={handleAnimationEnd}
      />
    </button>
  );
};

export default SceneLikeButton;
