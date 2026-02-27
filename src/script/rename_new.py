import os
import re

# 1. 設定：現在作業する絵巻の情報を定義します
# 鳥獣戯画 甲巻（原本）の場合
theme_id = "choju-giga"
version_id = "yamazaki-kou"
scroll_id = f"{theme_id}-{version_id}" # 結果: choju-giga-original-kou

target_dir = "./images" # 画像が入っているフォルダのパス

# 2. 変換マッピング（旧ファイル名の数字部分: 新しい「scene_id__suffix」）
# [scroll_id]_1_[章]__ [連番] という構造になります
mapping = {
    # 第1章 (choju-giga-original-kou_1_01)
    "01": f"{scroll_id}_1_01__01",
    "02": f"{scroll_id}_1_01__02",
    "03": f"{scroll_id}_1_01__03",
    "04": f"{scroll_id}_1_01__04",
    # 第2章 (choju-giga-original-kou_1_02)
    "05": f"{scroll_id}_1_02__01",
    "06": f"{scroll_id}_1_02__02",
    "07": f"{scroll_id}_1_02__03",
    "08": f"{scroll_id}_1_02__04",
    "09": f"{scroll_id}_1_02__05",
    "10": f"{scroll_id}_1_02__06",
    # 第3章
    "11": f"{scroll_id}_1_03__01",
    "12": f"{scroll_id}_1_03__02",
    # 第4章
    "13": f"{scroll_id}_1_04__01",
    "14": f"{scroll_id}_1_04__02",
    # 第5章
    "15": f"{scroll_id}_1_05__01",
    "16": f"{scroll_id}_1_05__02",
    # 第6章
    "17": f"{scroll_id}_1_06__01",
    "18": f"{scroll_id}_1_06__02",
    # 第7章
    "19": f"{scroll_id}_1_07__01",
    # 第8章
    "20": f"{scroll_id}_1_08__01",
    "21": f"{scroll_id}_1_08__02",
    # 第9章
    "22": f"{scroll_id}_1_09__01",
    "23": f"{scroll_id}_1_09__02",
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
        match = re.search(r'_(\d{2})', old_name)

        if match:
            suffix_id = match.group(1)

            if suffix_id in mapping:
                # [scroll_id]__[scene_id]__[suffix].jpg の形式に組み立て
                new_inner_part = mapping[suffix_id]
                new_name = f"{scroll_id}__{new_inner_part}.jpg"

                old_path = os.path.join(target_dir, old_name)
                new_path = os.path.join(target_dir, new_name)

                if os.path.exists(new_path):
                    print(f"Skip: {new_name} は既に存在します。")
                    continue

                os.rename(old_path, new_path)
                print(f"Renamed: {old_name} -> {new_name}")
                count += 1

    print(f"\n完了: {count}個のファイルを新しい命名規則 '{scroll_id}' でリネームしました。")

if __name__ == "__main__":
    bulk_rename()
