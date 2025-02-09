import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/ExpandableText.module.css";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

// const useSmoothScroll = () => {
//   const router = useRouter();

//   useEffect(() => {
//     const handleScroll = () => {
//       requestAnimationFrame(() => {
//         let hash = window.location.hash;
//         console.log("Current hash:", hash);

//         if (hash) {
//           const id = hash.substring(1);
//           const element = document.getElementById(id);

//           console.log("Found element:", element);
//           if (element) {
//             element.scrollIntoView({ behavior: "smooth", block: "start" });
//           }
//         }
//       });
//     };

//     router.events.on("routeChangeComplete", handleScroll);
//     window.addEventListener("hashchange", handleScroll);

//     return () => {
//       router.events.off("routeChangeComplete", handleScroll);
//       window.removeEventListener("hashchange", handleScroll);
//     };
//   }, [router.asPath]); // 修正
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
