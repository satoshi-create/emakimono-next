/**
 * 絵巻リストの集計・フィルタヘルパー。
 *
 * - キーワード / 登場人物 / 絵師 / 時代 / タイプの集計（convert 系）
 * - 人物プロフィール（personprofiles.json を正本、登場数 total を付与）
 * - removeNestedEmakisObj: ネストした emakis を除去したオブジェクトを作成
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 */
import personProfiles from "@/data/personname-data/personprofiles.json";

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

export const keywordItem = (arr) =>
  convert(arr.flatMap((item) => item.keyword).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1),
  );

// 登場人物名
export const personnameItem = (arr) =>
  convert(arr.flatMap((item) => item.personname).filter((item) => item)).sort(
    (a, b) => (a.total > b.total ? -1 : 1),
  );

/**
 * 人物プロフィール一覧。
 * personprofiles.json を正本とし、arr（絵巻データ）から personname の登場数を集計して total を付与。
 * 絵巻に未登場の人物（例: 小野小町）も含めて返す。
 */
export const personProfileItem = (arr) => {
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
export const findPersonProfile = (slug) =>
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

export const genjieSlugItem = (arr) =>
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
export const kusouzuSlugItem = (arr) =>
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

export const authorItem = (arr) =>
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

export const eraItem = (arr) =>
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

export const typeItem = (arr) =>
  convertType(arr)
    .filter((item) => item.typeen !== "")
    .map((item) => {
      return { type: item.type, typeen: item.typeen, total: item.total };
    });

/* ================

ネストしている「絵巻オブジェクト」を削除して新しいObjectを作成する;

================ */
export const removeNestedEmakisObj = (obj) =>
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

// キーワード一覧とマッチする絵巻ページのタグをfindし、新たな配列を作成
export const filterdKeywords = (pageKey, allKey) =>
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
