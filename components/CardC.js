import React from "react";
import ExtractingListData from "./ExtractingListData";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/CardC.module.css";

const CardC = ({ data }) => {
  const removeNestedArrayObj = ExtractingListData();
  const { keyword, id } = data;

  // 絵巻データからkeyword.nameオブジェクトの値を配列に取り出し

  const keywordNameArr = keyword?.map((item) => item.name);

  // keyword.nameの配列を文字列に変換
  const keyWordNameString = keywordNameArr.toString();

  const relationalEmaki = removeNestedArrayObj.filter((item) => {
    if (item.keyword) {
      //絵巻一覧データの中の少なくとも 1 つの要素が合格すれば値を返す（some）
      const filterdKeyword = item.keyword.some((item) => {
        // keyWordNameStringに部分一致する絵巻一覧データの文字列があるかを判定（includes）
        return keyWordNameString.includes(item.name.toString());
      });
      return filterdKeyword;
    }
    return;
  });
  // relationalEmakiから絵巻データと同一idを除去
  const removeEqualityId = relationalEmaki.filter((item) => item.id !== id);

  return (
    <aside className={styles.container}>
      {removeEqualityId.map((item, i) => {
        const {
          titleen,
          title,
          thumb,
          edition,
          author,
          era,
          eraen,
          desc,
          typeen,
          type,
          subtype,
          keyword,
        } = item;
        return (
          <div key={i} className={styles.box}>
            <Link href={`/${titleen}`}>
              <a>
                <Image
                  src={thumb}
                  width={233}
                  height={130}
                  alt={title}
                  className={styles.image}
                  // sizes="(max-width: 768px) 100vw, 50vw"
                  // loading="lazy"
                  // placeholder="blur"
                  // blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkmF/vAwADMQFs4YXxygAAAABJRU5ErkJggg=="
                />
              </a>
            </Link>
            <Link href={`/${titleen}`}>
              <a>
                <div className={styles.metadata}>
                  <h3 className={styles.title}>{title}</h3>
                  <p className={styles.author}>{author}</p>
                </div>
              </a>
            </Link>
          </div>
        );
      })}
    </aside>
  );
};

export default CardC;
