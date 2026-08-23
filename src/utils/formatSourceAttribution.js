export const SOURCE_PROVIDERS = {
  colbase: "colbase",
  britishMuseum: "britishMuseum",
  wikimedia: "wikimedia",
  ndl: "ndl",
  generic: "generic",
};

const LICENSE_URLS = {
  colbase: {
    ja: "https://colbase.nich.go.jp/pages/term?locale=ja",
    en: "https://colbase.nich.go.jp/pages/term?locale=en",
  },
  britishMuseum: {
    ja: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja",
    en: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en",
  },
  wikimedia: {
    ja: "https://creativecommons.org/publicdomain/zero/1.0/deed.ja",
    en: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
  },
  ndl: {
    ja: "https://www.ndl.go.jp/use/reproduction",
    en: "https://www.ndl.go.jp/en/use/reproduction",
  },
  "CC BY 4.0": {
    ja: "https://creativecommons.org/licenses/by/4.0/deed.ja",
    en: "https://creativecommons.org/licenses/by/4.0/deed.en",
  },
  "CC BY-NC-SA 4.0": {
    ja: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja",
    en: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en",
  },
};

/** @param {string | undefined} sourceImageUrl */
export function getSourceProvider(sourceImageUrl = "") {
  const url = sourceImageUrl.toLowerCase();
  if (url.includes("colbase.nich.go.jp")) return SOURCE_PROVIDERS.colbase;
  if (url.includes("britishmuseum.org")) return SOURCE_PROVIDERS.britishMuseum;
  if (url.includes("wikimedia.org")) return SOURCE_PROVIDERS.wikimedia;
  if (url.includes("dl.ndl.go.jp") || url.includes("ndl.go.jp"))
    return SOURCE_PROVIDERS.ndl;
  return SOURCE_PROVIDERS.generic;
}

function getLicenseUrl(provider, locale) {
  const lang = locale === "en" ? "en" : "ja";
  return LICENSE_URLS[provider]?.[lang] ?? null;
}

/**
 * ライセンスバッジの情報を返す。明示 license 優先 → プロバイダ既定。
 * 判定不能（generic）は null。
 * @param {{ provider: string, license?: string, locale?: string }} params
 */
export function getLicenseBadge({ provider, license = "", locale = "ja" }) {
  const lang = locale === "en" ? "en" : "ja";
  const explicitUrl = LICENSE_URLS[license]?.[lang];
  if (explicitUrl) {
    return { label: license, url: explicitUrl, tone: "cc" };
  }
  switch (provider) {
    case SOURCE_PROVIDERS.colbase:
      return {
        labelKey: "colbase",
        url: LICENSE_URLS.colbase[lang],
        tone: "terms",
      };
    case SOURCE_PROVIDERS.ndl:
      return {
        labelKey: "ndl",
        url: LICENSE_URLS.ndl[lang],
        tone: "terms",
      };
    case SOURCE_PROVIDERS.britishMuseum:
      return {
        label: "CC BY-NC-SA 4.0",
        url: LICENSE_URLS.britishMuseum[lang],
        tone: "cc",
      };
    case SOURCE_PROVIDERS.wikimedia:
      return {
        label: "CC0 1.0",
        url: LICENSE_URLS.wikimedia[lang],
        tone: "cc0",
      };
    default:
      return null;
  }
}

/** @param {{ title?: string, titleen?: string, locale?: string }} params */
export function getSourceDisplayTitle({ title = "", titleen = "", locale = "ja" }) {
  if (
    titleen === "nine-stages-of-decay-empress-danrin" &&
    locale === "en"
  ) {
    return "Nine Stages of Decomposition of the Heian Period Empress Danrin";
  }
  return title;
}

/**
 * @param {object} params
 * @param {string} params.sourceImageUrl
 * @param {string} [params.sourceImage]
 * @param {string} [params.sourceTitle]
 * @param {string} [params.sourceAuthor]
 * @param {string} [params.sourceCollection]
 * @param {string} params.locale
 * @param {(key: string, options?: object) => string} params.t
 * @param {boolean} [params.modified]
 */
export function formatSourceAttribution({
  sourceImageUrl,
  sourceImage = "",
  sourceTitle = "",
  sourceAuthor = "",
  sourceCollection = "",
  locale,
  t,
  modified = true,
  license = "",
}) {
  if (!sourceImageUrl) {
    return {
      sourceLine: sourceImage || "",
      licenseLine: null,
      modifiedLine: null,
      sourceLinkUrl: null,
      licenseLinkUrl: null,
      provider: null,
    };
  }

  const provider = getSourceProvider(sourceImageUrl);
  const lang = locale === "en" ? "en" : "ja";
  const explicitLicenseUrl = LICENSE_URLS[license]?.[lang];
  // 明示的なライセンス指定（例: "CC BY 4.0"）をプロバイダ既定（Wikimedia = CC0 等）より優先
  const licenseUrl = explicitLicenseUrl ?? getLicenseUrl(provider, locale);
  const title = sourceTitle || sourceImage;
  const i18nParams = {
    url: sourceImageUrl,
    label: sourceImage,
    title,
    author: sourceAuthor || "Hiart",
    collection: sourceCollection,
    licenseUrl: licenseUrl || sourceImageUrl,
    license,
  };

  const sourceLine = t(`sourceAttribution.${provider}Source`, i18nParams);

  let licenseLine = null;
  let modifiedLine = null;
  if (explicitLicenseUrl) {
    licenseLine = t("sourceAttribution.byLicense", i18nParams);
    modifiedLine = modified
      ? t("sourceAttribution.byModified", i18nParams)
      : null;
  } else {
    licenseLine =
      provider === SOURCE_PROVIDERS.britishMuseum ||
      provider === SOURCE_PROVIDERS.wikimedia
        ? t(`sourceAttribution.${provider}License`, i18nParams)
        : null;
    modifiedLine = modified
      ? t(`sourceAttribution.${provider}Modified`, i18nParams)
      : null;
  }

  return {
    sourceLine,
    licenseLine,
    modifiedLine,
    sourceLinkUrl: sourceImageUrl,
    licenseLinkUrl: licenseLine ? licenseUrl : null,
    provider,
  };
}
