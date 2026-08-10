import emakisData from "@/data/image-metadata-cache/image-metadata-cache.json";
import { isWithdrawnScroll } from "@/libs/constants/withdrawnScrolls";

/**
 * ビューア公開中（withdrawn 除外）の titleen 集合。
 * 年表チップの live/準備中判定に使う。画像キャッシュを省略した場合は
 * 絵巻ページのように useLocaleData() で得た配列を渡す。
 */
export function getLiveSlugs(data = emakisData) {
  return data
    .filter((item) => !isWithdrawnScroll(item.titleen))
    .map((item) => item.titleen);
}
