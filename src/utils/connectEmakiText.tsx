// TypeScriptの型だけをインポートします（ランタイムには影響しない）
import type { EmakiTextData } from "@/types/emaki.ts";

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
    const module = await import(`@/data/emaki-text-data/${titleen}.json`);

    // JSONモジュールのdefaultエクスポート部分にアクセスし、型アサーションを適用
    const emakiTextData = module.default as EmakiTextData[];

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
