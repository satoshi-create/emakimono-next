// src/libs/i18n/getDictionary.ts

export async function getDictionary(locale) {
  const dict = await import(`@/../public/locales/${locale}/common.json`);
  return dict.default;
}
