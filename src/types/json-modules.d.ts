import type { GenjiChapterItem } from "@/types/chapters";
import type { EmakiChapterTextItem, EmakiMetadata } from "@/types/emaki";

declare module "@/data/scroll-texts/genji-chapters.json" {
  const chapters: GenjiChapterItem[];
  export default chapters;
}

declare module "@/data/scroll-metadata/scrolls/_order.json" {
  const order: string[];
  export default order;
}

declare module "@/data/scroll-metadata/scrolls/*.json" {
  const metadata: EmakiMetadata;
  export default metadata;
}

declare module "@/data/scroll-texts/*.json" {
  const texts: EmakiChapterTextItem[];
  export default texts;
}