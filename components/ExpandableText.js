import { useState } from "react";
import styles from "../styles/ExpandableText.module.css";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

const ExpandableText = ({ text, maxLength = 100 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const toggleExpand = () => setIsExpanded(!isExpanded);

  // ショートテキスト（最後に「...続きを見る」を付与）
  const shortText =
    text.length > maxLength
      ? text.slice(0, maxLength) + ` <span class="${styles.readMore}">...続きを見る</span>`
      : text;

  // 表示テキスト
  const displayedText = isExpanded ? text : shortText;


  return (
    <div className={styles.container} onClick={toggleExpand}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          span: ({ node, ...props }) => <span {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

export default ExpandableText;
