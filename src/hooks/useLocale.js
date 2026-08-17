/**
 * ロケールフック。next/router の locale に応じて翻訳データを返す。
 *
 * - useLocale: staticData（トップ/About の長文静的 HTML）
 * - useLocaleMeta: dataSiteMeta（SEO サイトメタ）
 * - useLocaleData: image-metadata-cache（絵巻データ）
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 */
import { useRouter } from "next/router";
import { enMeta, jaMeta } from "@/libs/constants/dataSiteMeta";
import { en, ja } from "@/libs/constants/staticData";
import {
  default as enData,
  default as jaData,
} from "@/data/image-metadata-cache/image-metadata-cache.json";

export const useLocale = () => {
  const { locale } = useRouter();
  const t = locale === "en" ? en : ja;
  return { locale, t };
};
export const useLocaleMeta = () => {
  const { locale } = useRouter();
  const t = locale === "en" ? enMeta : jaMeta;
  return { locale, t };
};
export const useLocaleData = () => {
  const { locale } = useRouter();
  const t = locale === "en" ? enData : jaData;
  return { locale, t };
};
