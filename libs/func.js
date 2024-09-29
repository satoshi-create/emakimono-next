
import { useRouter } from "next/router";
import { ja, en } from "./staticData";
import { jaMeta, enMeta } from "./dataSiteMeta";
import enData from "./data";
import jaData from "./data";
import chaptergenji from "./genji/chapters-of-genji.json";
import chapterkusouzu from "./kusouzu/chapters-of-kusouzu.json";

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
      return "#ff8c77";
      break;
    case "鎌倉":
      return "#54896a";
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

/* ================

ダイナミックルーティングに使うパスを含んだ配列の作成

================ */

// キーワード
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

// 登場人物名
const personnameItem = (arr) =>
  convert(arr.flatMap((item) => item.personname).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1)
  );

// 源氏絵
const convertGenjiSlug = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.title}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};

const genjieSlugItem = (arr) =>
  convertGenjiSlug(
    arr.flatMap((item) => item.genjieslug).filter((item) => item)
  ).sort((a, b) => (b.id > a.id ? -1 : 1));

// 九相図
const convertKusouzuSlug = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.id}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};
const kusouzuSlugItem = (arr) =>
  convertKusouzuSlug(
    arr.flatMap((item) => item.kusouzuslug).filter((item) => item)
  ).sort((a, b) => (b.id > a.id ? -1 : 1));

// 絵師名
const convertAuthor = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.authoren}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};

const authorItem = (arr) =>
  convertAuthor(arr)
    .filter((item) => item.author !== "")
    .map((item) => {
      return {
        author: item.author,
        authoren: item.authoren,
        total: item.total,
      };
    });

// 時代区分
const convertEra = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.eraen}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};

const eraItem = (arr) =>
  convertEra(arr)
    .filter((item) => item.eraen !== "")
    .map((item) => {
      return { era: item.era, eraen: item.eraen, total: item.total };
    });

// タイプ
const convertType = (arr) => {
  const res = {};
  arr.forEach((obj) => {
    const key = `${obj.typeen}`;
    if (!res[key]) {
      res[key] = { ...obj, total: 0 };
    }
    res[key].total += 1;
  });
  return Object.values(res);
};

const typeItem = (arr) =>
  convertType(arr)
    .filter((item) => item.typeen !== "")
    .map((item) => {
      return { type: item.type, typeen: item.typeen, total: item.total };
    });

/* ================

ネストしている「絵巻オブジェクト」を削除して新しいObjectを作成する;

================ */
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

// ネストしているObjectを削除して新しいObjectを作成する;
// https://hi97.hamazo.tv/e8537787.html
// const removeNestedObj = (obj) =>
//   Object.entries(obj).reduce(
//     (acc, [key, val]) => {
//       // value の型が object であった時は Object に新しい値を加えずに返す
//       if ("object" === typeof val) {
//         return acc;
//       }
//       acc[key] = val;
//       return acc;
//     },
//     // 初期値：空のオブジェクト
//     {}
//   );


  // const matchSummaryGenji = (chapter) => {
  //   const chaptergenjisummary = chaptergenji
  //     .filter((item) => chapter.includes(item.title))
  //     .map((item) => item.summary)
  //     .join();
  //   return chaptergenjisummary;
  // };

  /* ================

「九相図」の絵巻データとメタデータ（chapters-of-kusouzu）をマージする関数conectKusouzuChapters

================ */

  const conectKusouzuChapters = (chapter,text) => {
    const chapterkusouzusummary = chapterkusouzu
      .filter((item) => chapter === item.stage_en)
      .map((item) => item[text])
      .join();
    return chapterkusouzusummary;
  };

  // const matchSummary = (chapter, genjieslug) => {
  //   if (genjieslug) {
  //     return matchSummaryGenji(chapter);
  //   } else {
  //     return matchSummaryKusouzu(chapter);
  //   }
  // };


export {
  eraColor,
  keywordItem,
  personnameItem,
  useLocale,
  useLocaleMeta,
  useLocaleData,
  removeNestedEmakisObj,
  genjieSlugItem,
  convertAuthor,
  authorItem,
  eraItem,
  typeItem,
  kusouzuSlugItem,
  conectKusouzuChapters,
};
