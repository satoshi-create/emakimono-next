import type { QuizDefinition, QuizId } from "@/types/quiz";
import { CHOJU_GIGA_KOU_QUIZ } from "./choujuGigaKouQuiz";
import { CHOJU_GIGA_OTSU_QUIZ } from "./choujuGigaOtsuQuiz";
import { CHOJU_GIGA_HEI_QUIZ } from "./choujuGigaHeiQuiz";
import { CHOJU_GIGA_TEI_QUIZ } from "./choujuGigaTeiQuiz";
import { HYAKKI_YAGYO_QUIZ } from "./hyakkiUtokyoQuiz";
import { HYAKKI_KOKKAI_A_QUIZ } from "./hyakkiKokkaiAQuiz";
import { HYAKKI_NO_ZU_NICHIBUN_QUIZ } from "./hyakkiNoZuNichibunQuiz";
import { KUSOUZUMAKI_QUIZ } from "./kusouzumakiQuiz";
import { KUSOUZU_KOBAYASIEIEITAKU_QUIZ } from "./kusouzuKobayasieieitakuQuiz";
import { GENJI_MONOGATARI_TOKUGAWA_QUIZ } from "./genjiMonogatariTokugawaQuiz";

export { getQuizRank } from "./choujuGigaKouQuiz";

export { getQuizNavigation } from "./recommendation";

// 各巻にシリーズメタデータを注入
CHOJU_GIGA_KOU_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_KOU_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_KOU_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_KOU_QUIZ.seriesOrder = 1;
CHOJU_GIGA_KOU_QUIZ.shortTitleJa = "甲巻";
CHOJU_GIGA_KOU_QUIZ.shortTitleEn = "Scroll I";

CHOJU_GIGA_OTSU_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_OTSU_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_OTSU_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_OTSU_QUIZ.seriesOrder = 2;
CHOJU_GIGA_OTSU_QUIZ.shortTitleJa = "乙巻";
CHOJU_GIGA_OTSU_QUIZ.shortTitleEn = "Scroll II";

CHOJU_GIGA_HEI_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_HEI_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_HEI_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_HEI_QUIZ.seriesOrder = 3;
CHOJU_GIGA_HEI_QUIZ.shortTitleJa = "丙巻";
CHOJU_GIGA_HEI_QUIZ.shortTitleEn = "Scroll III";

CHOJU_GIGA_TEI_QUIZ.seriesId = "choju-giga";
CHOJU_GIGA_TEI_QUIZ.seriesTitleJa = "鳥獣戯画シリーズ";
CHOJU_GIGA_TEI_QUIZ.seriesTitleEn = "Chōjū-giga Series";
CHOJU_GIGA_TEI_QUIZ.seriesOrder = 4;
CHOJU_GIGA_TEI_QUIZ.shortTitleJa = "丁巻";
CHOJU_GIGA_TEI_QUIZ.shortTitleEn = "Scroll IV";

HYAKKI_YAGYO_QUIZ.seriesId = "hyakki-yagyo";
HYAKKI_YAGYO_QUIZ.seriesTitleJa = "百鬼夜行絵巻シリーズ";
HYAKKI_YAGYO_QUIZ.seriesTitleEn = "Hyakki Yagyo Series";
HYAKKI_YAGYO_QUIZ.seriesOrder = 1;
HYAKKI_YAGYO_QUIZ.shortTitleJa = "東大本";
HYAKKI_YAGYO_QUIZ.shortTitleEn = "UTokyo";

