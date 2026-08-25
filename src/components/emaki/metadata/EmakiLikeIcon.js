import { postEmakiLike } from "@/libs/api/ugcApi";
import * as gtag from "@/libs/api/gtag";
import styles from "@/styles/EmakiLikeIcon.module.css";
import { faThumbsUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { useTranslation } from "next-i18next";

/** 絵巻タイトル横の巻いいね（アイコンのみ） */
const EmakiLikeIcon = ({ title, titleen, edition }) => {
  const { t } = useTranslation("common");
  const [liked, setLiked] = useState(false);

  const handleClick = () => {
    if (liked) return;
    setLiked(true);
    postEmakiLike(titleen);
    gtag.event("like_emaki", {
      emaki_title: title,
      emaki_id: titleen,
      emaki_edition: edition,
    });
  };

  const label = liked ? t("viewer.liked") : t("viewer.likeEmaki");

  return (
    <button
      type="button"
      className={`${styles.btn} ${liked ? styles.liked : ""}`}
      onClick={handleClick}
      aria-label={label}
      title={label}
      disabled={liked}
    >
      <FontAwesomeIcon icon={faThumbsUp} />
    </button>
  );
};

export default EmakiLikeIcon;
