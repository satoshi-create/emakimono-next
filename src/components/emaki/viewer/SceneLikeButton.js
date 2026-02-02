import * as gtag from "@/libs/api/gtag";
import styles from "@/styles/SceneLikeButton.module.css";
import { useEffect, useState } from "react";
import { ThumbsUp } from "react-feather";

/**
 * シーン別いいね（お気に入り）ボタン
 * ローカルストレージで状態を永続化
 */
const SceneLikeButton = ({ titleen, title, chapter, index }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

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

    // GA4イベント送信
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

  return (
    <button
      onClick={handleClick}
      className={`${styles.button} ${isLiked ? styles.liked : ""}`}
      title={isLiked ? "いいねを解除" : "いいね"}
      aria-label={isLiked ? "いいねを解除" : "いいね"}
    >
      <ThumbsUp
        className={`${styles.icon} ${isAnimating ? styles.animating : ""}`}
        onAnimationEnd={handleAnimationEnd}
        fill={isLiked ? "currentColor" : "none"}
      />
    </button>
  );
};

export default SceneLikeButton;