export const ALL_QUIZZES: QuizDefinition[] = [
  CHOJU_GIGA_KOU_QUIZ,
  CHOJU_GIGA_OTSU_QUIZ,
  CHOJU_GIGA_HEI_QUIZ,
  CHOJU_GIGA_TEI_QUIZ,
  {
    ...HYAKKI_YAGYO_QUIZ,
    seriesId: "hyakki-yagyo",
    seriesOrder: 1,
    shortTitleJa: "東大本",
    shortTitleEn: "UTokyo",
    seriesTitleJa: "百鬼夜行絵巻シリーズ",
    seriesTitleEn: "Hyakki Yagyo Series",
  },
  {
    ...HYAKKI_KOKKAI_A_QUIZ,
    seriesId: "hyakki-yagyo",
    seriesOrder: 2,
    shortTitleJa: "国会A本",
    shortTitleEn: "Kokkai A",
    seriesTitleJa: "百鬼夜行絵巻シリーズ",
    seriesTitleEn: "Hyakki Yagyo Series",
  },
  {
    ...HYAKKI_NO_ZU_NICHIBUN_QUIZ,
    seriesId: "hyakki-yagyo",
    seriesOrder: 3,
    shortTitleJa: "日文研本",
    shortTitleEn: "Nichibunken",
    seriesTitleJa: "百鬼夜行絵巻シリーズ",
    seriesTitleEn: "Hyakki Yagyo Series",
  },
  {
    ...KUSOUZUMAKI_QUIZ,
    seriesId: "kusouzu",
    seriesOrder: 1,
    shortTitleJa: "九相図巻",
    shortTitleEn: "Kusouzumaki",
    seriesTitleJa: "九相図シリーズ",
    seriesTitleEn: "Kusouzu Series",
  },
  {
    ...KUSOUZU_KOBAYASIEIEITAKU_QUIZ,
    seriesId: "kusouzu",
    seriesOrder: 2,
    shortTitleJa: "小林永濯筆",
    shortTitleEn: "Kobayashi Eitaku",
    seriesTitleJa: "九相図シリーズ",
    seriesTitleEn: "Kusouzu Series",
  },
  {
    ...GENJI_MONOGATARI_TOKUGAWA_QUIZ,
    seriesId: "genji-monogatari",
    seriesOrder: 1,
    shortTitleJa: "徳川本",
    shortTitleEn: "Tokugawa",
    seriesTitleJa: "源氏物語絵巻シリーズ",
    seriesTitleEn: "The Tale of Genji Scroll Series",
  },
];

export const QUIZ_BY_ID: Record<QuizId, QuizDefinition> = {
  "chouju_giga_kou_observe_v1": CHOJU_GIGA_KOU_QUIZ,
  "chouju-giga-otsu": CHOJU_GIGA_OTSU_QUIZ,
  "chouju-giga-hei": CHOJU_GIGA_HEI_QUIZ,
  "chouju-giga-tei": CHOJU_GIGA_TEI_QUIZ,
  "hyakki-yagyo-utokyo": HYAKKI_YAGYO_QUIZ,
  "hyakki-kokkai-a": HYAKKI_KOKKAI_A_QUIZ,
  "hyakki-no-zu-nichibun": HYAKKI_NO_ZU_NICHIBUN_QUIZ,
  kusouzumaki: KUSOUZUMAKI_QUIZ,
  "kusouzu-kobayasieieitaku": KUSOUZU_KOBAYASIEIEITAKU_QUIZ,
  "genji-monogatari-tokugawa": GENJI_MONOGATARI_TOKUGAWA_QUIZ,
};

export const QUIZ_BY_TITLEEN: Record<string, QuizDefinition> = {
  "Chōjū-jinbutsu-giga_first": CHOJU_GIGA_KOU_QUIZ,
  "Chōjū-jinbutsu-giga_second": CHOJU_GIGA_OTSU_QUIZ,
  "Chōjū-jinbutsu-giga_third": CHOJU_GIGA_HEI_QUIZ,
  "Chōjū-jinbutsu-giga_fourth": CHOJU_GIGA_TEI_QUIZ,
  hyakki_utokyo: HYAKKI_YAGYO_QUIZ,
  hyakki_kokkai_a: HYAKKI_KOKKAI_A_QUIZ,
  hyakki_no_zu_nichibun: HYAKKI_NO_ZU_NICHIBUN_QUIZ,
  kusouzumaki: KUSOUZUMAKI_QUIZ,
  kusouzu_kobayasieieitaku: KUSOUZU_KOBAYASIEIEITAKU_QUIZ,
  "genjimonogatari-emaki-tokugawa": GENJI_MONOGATARI_TOKUGAWA_QUIZ,
};

export function getQuizForTitleen(
  titleen: string | undefined,
): QuizDefinition | null {
  if (!titleen) return null;
  return QUIZ_BY_TITLEEN[titleen] ?? null;
}

export function getQuizById(
  id: QuizId | string | undefined,
): QuizDefinition | null {
  if (!id) return null;
  return (QUIZ_BY_ID as Record<string, QuizDefinition>)[id] ?? null;
}
