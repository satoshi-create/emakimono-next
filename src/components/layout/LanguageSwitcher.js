import styles from "@/styles/LanguageSwitcher.module.css";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { useTranslation } from "next-i18next";

const stripLocalePrefix = (asPath, locales) => {
  const [pathAndQuery, hash = ""] = asPath.split("#");
  const [path, query = ""] = pathAndQuery.split("?");

  let stripped = path;
  for (const loc of locales) {
    if (stripped.startsWith(`/${loc}/`)) {
      stripped = stripped.slice(`/${loc}`.length) || "/";
      break;
    }
    if (stripped === `/${loc}`) {
      stripped = "/";
      break;
    }
  }

  const queryPart = query ? `?${query}` : "";
  const hashPart = hash ? `#${hash}` : "";
  return `${stripped}${queryPart}${hashPart}`;
};

const LOCALE_ORDER = ["en", "ja", "zh-Hans", "zh-Hant"];

const LOCALE_LABELS = {
  en: { short: "EN", aria: "English" },
  ja: { short: "JA", aria: "日本語" },
  "zh-Hans": { short: "简", aria: "简体中文" },
  "zh-Hant": { short: "繁", aria: "繁體中文" },
};

const LanguageSwitcher = () => {
  const router = useRouter();
  const { t } = useTranslation("common");
  const { locales, locale: activeLocale, defaultLocale } = router;

  const orderedLocales = LOCALE_ORDER.filter((loc) => locales?.includes(loc));

  const handleLanguageChange = (newLocale) => {
    if (newLocale === activeLocale) return;

    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;samesite=lax`;

    const pathWithoutLocale = stripLocalePrefix(router.asPath, locales);
    const href =
      newLocale === defaultLocale
        ? pathWithoutLocale
        : `/${newLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;

    window.location.assign(href);
  };

  return (
    <div
      className={styles.switcher}
      role="group"
      aria-label={t("nav.languageSwitch")}
    >
      {orderedLocales.map((locale, index) => {
        const label = LOCALE_LABELS[locale] || {
          short: locale.toUpperCase(),
          aria: locale,
        };
        return (
          <Fragment key={locale}>
            {index > 0 && (
              <span className={styles.sep} aria-hidden="true">
                /
              </span>
            )}
            <button
              type="button"
              className={`${styles.langBtn} ${
                locale === activeLocale ? styles.active : ""
              }`}
              onClick={() => handleLanguageChange(locale)}
              aria-pressed={locale === activeLocale}
              aria-label={label.aria}
            >
              {label.short}
            </button>
          </Fragment>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
