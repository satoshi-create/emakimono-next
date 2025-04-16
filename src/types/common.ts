// For reusable sub-types

export type KeywordInfo = {
    name: string;
    id: string;
    slug: string;
};

export type PersonNameInfo = {
    name: string;
    id: string;
    slug: string;
    ruby?: string;
    portrait?: string;
};

export type ReferenceInfo = {
    type: string;
    url?: string;
    title: string;
};

export type CharacterInfo = {
    name: string;
    status?: string;
    top: number;
    right: number;
    gender?: "man" | "woman" | "animal";
    link?: string;
};

export type EbikiInfo = {
    name: string;
    status?: string;
    top: number;
    right: number;
    path?: string;
    attr?: string;
};