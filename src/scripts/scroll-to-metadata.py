# scripts/scroll-to-metadata.py

import csv
import json
import os

# keywords.json を読み込んで、id から name と slug を取得するヘルパー関数
def load_keywords(keywords_json_path):
    if not os.path.exists(keywords_json_path):
        raise FileNotFoundError(f"keywords.json not found: {keywords_json_path}")
    with open(keywords_json_path, 'r', encoding='utf-8') as f:
        keywords_list = json.load(f)
    return {k['id']: k for k in keywords_list}

# scroll.csv -> metadata.json に変換するメイン関数
def convert_scroll_to_metadata(scroll_csv_path, keywords_json_path, metadata_json_path):
    if not os.path.exists(scroll_csv_path):
        raise FileNotFoundError(f"scroll.csv not found: {scroll_csv_path}")

    # キーワードマップを読み込む
    keywords_map = load_keywords(keywords_json_path)

    metadata_records = []

    with open(scroll_csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # keyword_ids を処理して、キーワードオブジェクト配列を作る
            keyword_ids = row.get("keyword_ids", "").split(",")
            keywords = [keywords_map[kid.strip()] for kid in keyword_ids if kid.strip() in keywords_map]

            # keywordフィールドを追加
            row['keyword'] = keywords

            # 不要なkeyword_idsフィールドは削除しておく（metadata.jsonには含めない）
            del row['keyword_ids']

            metadata_records.append(row)

    # JSONに変換して保存
    with open(metadata_json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(metadata_records, jsonfile, ensure_ascii=False, indent=2)

    print(f"✅ metadata.json generated successfully at {metadata_json_path}")

if __name__ == "__main__":
    # パス設定
    scroll_csv_path = os.path.join("data", "scroll.csv")
    keywords_json_path = os.path.join("data", "keywords.json")
    metadata_json_path = os.path.join("data", "metadata.json")

    # 変換実行
    convert_scroll_to_metadata(scroll_csv_path, keywords_json_path, metadata_json_path)
