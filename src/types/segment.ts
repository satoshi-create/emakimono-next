// For the segments within an emaki

import type { CharacterInfo, EbikiInfo } from './common';

export type EmakiSegment = {
    cat: "ekotoba" | "image";
    chapter?: string;
    scene?: string;
    config?: "cloudinary" | string;
    src?: string;
    srcSp?: string;
    srcTb?: string;
    srcWidth?: number | string; // Allow string due to potential inconsistencies in source JSON
    srcHeight?: number | string; // Allow string due to potential inconsistencies in source JSON
    name?: string;
    kobun?: string;
    gendaibun?: string;
    desc?: string;
    kobunsrc?: string;
    kobunsrcSp?: string;
    googlemap?: string;
    basinmap?: string;
    phrase?: any[];
    character?: CharacterInfo[];
    ebiki?: EbikiInfo[];
    linkId?: number;
    ekotobaId?: number;
    uniqueIndex?: number;
    load?: boolean | string; // Allow string for potential inconsistencies
    test?: string; // Saw this in one example, keeping as optional string
};