import SingleCardC from "@/components/SingleCardC";
import ExtractingListData from "@/libs/ExtractingListData";
import { useEffect, useState } from "react";

const CardC = ({ data, loading }) => {
  const removeNestedArrayObj = ExtractingListData();
  const { keyword, id, typeen } = data;

  const filterdSeiyoukaiga = removeNestedArrayObj.filter(
    (item) => item.typeen === "seiyoukaiga"
  );

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

  const [removeEqualityIdRandom, setremoveEqualityIdRandom] =
    useState(removeEqualityId);

  useEffect(() => {
    const shuffleArray = (array) => {
      return array.slice().sort(() => Math.random() - Math.random());
    };
    setremoveEqualityIdRandom(shuffleArray(removeEqualityId));
  }, []);

  const switchData =
    typeen === "seiyoukaiga" ? filterdSeiyoukaiga : removeEqualityIdRandom;

  const randomRelationalEmakis = switchData.slice(0, 8).map((item, i) => {
    return <SingleCardC key={i} item={item} />;
  });

  return <>{randomRelationalEmakis}</>;
};

export default CardC;
