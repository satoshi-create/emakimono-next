import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/ExpandableText.module.css";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

// const useSmoothScroll = () => {
//   const router = useRouter();

//   useEffect(() => {
//     const hash = window.location.hash;
//     if (hash) {
//       const element = document.querySelector(hash);
//       if (element) {
//         setTimeout(() => {
//           <element className="scrol"></element>lIntoView({ behavior: "smooth", block: "start" });
//         }, 100);
//       }
//     }
//   }, [router.asPath]);
// };

const ExpandableText = ({ text, maxLength = 100 }) => {
  // useSmoothScroll();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // ショートテキスト（最後に「...続きを見る」を追加）
  const shortText = text.length > maxLength ? text.slice(0, maxLength) : text;
  // // 表示テキスト
  const displayedText = isExpanded ? text : shortText;

  return (
    <div className={styles.container}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          span: ({ node, ...props }) => <span {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
      {text.length > maxLength && (
        <span className={styles.readMore} onClick={toggleExpand}>
          {isExpanded ? "...閉じる" : "...続きを見る"}
        </span>
      )}
    </div>
  );
};

export default ExpandableText;
