// For the main emaki metadata structure

import type { KeywordInfo, PersonNameInfo, ReferenceInfo } from './common';
import type { EmakiSegment } from './segment';

export type EmakiImageMetadata = {
    id: number;
    title: string;
    titleen: string;
    author?: string;
    authoren?: string;
    edition?: string;
    editionen?: string;
    backgroundImage?: string;
    thumb: string;
    thumb2?: string;
    video?: string;
    era: string;
    eraen: string;
    desc?: string;
    descen?: string;
    type: string;
    typeen: string;
    subtype?: string;
    subtypeen?: string;
    gif?: string;
    googlemap?: string;
    basinmap?: string;
    mapWidth?: number;
    mapHeight?: number;
    keyword?: KeywordInfo[];
    personname?: PersonNameInfo[];
    genjieslug?: {
        id: string;
        title: string;
        ruby: string;
        path: string;
    }[];
    kusouzuslug?: {
        id: string;
    }[];
    kotobagaki: boolean;
    favorite?: boolean;
    readMore?: boolean;
    sourceImageUrl?: string;
    sourceImage?: string;
    reference?: ReferenceInfo[];
    sourceEkotoba?: string;
    emakis: EmakiSegment[];
    pageView?: string | number;
};