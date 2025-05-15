import styles from "@/styles/SnsShareBox.module.css";
import {
  faFacebook,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";

// Define the orientation types for better type safety
type ShareOrientation = "modal" | "land" | "prt";

// Define Props Interface
interface SnsShareBoxProps {
  titleen: string;
  title: string;
  edition?: string; // Optional, as it's not always present
  ort: ShareOrientation; // Use the defined literal union type
  chapter?: string; // Optional, used for 'modal' orientation
  index?: number;   // Optional, used for 'modal' orientation
}

const SnsShareBox = ({ titleen, title, edition, ort, chapter, index }: SnsShareBoxProps) => {
  // Handle potential undefined for NEXT_PUBLIC_SITE_URL
  const siteUrlBase = process.env.NEXT_PUBLIC_SITE_URL || "https://emakimono.com";
  const pageUrl = `${siteUrlBase}/${titleen}`;

  // const urlpart = `${process.env.NEXT_PUBLIC_SITE_URL}/${titleen}%23${index}`;
  const twitterShareUrl = () => {
    let textToShare = `${title}${edition ? ` ${edition}` : ""}`;
    let urlToShare = pageUrl;

    if (ort === "modal" && chapter && typeof index === 'number') {
      textToShare = `${title} - ${chapter}`; // Customize text for modal share
      // Construct URL with actual '#' for the fragment identifier
      urlToShare = `${pageUrl}#s${index}`; // Or simply `#${index}` if 's' is not a prefix
    }

    // Twitter's 'url' parameter should be the full URL you want to share.
    // Twitter's 'text' parameter is the pre-filled tweet text.
    // Both should be URI encoded.
    return `https://twitter.com/share?url=${encodeURIComponent(urlToShare)}&text=${encodeURIComponent(textToShare)}`;
  };

  return (
    <div className={`${styles.snsShareBox} ${styles[ort]}`}>
      <Link href={twitterShareUrl()}>
        <a target="_blank" rel="noopener noreferrer" title="Share on Twitter">
          <FontAwesomeIcon
            icon={faTwitter}
            className={`${styles.snsShareIcon} ${styles.twitter} ${styles[ort]}`}
          />
        </a>
      </Link>
      <Link href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}>
        <a target="_blank" rel="noopener noreferrer" title="Share on Facebook">
          <FontAwesomeIcon
            icon={faFacebook}
            className={`${styles.snsShareIcon} ${styles.facebook}  ${styles[ort]}`}
          />
        </a>
      </Link>
      <Link href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}>
        <a target="_blank" rel="noopener noreferrer" title="Share on LinkedIn">
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
