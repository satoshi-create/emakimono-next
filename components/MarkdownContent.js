import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "../styles/MarkdownStyles.module.css";

// JSON データ
const jsonData = {
  desc: `# 地獄草紙（安住院本） - 恐怖と美が織りなす地獄絵巻

平安末期から鎌倉時代に描かれた **「地獄草紙（安住院本）」** は、日本仏教の戒めの教えを象徴する貴重な絵巻物です。
この作品は、地獄の様子を詳細に描写し、人々に恐怖を通じて仏教的な教えを伝える目的で制作されました。

特に、「叫喚地獄」の16の小地獄から以下の4つが描かれています：

## 叫喚地獄の四つの小地獄
- **髪火流地獄**：罪人の髪が炎に包まれる恐怖の情景。
- **火末虫地獄**：体内を火のついた虫が這い回る苛烈な描写。
- **雲火霧地獄**：炎の雲と霧が地獄全体を包み込む壮大な風景。
- **雨炎火石地獄**：燃える石が雨のように降り注ぎ、罪人を苦しめる地獄。

## 安住院本の特徴
安住院本の特徴は、炎や地獄の描写が細部まで美しく表現されており、仏像の火焔光背を思わせるような神秘的なデザインが見られる点です。

特に、**鮮やかな色彩と細やかな筆使い** で、地獄の世界を生き生きと描写しています。

この絵巻は元々、岡山県の **安住院** に伝わっていたため **「安住院本」** と呼ばれ、現在は **東京国立博物館** に所蔵されています。`,
};

const MarkdownContent = () => {
  return (
    <div className={styles.markdownContent}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{jsonData.desc}</ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
