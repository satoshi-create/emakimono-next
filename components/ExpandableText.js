import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "../styles/ExpandableText.module.css";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";


const ExpandableText = ({ text, maxLength = 100 }) => {
    const { locale } = useRouter();
  // useSmoothScroll();
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  const Collapse = locale === "ja" ? "...閉じる" : "...Collapse";

  const readmore = locale == "ja" ? "...続きを見る" : "...Read more";

    // {
    //   locale === "ja" ? "絵巻の紹介" : "Introduction";
    // }

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
          {isExpanded ? Collapse : readmore}
        </span>
      )}
    </div>
  );
};

export default ExpandableText;
