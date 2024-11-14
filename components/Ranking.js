import React, { useEffect, useState } from "react";
import ExtractingListData from "../libs/ExtractingListData";
import SingleCardA from "./SingleCardA";
import dummydata from "../libs/dummydata.js"
import styles from "../styles/CardA.module.css";
import CardA from "./CardA.js";

const Ranking = ({num}) => {
  const removeNestedArrayObj = ExtractingListData();

  const [data, setData] = useState();
  console.log(data);

  const newData = data?.map((item, i) => {
    const { pathName } = item;
    const connectData = removeNestedArrayObj.filter(
      (item) => item.titleen === pathName
    );
    if (connectData.length) {
      return connectData;
    }
  });

  console.log(newData);

  // const array = [undefined, [{ id: 12, title: "hoge" }], undefined];

  function flattenAndRemoveNullAndUndefined(arr) {
    if (!Array.isArray(arr)) return []; // 配列でない場合は空の配列を返す
    return arr.flatMap((item) => {
      if (Array.isArray(item)) {
        return flattenAndRemoveNullAndUndefined(item); // 再帰的に処理
      }
      return item !== null && item !== undefined ? [item] : [];
    });
  }

  const result = flattenAndRemoveNullAndUndefined(newData);

  console.log(result); // [{ "id": 12, "title": "hoge" }]

  useEffect(() => {
    async function fetchData() {
      const res = await fetch(`/api/fetchData`);
      const data = await res.json();
      console.log(data);
      const slicedata = data.slice(0, 30);
      const encodeURL = slicedata.map((item, i) => {
        const pathName = item.pagePath.replace("/", "");
        return { pathName: pathName, pageView: item.uniquePageviews };
      });
      setData(encodeURL);
    }
    fetchData();
  }, []);

  return (
    <CardA
      emakis={result.slice(0,3)}
      columns={"three"}
      sectionname={"recommend"}
      sectiontitle={""}
      sectiontitleen={""}
    />
  );
};

export default Ranking;
