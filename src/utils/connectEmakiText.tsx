// TypeScriptの型だけをインポートします（ランタイムには影響しない）
import chaptergenji from "@/data/emaki-text-data/chapters-of-genji.json";
import type { EmakiTextData } from "@/types/emaki.ts";

/** 源氏54帖マスター（chapters-of-genji.json）の1帖ぶんの形 */
type GenjiChapterRecord = {
  path?: string;
  titleen?: string;
  title?: string;
  ruby?: string;
  chapter_en?: string | number;
  chapter_ch?: string;
  age?: string;
  ageen?: string;
  "main-character"?: string;
  mainCharacteren?: string;
  "main-character-en"?: string;
  summary?: string;
  summaryen?: string;
  gendaibun?: string;
  gendaibunen?: string;
  kobun?: string;
  kobunen?: string;
};

const genjiChapters = chaptergenji as GenjiChapterRecord[];

/**
 * genji_chapter（帖番号）または帖スラグ（path）から帖マスターを引く。
 * 該当がなければ undefined（呼び出し側は空表示へ安全にフォールバックする）。
 */
export const findGenjiChapter = (
  genjiChapter: string | number | null | undefined
): GenjiChapterRecord | undefined => {
  const key = String(genjiChapter ?? "").trim();
  if (!key) return undefined;
  return genjiChapters.find(
    (item) => key === String(item.chapter_en) || key === String(item.path)
  );
};

/**
 * 詞書がない段（絵単独の段）へバインドする帖テキスト。
 * ロケール別に分けて返し、未整備のフィールドは空のまま（日本語へ落とさない）。
 */
export const connectGenjiChapterFallback = (
  genjiChapter: string | number | null | undefined
) => {
  const row = findGenjiChapter(genjiChapter);
  if (!row) return null;
  return {
    summary: row.summary || "",
    summaryen: row.summaryen || "",
    gendaibun: row.gendaibun || "",
    gendaibunen: row.gendaibunen || "",
    kobun: row.kobun || "",
    kobunen: row.kobunen || "",
  };
};

/**
 * 帖ダイジェストモーダル用の表示データ（タイトル・巻立・主な人物・あらすじ）。
 * locale が en のときは英語フィールドを優先し、無ければ日本語へフォールバックする。
 */
export const getGenjiChapterDigest = (
  genjiChapter: string | number | null | undefined,
  locale?: string
) => {
  const row = findGenjiChapter(genjiChapter);
  if (!row) return null;
  const isEn = locale === "en";
  const pick = (ja?: string, en?: string) => (isEn ? en || ja : ja) || "";
  return {
    path: row.path || row.titleen || "",
    title: row.title || "",
    titleen: row.titleen || row.path || "",
    ruby: row.ruby || "",
    chapterEn: row.chapter_en ?? "",
    chapterCh: row.chapter_ch || "",
    age: pick(row.age, row.ageen),
    mainCharacter: pick(
      row["main-character"],
      row.mainCharacteren || row["main-character-en"]
    ),
    summary: pick(row.summary, row.summaryen),
    gendaibun: pick(row.gendaibun, row.gendaibunen),
    kobun: pick(row.kobun, row.kobunen),
  };
};

/**
 * 絵巻テキストデータ（JSON）を動的に読み込み、
 * 指定された章とフィールドに対応する値を抽出・整形して返します。
 *
 * @param titleen - JSONファイル名（英語タイトル）
 * @param chapter - 対象の章番号
 * @param text - 取得したいフィールド名（title, title_en, text, chapter）
 * @returns chapterに対応するフィールドの文字列、またはundefined
 */
export const connectEmakiText = async (
  titleen: string, // JSONファイル名（例: "heiji-scroll"）
  chapter: number, // 対象章番号（例: 2）
  text: keyof EmakiTextData // 取得するプロパティ名。型により "title" | "title_en" | "text" | "chapter" に制限される
): Promise<string | undefined> => {
  try {
    // 動的インポートでJSONファイルを読み込む（importは非同期なのでawaitが必要）
    const jsonModule = await import(`@/data/emaki-text-data/${titleen}.json`);

    // JSONモジュールのdefaultエクスポート部分にアクセスし、型アサーションを適用
    const emakiTextData = jsonModule.default as EmakiTextData[];

    // 指定されたchapterのデータを抽出し、対象のプロパティ（text）を取り出してjoin（複数ある場合は結合）
    const matched = emakiTextData
      .filter((item) => chapter === item.chapter) // 該当する章だけに絞る
      .map((item) => item[text]) // そのプロパティだけ取り出す
      .join(); // 複数データがあったら文字列としてつなげる

    return matched; // 抽出した文字列を返す
  } catch (error) {
    // エラー（ファイルが見つからない、構文エラーなど）が発生したらログを出してundefinedを返す
    console.error(`Failed to load text data for ${titleen}:`, error);
    return undefined;
  }
};
