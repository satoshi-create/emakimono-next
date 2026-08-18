import { buildCloudinaryUrl } from "@/utils/cloudinaryUrl";

/**
 * OGP画像フォールバック（ローカルサムネが存在しない絵巻）。
 * Cloudinary の変換パラメータで 1200×630 jpg をその場生成する。
 * key: titleen（URLスラッグ）
 */
const OGP_IMAGE_FALLBACKS = {
  jigokusoushi_masuda_kou: buildCloudinaryUrl(
    "emakimono/jigokusoushi_masuda_kou__jigokusoushi_masuda_kou_1_01__02.jpg",
    ["f_jpg", "w_1200", "h_630", "c_fill"]
  ),
  "eshi-no-soshi_tohaku": buildCloudinaryUrl(
    "emakimono/eshi-no-soshi__eshi-no-soshi_1_01__04.jpg",
    ["f_jpg", "w_1200", "h_630", "c_fill"]
  ),
};

export { OGP_IMAGE_FALLBACKS };
