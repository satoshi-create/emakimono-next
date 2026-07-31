const CLOUDINARY_BASE = "https://res.cloudinary.com/dw2gjxrrf/image/upload/fl_progressive";

/**
 * OGP画像フォールバック（ローカルサムネが存在しない絵巻）。
 * Cloudinary の変換パラメータで 1200×630 jpg をその場生成する。
 * key: titleen（URLスラッグ）
 */
const OGP_IMAGE_FALLBACKS = {
  jigokusoushi_masuda_kou:
    `${CLOUDINARY_BASE},f_jpg,w_1200,h_630,c_fill/emakimono/jigokusoushi_masuda_kou__jigokusoushi_masuda_kou_1_01__02.jpg`,
  "eshi-no-soshi_tohaku":
    `${CLOUDINARY_BASE},f_jpg,w_1200,h_630,c_fill/emakimono/eshi-no-soshi__eshi-no-soshi_1_01__04.jpg`,
};

export { OGP_IMAGE_FALLBACKS };
