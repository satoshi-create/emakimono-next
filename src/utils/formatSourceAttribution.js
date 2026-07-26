export const SOURCE_PROVIDERS = {
  colbase: "colbase",
  britishMuseum: "britishMuseum",
  wikimedia: "wikimedia",
  generic: "generic",
};

const LICENSE_URLS = {
  britishMuseum: {
    ja: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja",
    en: "https://creativecommons.org/licenses/by-nc-sa/4.0/deed.en",
  },
  wikimedia: {
    ja: "https://creativecommons.org/publicdomain/zero/1.0/deed.ja",
    en: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
  },
};

/** @param {string | undefined} sourceImageUrl */
export function getSourceProvider(sourceImageUrl = "") {
  const url = sourceImageUrl.toLowerCase();
  if (url.includes("colbase.nich.go.jp")) return SOURCE_PROVIDERS.colbase;
  if (url.includes("britishmuseum.org")) return SOURCE_PROVIDERS.britishMuseum;
  if (url.includes("wikimedia.org")) return SOURCE_PROVIDERS.wikimedia;
  return SOURCE_PROVIDERS.generic;
}

function getLicenseUrl(provider, locale) {
  const lang = locale === "en" ? "en" : "ja";
  return LICENSE_URLS[provider]?.[lang] ?? null;
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
  const licenseUrl = getLicenseUrl(provider, locale);
  const title = sourceTitle || sourceImage;
  const i18nParams = {
    url: sourceImageUrl,
    label: sourceImage,
    title,
    author: sourceAuthor || "Hiart",
    collection: sourceCollection,
    licenseUrl: licenseUrl || sourceImageUrl,
  };

  const sourceLine = t(`sourceAttribution.${provider}Source`, i18nParams);
  const licenseLine =
    provider === SOURCE_PROVIDERS.britishMuseum ||
    provider === SOURCE_PROVIDERS.wikimedia
      ? t(`sourceAttribution.${provider}License`, i18nParams)
      : null;
  const modifiedLine = modified
    ? t(`sourceAttribution.${provider}Modified`, i18nParams)
    : null;

  return {
    sourceLine,
    licenseLine,
    modifiedLine,
    sourceLinkUrl: sourceImageUrl,
    licenseLinkUrl: licenseLine ? licenseUrl : null,
    provider,
  };
}
