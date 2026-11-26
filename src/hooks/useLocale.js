/**
 * ロケールフック。next/router の locale に応じて翻訳データを返す。
 *
 * - useLocale: staticData（トップ/About の長文静的 HTML）
 * - useLocaleMeta: common.json meta.*（SEO サイトメタ）
 * - useLocaleData: scroll-metadata（絵巻データ）
 *
 * 抽出元: src/utils/func.js（旧 func.js は re-export のみに縮小済み）。
 */
import { useRouter } from "next/router";
import { SITE_ORIGIN } from "@/libs/constants/dataSiteMeta";
import { en, ja } from "@/libs/constants/staticData";
import { useTranslation } from "next-i18next";
import {
  default as enData,
  default as jaData,
} from "@/data/scroll-metadata";

export const useLocale = () => {
  const router = useRouter();
  const locale = router?.locale || "ja";
  const t = locale === "en" ? en : ja;
  return { locale, t };
};
export const useLocaleMeta = () => {
  const router = useRouter();
  const locale = router?.locale || "ja";
  const { t: translate } = useTranslation("common");
  const t = {
    siteTitle: translate("meta.siteTitle"),
    siteDesc: translate("meta.siteDesc"),
    siteUrl: SITE_ORIGIN,
    siteLang: translate("meta.siteLang"),
    siteLocale: translate("meta.siteLocale"),
    siteType: translate("meta.siteType"),
    siteIcon: translate("meta.siteIcon"),
  };
  return { locale, t };
};
export const useLocaleData = () => {
  const router = useRouter();
  const locale = router?.locale || "ja";
  const t = locale === "en" ? enData : jaData;
  return { locale, t };
};
