/**
 * ロケールフック。next/router の locale に応じて翻訳データを返す。
 *
 * - useLocale: staticData（トップ/About の長文静的 HTML）
 * - useLocaleMeta: dataSiteMeta（SEO サイトメタ）
 * - useLocaleData: scroll-metadata（絵巻データ）
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 */
import { useRouter } from "next/router";
import {
  enMeta,
  jaMeta,
  zhHansMeta,
  zhHantMeta,
} from "@/libs/constants/dataSiteMeta";
import { en, ja, zhHans, zhHant } from "@/libs/constants/staticData";
import {
  default as enData,
  default as jaData,
} from "@/data/scroll-metadata";

const STATIC_MAP = {
  ja,
  en,
  "zh-Hans": zhHans,
  "zh-Hant": zhHant,
};

const META_MAP = {
  ja: jaMeta,
  en: enMeta,
  "zh-Hans": zhHansMeta,
  "zh-Hant": zhHantMeta,
};

export const useLocale = () => {
  const router = useRouter();
  const locale = router?.locale || "ja";
  const t = STATIC_MAP[locale] || en;
  return { locale, t };
};
export const useLocaleMeta = () => {
  const router = useRouter();
  const locale = router?.locale || "ja";
  const t = META_MAP[locale] || jaMeta;
  return { locale, t };
};
export const useLocaleData = () => {
  const router = useRouter();
  const locale = router?.locale || "ja";
  const t = locale === "ja" ? jaData : enData;
  return { locale, t };
};
