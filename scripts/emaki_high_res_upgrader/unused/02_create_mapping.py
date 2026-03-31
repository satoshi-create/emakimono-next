import json
import re

# 1. 作品名の変換定義
# 移行したい方のキーワードを正確に記述してください
WORK_MAP = {
    # "kusouzu_eitaku": "kusouzu-eitaku" # 英沢版を優先する場合
    "nine-stages-of-decay-empress-danrin_honolulu": "jigokusoushi-anzyuin"      # 無印版を優先する場合はこちら
}

def get_root_index(public_id):
    match = re.search(r'_(\d{2})-1080_', public_id)
    return int(match.group(1)) if match else 999

def get_emaki_sort_key(public_id):
    nums = re.findall(r'\d+', public_id)
    if len(nums) >= 3:
        return tuple(map(int, nums[-3:]))
    return (99, 99, 99)

def create_mapping():
    try:
        with open("cloudinary_assets_filtered.json", "r", encoding="utf-8") as f:
            assets = json.load(f)
    except FileNotFoundError:
        print("❌ cloudinary_assets_filtered.json が見つかりません。")
        return

    roots = [a for a in assets if a.get('folder') == '']
    emakis = [a for a in assets if a.get('folder') == 'emakimono']

    mapping_list = []

    for old_key, new_key in WORK_MAP.items():
        print(f"🛡️ 厳格フィルタリングで解析中: {old_key} -> {new_key}")

        # --- 【修正ポイント】正規表現で作品名を厳格にマッチング ---
        # ^(作品名)_(\d{2}) という形を強制することで、
        # "kusouzu" が "kusouzu_eitaku" を拾うのを防ぎます
        pattern = rf"^{old_key}_\d{{2}}"

        source_ids = sorted(
            [a['public_id'] for a in roots if re.match(pattern, a['public_id'])],
            key=get_root_index
        )

        target_ids = sorted(
            [a['public_id'] for a in emakis if new_key in a['public_id']],
            key=get_emaki_sort_key
        )

        print(f"   - 抽出された原本: {len(source_ids)} 枚")
        print(f"   - ターゲット(新): {len(target_ids)} 枚")

        count = 0
        for src, tgt in zip(source_ids, target_ids):
            mapping_list.append({"source": src, "target": tgt})
            count += 1

        print(f" ✅ {count}ペアの紐付けに成功")

    with open("mapping_list.json", "w", encoding="utf-8") as f:
        json.dump(mapping_list, f, indent=2, ensure_ascii=False)

    print(f"\n✨ ノイズを排除した mapping_list.json が完成しました！")

if __name__ == "__main__":
    create_mapping()
