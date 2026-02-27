import os
import re

# 1. 設定
target_dir = "./images"
scroll_id = "choju-jinbutsu-giga_first"

# 2. 変換マッピング（旧ファイル名の数字部分: 新ファイル名の中間〜末尾部分）
mapping = {
    "01": "choju_giga_1_01__01",
    "02": "choju_giga_1_01__02",
    "03": "choju_giga_1_01__03",
    "04": "choju_giga_1_01__04",
    "05": "choju_giga_1_02__01",
    "06": "choju_giga_1_02__02",
    "07": "choju_giga_1_02__03",
    "08": "choju_giga_1_02__04",
    "09": "choju_giga_1_02__05",
    "10": "choju_giga_1_02__06",
    "11": "choju_giga_1_03__01",
    "12": "choju_giga_1_03__02",
    "13": "choju_giga_1_04__01",
    "14": "choju_giga_1_04__02",
    "15": "choju_giga_1_05__01",
    "16": "choju_giga_1_05__02",
    "17": "choju_giga_1_06__01",
    "18": "choju_giga_1_06__02",
    "19": "choju_giga_1_07__01",
    "20": "choju_giga_1_08__01",
    "21": "choju_giga_1_08__02",
    "22": "choju_giga_1_09__01",
    "23": "choju_giga_1_09__02",
}

def bulk_rename():
    if not os.path.exists(target_dir):
        print(f"Error: フォルダ '{target_dir}' が見つかりません。")
        return

    count = 0
    for old_name in os.listdir(target_dir):
        if not old_name.lower().endswith(".jpg"):
            continue

        # 正規表現で末尾の数字部分を抽出 (例: _01-375.jpg から "01" を取得)
        # アンダースコアの後の2桁の数字を探します
        match = re.search(r'_(\d{2})', old_name)

        if match:
            suffix_id = match.group(1)

            if suffix_id in mapping:
                new_inner_part = mapping[suffix_id]
                # 新しい命名規則: [scroll_id]__[inner_part].jpg
                new_name = f"{scroll_id}__{new_inner_part}.jpg"

                old_path = os.path.join(target_dir, old_name)
                new_path = os.path.join(target_dir, new_name)

                # 重複チェック（念のため）
                if os.path.exists(new_path):
                    print(f"Skip: {new_name} は既に存在します。")
                    continue

                os.rename(old_path, new_path)
                print(f"Renamed: {old_name} -> {new_name}")
                count += 1

    print(f"\n完了: {count}個のファイルをリネームしました。")

if __name__ == "__main__":
    bulk_rename()
