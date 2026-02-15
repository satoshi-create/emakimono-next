import chapterkusouzu from "@/data/emaki-text-data/chapters-of-kusouzu.json";
import chapterChojugigaFirst from "@/data/emaki-text-data/Chōjū-jinbutsu-giga_first.json";
import chapterChojugigaSecond from "@/data/emaki-text-data/Chōjū-jinbutsu-giga_second.json";
import chapterChojugigaThird from "@/data/emaki-text-data/Chōjū-jinbutsu-giga_third.json";
import chapterChojugigaFourth from "@/data/emaki-text-data/Chōjū-jinbutsu-giga_fourth.json";
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import chaptergenji from "@/libs/_archive_unused_data/genji/chapters-of-genji.json";
import { enMeta, jaMeta } from "@/libs/constants/dataSiteMeta";
import { en, ja } from "@/libs/constants/staticData";
import parse from "html-react-parser";
import { useRouter } from "next/router";

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
    (a, b) => (a.total > b.total ? -1 : 1),
  );

// 登場人物名
const personnameItem = (arr) =>
  convert(arr.flatMap((item) => item.personname).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1),
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
    arr.flatMap((item) => item.genjieslug).filter((item) => item),
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
    arr.flatMap((item) => item.kusouzuslug).filter((item) => item),
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
    {},
  );

/* ================

「九相図」の絵巻データとメタデータ（chapters-of-kusouzu）をマージする関数connectKusouzuChapters

================ */

const connectKusouzuChapters = (chapter, text) => {
  const chapterkusouzusummary = chapterkusouzu
    .filter((item) => chapter === item.stage_en)
    .map((item) => item[text])
    .join();
  return chapterkusouzusummary;
};

/* ================

「鳥獣人物戯画」の絵巻データとメタデータをマージする関数connectChojugigaChapters

================ */

const chojugigaDataMap = {
  "Chōjū-jinbutsu-giga_first": chapterChojugigaFirst,
  "Chōjū-jinbutsu-giga_second": chapterChojugigaSecond,
  "Chōjū-jinbutsu-giga_third": chapterChojugigaThird,
  "Chōjū-jinbutsu-giga_fourth": chapterChojugigaFourth,
};

const connectChojugigaChapters = (titleen, chapter, text) => {
  const chapterData = chojugigaDataMap[titleen];
  if (!chapterData) {
    return "";
  }
  // Notion移行期の一時対応: chapterがstring/number混在のため、両方をNumberに変換して比較
  const chapterNum = Number(chapter);
  const chapterSummary = chapterData
    .filter((item) => chapterNum === Number(item.chapter))
    .map((item) => item[text])
    .join();
  return chapterSummary;
};

const connectGenjiChapters = (chapter, text) => {
  const chapterGenjisummary = chaptergenji
    .filter((item) => chapter === item.chapter_en)
    .map((item) => item[text])
    .join();
  return chapterGenjisummary;
};
const connectGenjiChaptersScene = (chapter, scene) => {
  if (scene) {
    const chapterGenjisummary = chaptergenji
      .filter((item) => chapter === item.chapter_en)
      .flatMap((item) => item.scene)
      .filter((item) => scene === item.sceneId)
      .map((item) => item.content);
    return chapterGenjisummary;
  }
};

const connectEmakiTextSync = (titleen, chapter, field) => {
  // この関数に到達した場合、対応するメタデータ読み込み処理が未実装
  // 新しい絵巻タイプを追加する際は、専用の connect 関数を実装すること
  console.error(
    `[connectEmakiTextSync] 未対応の絵巻タイプ: titleen="${titleen}", chapter="${chapter}", field="${field}". ` +
    `この絵巻用のメタデータ読み込み処理を実装してください。`
  );
  return null;
};

const ChaptersTitle = (titleen, title, chapter, text) => {
  if (title.includes("九相")) {
    return (
      <>
        {connectKusouzuChapters(chapter, text) &&
          `${connectKusouzuChapters(chapter, text)}`}
      </>
    );
  } else if (title.includes("鳥獣") || title.includes("戯画")) {
    return (
      <>
        {connectChojugigaChapters(titleen, chapter, text) &&
          `${connectChojugigaChapters(titleen, chapter, text)}`}
      </>
    );
  } else if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "chapter_en") &&
          `【第${connectGenjiChapters(chapter, "chapter_ch")}帖】`}
        <ruby>
          {connectGenjiChapters(chapter, "chapter_en") &&
            `${connectGenjiChapters(chapter, "title")}`}
          <rp>(</rp>
          <rt>
            {connectGenjiChapters(chapter, "chapter_en") &&
              `${connectGenjiChapters(chapter, "ruby")}`}
          </rt>
          <rp>)</rp>
        </ruby>
      </>
    );
  } else if (Number.isInteger(parseInt(chapter))) {
    return connectEmakiTextSync(titleen, chapter, text);
  } else {
    return chapter && parse(chapter);
  }
};

const ChaptersGendaibun = (titleen, title, chapter, gendaibun) => {
  if (title.includes("九相")) {
    return (
      <>
        {connectKusouzuChapters(chapter, "desc") &&
          `${connectKusouzuChapters(chapter, "desc")}`}
      </>
    );
  } else if (title.includes("鳥獣") || title.includes("戯画")) {
    // 鳥獣人物戯画は現在descフィールドがないため、タイトルを返す
    return (
      <>
        {connectChojugigaChapters(titleen, chapter, "title") &&
          `${connectChojugigaChapters(titleen, chapter, "title")}`}
      </>
    );
  } else if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "summary") &&
          `${connectGenjiChapters(chapter, "summary")}`}
      </>
    );
  } else if (Number.isInteger(parseInt(chapter))) {
    return connectEmakiTextSync(titleen, chapter, "gendaibun");
  } else {
    return gendaibun && parse(gendaibun);
  }
};

const ChaptersDesc = (titleen, title, chapter, text, desc) => {
  if (title.includes("九相")) {
    return (
      <>
        {connectKusouzuChapters(chapter, text) &&
          `${connectKusouzuChapters(chapter, text)}`}
      </>
    );
  } else if (title.includes("鳥獣") || title.includes("戯画")) {
    return (
      <>
        {connectChojugigaChapters(titleen, chapter, text) &&
          `${connectChojugigaChapters(titleen, chapter, text)}`}
      </>
    );
  } else if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "summary") &&
          `${connectGenjiChapters(chapter, "summary")}`}
      </>
    );
  } else if (Number.isInteger(parseInt(chapter))) {
    return connectEmakiTextSync(titleen, chapter, "desc");
  } else {
    return desc && parse(desc);
  }
};

// キーワード一覧とマッチする絵巻ページのタグをfindし、新たな配列を作成

const filterdKeywords = (pageKey, allKey) =>
  pageKey
    ?.map((item2) => {
      const matchingItem = allKey.find((item1) => item1.name === item2.name);
      if (matchingItem) {
        return {
          name: matchingItem.name,
          id: matchingItem.id,
          slug: matchingItem.slug,
          total: matchingItem.total,
        };
      }
      return null;
    })
    .filter((item) => item !== null);

export {
  authorItem,
  ChaptersDesc,
  ChaptersGendaibun,
  ChaptersTitle,
  connectGenjiChapters,
  connectGenjiChaptersScene,
  connectKusouzuChapters,
  convertAuthor,
  eraColor,
  eraItem,
  filterdKeywords,
  genjieSlugItem,
  keywordItem,
  kusouzuSlugItem,
  personnameItem,
  removeNestedEmakisObj,
  typeItem,
  useLocale,
  useLocaleData,
  useLocaleMeta,
};
