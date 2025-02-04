import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../styles/MarkdownStyles.module.css";
import { useRouter } from "next/router";
import ExpandableText from "./ExpandableText";

const MarkdownContent = ({
  desc,
  title,
  edition,
  author,
  typeen,
  descen,
  titleen,
  authoren,
}) => {
  const { locale } = useRouter();
  const descJa = desc ? desc : `「${title} ${edition ? edition : ""}」${
    author ? `（${author}）` : ""
  }の全シーンを、縦書き、横スクロールで楽しむことができます。`;

  const descEn =  descen ? descen : `You can enjoy all the scenes of the " ${titleen} ${
    authoren && `（${authoren}）`
  } " in vertical and right to left scrolling mode.`;

  const descText = locale === "en" ? descEn : descJa;


  return (
    <div className={styles.markdownContent}>
      <ExpandableText text={descText} maxLength={120} />
      {/* <ReactMarkdown remarkPlugins={[remarkGfm]}>
        <ExpandableText text={descText} maxLength={120} />
      </ReactMarkdown> */}

      {/* <ExpandableText text={descText} maxLength={120}>
        {(expandedText) => (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {expandedText}
          </ReactMarkdown>
        )}
      </ExpandableText> */}


    </div>
  );
};

export default MarkdownContent;
