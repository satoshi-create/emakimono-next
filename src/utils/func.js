/**
 * Shared hooks and list helpers for pages and components.
 *
 * Exports: useLocale, useLocaleMeta, useLocaleData, keywordItem, personnameItem,
 *   eraColor, getStaticPaths helpers, chapter JSON mappers.
 * Related: staticData.js, dataSiteMeta.js, image-metadata-cache.json.
 * Note: imports legacy genji data from _archive_unused_data — MVP uses choju/kusouzu.
 */
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";
import personProfiles from "@/data/personname-data/personprofiles.json";
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

/**
 * 人物プロフィール一覧。
 * personprofiles.json を正本とし、arr（絵巻データ）から personname の登場数を集計して total を付与。
 * 絵巻に未登場の人物（例: 小野小町）も含めて返す。
 */
const personProfileItem = (arr) => {
  const counts = {};
  arr.forEach((item) => {
    (item.personname || []).forEach((p) => {
      if (!p?.slug) return;
      counts[p.slug] = (counts[p.slug] || 0) + 1;
    });
  });
  return personProfiles
    .map((profile) => ({
      ...profile,
      total: counts[profile.slug] || 0,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        a.name.localeCompare(b.name, "ja"),
    );
};

/** slug から人物プロフィールを1件取得（無ければ undefined） */
const findPersonProfile = (slug) =>
  personProfiles.find((p) => p.slug === slug);

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

絵巻の章テキスト（emaki-text-data/{titleen}.json）を自動ロードするマップ

sync_all.py が生成するファイルを require.context で読み込み、
`connectEmakiTextData(titleen, chapter, field)` で引く。

================ */

/** 章テキストとして読み込まないファイル（九相カタログは stage_en キーの共有カタログのため除外） */
const EMAKI_TEXT_EXCLUDED_SLUGS = new Set(["chapters-of-kusouzu"]);

function buildEmakiTextDataMap() {
  const map = {};
  const ctx = require.context("../data/emaki-text-data", false, /\.json$/);
  ctx.keys().forEach((key) => {
    const slug = key.replace(/^\.\//, "").replace(/\.json$/, "");
    if (EMAKI_TEXT_EXCLUDED_SLUGS.has(slug)) return;
    const data = ctx(key);
    map[slug] = data?.default ?? data;
  });
  return map;
}

const emakiTextDataMap = buildEmakiTextDataMap();

const connectEmakiTextData = (titleen, chapter, field) => {
  const chapterData = emakiTextDataMap[titleen];
  if (!chapterData) {
    return "";
  }
  const chapterStr = String(chapter);
  return chapterData
    .filter((item) => chapterStr === String(item.chapter))
    .map((item) => item[field])
    .filter(Boolean)
    .join();
};

// emaki-text-data/{titleen}.json が存在すれば、その巻のテキストはファイルが正本。
// チャプターキーはキャッシュ（ekotoba.chapter）と一致させる。
const hasTextData = (titleen) => Boolean(emakiTextDataMap[titleen]);

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

const ChaptersTitle = (titleen, title, chapter, text) => {
  if (title.includes("源氏")) {
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
  }
  if (hasTextData(titleen)) {
    return connectEmakiTextData(titleen, chapter, text);
  }
  return chapter && parse(chapter);
};

const ChaptersGendaibun = (titleen, title, chapter, gendaibun) => {
  if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "summary") &&
          `${connectGenjiChapters(chapter, "summary")}`}
      </>
    );
  }
  if (hasTextData(titleen)) {
    const gendaibunText = connectEmakiTextData(titleen, chapter, "gendaibun");
    if (gendaibunText) return parse(gendaibunText);
    const titleText = connectEmakiTextData(titleen, chapter, "title");
    return titleText ? parse(titleText) : "";
  }
  return gendaibun && parse(gendaibun);
};

const ChaptersDesc = (titleen, title, chapter, text, desc) => {
  if (title.includes("源氏")) {
    return (
      <>
        {connectGenjiChapters(chapter, "summary") &&
          `${connectGenjiChapters(chapter, "summary")}`}
      </>
    );
  }
  if (hasTextData(titleen)) {
    const field = text === "descen" ? "descen" : "desc";
    const fromJson = connectEmakiTextData(titleen, chapter, field);
    return fromJson ? parse(fromJson) : "";
  }
  return desc && parse(desc);
};

// 段の解説を生テキスト（文字列）で返す。ChaptersDesc の文字列版。
// ボトムコメントバーで「冒頭プレビュー + 詳細をみる」を出し分けるために使用する。
const getChapterDescRaw = (titleen, title, chapter, text, desc) => {
  if (title.includes("源氏")) {
    return connectGenjiChapters(chapter, "summary") || "";
  }
  if (hasTextData(titleen)) {
    const field = text === "descen" ? "descen" : "desc";
    return connectEmakiTextData(titleen, chapter, field) || "";
  }
  return desc || "";
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
  convertAuthor,
  eraColor,
  eraItem,
  filterdKeywords,
  findPersonProfile,
  genjieSlugItem,
  getChapterDescRaw,
  keywordItem,
  kusouzuSlugItem,
  personnameItem,
  personProfileItem,
  removeNestedEmakisObj,
  typeItem,
  useLocale,
  useLocaleData,
  useLocaleMeta,
};
