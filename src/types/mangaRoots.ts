/** マンガのルーツ特設（/manga-roots）のグラフ。正本: src/data/mangaRoots.js */

export type MangaRootsTagId = "animal" | "hell" | "yokai" | "kusozu";

export type MangaRootsEmakiNode = {
  id: string;
  titleen: string;
  title: string;
  titleEn: string;
  thumb: string;
  tags: MangaRootsTagId[];
};

export type MangaRootsMediaNode = {
  id: string;
  titleJa: string;
  titleEn: string;
  type: "manga" | "anime";
  tags: MangaRootsTagId[];
  officialUrl: string;
};

export type MangaRootsTagNode = {
  id: MangaRootsTagId;
  labelJa: string;
  labelEn: string;
};

export type MangaRootsGraph = {
  emakiNodes: MangaRootsEmakiNode[];
  mediaNodes: MangaRootsMediaNode[];
  tagNodes: MangaRootsTagNode[];
  edges: {
    emakiToTag: Array<{ from: string; via: MangaRootsTagId }>;
    tagToMedia: Array<{ to: string; via: MangaRootsTagId }>;
  };
};
