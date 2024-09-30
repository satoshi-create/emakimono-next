import React,{useState,useEffect} from "react";
import ExtractingListData from "../libs/ExtractingListData";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/CardC.module.css";

const CardC = ({ data }) => {
  const removeNestedArrayObj = ExtractingListData();
  const { keyword, id,typeen } = data;

const filterdSeiyoukaiga = removeNestedArrayObj.filter(item => item.typeen === "seiyoukaiga")
console.log(filterdSeiyoukaiga);


  // 絵巻データからkeyword.nameオブジェクトの値を配列に取り出し

  const keywordNameArr = keyword?.map((item) => item.name);

  // keyword.nameの配列を文字列に変換
  const keyWordNameString = keywordNameArr?.toString();

  const relationalEmaki = removeNestedArrayObj.filter((item) => {
    if (item.keyword) {
      //絵巻一覧データの中の少なくとも 1 つの要素が合格すれば値を返す（some）
      const filterdKeyword = item.keyword.some((item) => {
        // keyWordNameStringに部分一致する絵巻一覧データの文字列があるかを判定（includes）
        return keyWordNameString?.includes(item.name.toString());
      });
      return filterdKeyword;
    }
    return;
  });
  // relationalEmakiから絵巻データと同一idを除去
  const removeEqualityId = relationalEmaki.filter((item) => item.id !== id);

  const [removeEqualityIdRandom, setremoveEqualityIdRandom] = useState(removeEqualityId)

    useEffect(() => {
      const shuffleArray = (array) => {
        return array.slice().sort(() => Math.random() - Math.random());
      };
      setremoveEqualityIdRandom(shuffleArray(removeEqualityId));
    }, []);

  const switchData =
    typeen === "seiyoukaiga" ? filterdSeiyoukaiga : removeEqualityIdRandom;

const randomRelationalEmakis = switchData.map((item, i) => {
  const { titleen, title, thumb, edition, author } = item;
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
          />
        </a>
      </Link>
      <Link href={`/${titleen}`}>
        <a>
          <div className={styles.metadata}>
            <h3 className={styles.title}>
              {title}
              <div>{edition}</div>
            </h3>
            <p className={styles.author}>{author}</p>
          </div>
        </a>
      </Link>
    </div>
  );
});

  return (
    <aside className={`${styles.container} scrollbar`}>
      {randomRelationalEmakis}
    </aside>
  );
};

export default CardC;
