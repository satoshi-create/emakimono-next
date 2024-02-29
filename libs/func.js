import { useRouter } from "next/router";
import { ja, en } from "./staticData";
import { jaMeta, enMeta } from "./dataSiteMeta";
import enData from "./en/data";
import jaData from "./data";

const useLocale = () => {
  const { locale } = useRouter();
  const t = locale === "en" ? en : ja;
  return { locale, t };
};
const useLocaleMeta = () => {
  const { locale } = useRouter();
  const t = locale === "en" ? enMeta : jaMeta;
  return { locale, t };
};
const useLocaleData = () => {
  const { locale } = useRouter();
  const t = locale === "en" ? enData : jaData;
  return { locale, t };
};

const eraColor = (x) => {
  switch (x) {
    case "平安":
      return "orange";
      break;
    case "鎌倉":
      return "green";
      break;
    case "室町":
      return "purple";
      break;
    case "安土・桃山":
      return "gold";
      break;
    case "江戸":
      return "skyblue";
      break;
    case "明治":
      return "firebrick";
      break;
    default:
      break;
  }
};

const convert = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.name}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};

const keywordItem = (arr) =>
  convert(arr.flatMap((item) => item.keyword).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1)
  );

const personnameItem = (arr) =>
  convert(arr.flatMap((item) => item.personname).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1)
  );

// ネストしているObjectを削除して新しいObjectを作成する;
// https://hi97.hamazo.tv/e8537787.html
const removeNestedObj = (obj) =>
  Object.entries(obj).reduce(
    (acc, [key, val]) => {
      // value の型が object であった時は Object に新しい値を加えずに返す
      if ("object" === typeof val) {
        return acc;
      }
      acc[key] = val;
      return acc;
    },
    // 初期値：空のオブジェクト
    {}
  );
  
//  ネストしている「絵巻オブジェクト」を削除して新しいObjectを作成する;
const removeNestedEmakisObj = (obj) =>
  Object.entries(obj).reduce(
    (acc, [key, val]) => {
      //keyの名前がemakisであった時は Object に新しい値を加えずに返す
      if (key === "emakis") {
        return acc;
      }
      acc[key] = val;
      return acc;
    },
    // 初期値：空のオブジェクト
    {}
  );

export {
  eraColor,
  keywordItem,
  personnameItem,
  useLocale,
  useLocaleMeta,
  useLocaleData,
  removeNestedObj,
  removeNestedEmakisObj,
};
