import * as gtag from "@/libs/api/gtag";
import styles from "@/styles/SnsShareBox.module.css";
import {
  faFacebook,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

const SnsShareBox = ({ titleen, title, edition, ort, chapter, index }) => {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${titleen}`;

  const urlpart = `${process.env.NEXT_PUBLIC_SITE_URL}/${titleen}%23${index}`;
  const twitter = () => {
    if (ort === "modal") {
      return `https://twitter.com/share?url=${urlpart}&text=${title} ${chapter}`;
    } else {
      return `https://twitter.com/share?url=${url}&text=${title} ${
        edition ? edition : ""
      }`;
    }
  };

  // GA4イベント送信
  const handleShareClick = (platform) => {
    const isSceneShare = ort === "modal";
    gtag.event("sns_share_click", {
      platform: platform,
      emaki_title: title,
      emaki_id: titleen,
      share_type: isSceneShare ? "scene" : "emaki",
      scene_index: isSceneShare ? index : null,
      scene_chapter: isSceneShare ? chapter : null,
    });
  };

  return (
    <div className={`${styles.snsShareBox} ${styles[ort]}`}>
      <Link href={twitter(ort)}>
        <a
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShareClick("twitter")}
        >
          <FontAwesomeIcon
            icon={faTwitter}
            className={`${styles.snsShareIcon} ${styles.twitter} ${styles[ort]}`}
          />
        </a>
      </Link>
      <Link href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}>
        <a
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShareClick("facebook")}
        >
          <FontAwesomeIcon
            icon={faFacebook}
            className={`${styles.snsShareIcon} ${styles.facebook}  ${styles[ort]}`}
          />
        </a>
      </Link>
      <Link href={`https://www.linkedin.com/sharing/share-offsite/?url=${url}`}>
        <a
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => handleShareClick("linkedin")}
        >
          <FontAwesomeIcon
            icon={faLinkedin}
            className={`${styles.snsShareIcon} ${styles.linkedin}  ${styles[ort]}`}
          />
        </a>
      </Link>
    </div>
  );
};

export default SnsShareBox;
