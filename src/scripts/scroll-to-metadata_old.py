# scripts/scroll-to-metadata.py

import csv
import json
import os

# scroll.csv -> metadata.json に変換するメイン関数
def convert_scroll_to_metadata(scroll_csv_path, metadata_json_path):
    # scroll.csv ファイルの存在チェック
    if not os.path.exists(scroll_csv_path):
        raise FileNotFoundError(f"scroll.csv not found: {scroll_csv_path}")

    metadata_records = []  # metadata用のリストを初期化

    # scroll.csv を読み込む
    with open(scroll_csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)  # ヘッダーをキーにして辞書型で読む
        for row in reader:
            # 1行ずつ読み込み、そのままリストに追加（フィールド名変更なし）
            metadata_records.append(row)

    # リストを metadata.json として保存
    with open(metadata_json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(metadata_records, jsonfile, ensure_ascii=False, indent=2)

    print(f"✅ metadata.json generated successfully at {metadata_json_path}")

# スクリプトを直接実行したときの処理
def main():
    # ファイルパス設定
    scroll_csv_path = os.path.join("data", "scroll.csv")
    metadata_json_path = os.path.join("data", "metadata.json")

    # 変換実行
    convert_scroll_to_metadata(scroll_csv_path, metadata_json_path)

if __name__ == "__main__":
    main()
