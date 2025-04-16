// For the separate chapter/text data JSON files

export type KusouzuChapterInfo = {
    stage_en: string;
    stage_ch: string;
    title: string;
    titleen: string;
    ruby: string;
    desc: string;
    descen?: string;
    gendaibun?: string;
};

export type ChojuGigaChapterInfo = {
    chapter: string;
    title: string;
    titleen: string;
};

export type EmakiChapterInfo = {
    chapter: string | number;
    title: string;
    titleen?: string;
    desc?: string;
    descen?: string;
};