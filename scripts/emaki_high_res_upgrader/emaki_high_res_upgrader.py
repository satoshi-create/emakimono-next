import os
import json
import re
import cloudinary
import cloudinary.api
import cloudinary.uploader
from dotenv import load_dotenv
from pathlib import Path

# ==========================================
# 0. 初期設定 & 環境変数の読み込み
# ==========================================
# プロジェクトルートの .env / .env.local を読み込みます
repo_root = Path(__file__).resolve().parent.parent
load_dotenv(repo_root / ".env.local")
load_dotenv(repo_root / ".env")

cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')

cloudinary.config(
    cloud_name = cloud_name,
    api_key    = os.getenv('CLOUDINARY_API_KEY'),
    api_secret = os.getenv('CLOUDINARY_API_SECRET'),
    secure = True
)

# 【重要】移行対象の作品定義
# 左：原本(Root)の作品キー名 | 右：新環境(emakimonoフォルダ)のフォルダ/ID名
WORK_MAP = {
    "nine-stages-of-decay-empress-danrin_honolulu": "jigokusoushi-anzyuin"
}

# ==========================================
# 1. 資産抽出フェーズ (旧01_cludinary_assets.py)
# ==========================================
def fetch_resources():
    """Cloudinaryからルートとemakimonoフォルダの資産一覧を取得しファイル保存する"""
    print("🔍 ステップ1: Cloudinaryから資産リストを抽出中...")
    all_assets = []
    next_cursor = None

    while True:
        result = cloudinary.api.resources(
            type="upload", max_results=500, next_cursor=next_cursor
        )
        resources = result.get("resources", [])

        # ルートフォルダ(空文字) または emakimonoフォルダのみを抽出
        for res in resources:
            folder = res.get("folder", "")
            if folder == "" or folder == "emakimono":
                all_assets.append(res)

        next_cursor = result.get("next_cursor")
        if not next_cursor: break

    with open("assets_cache.json", "w", encoding="utf-8") as f:
        json.dump(all_assets, f, indent=2, ensure_ascii=False)

    print(f"✅ 抽出完了: {len(all_assets)} 件を取得しました。")
    return all_assets

# ==========================================
# 2. マッピングフェーズ (旧02_create_mapping.py)
# ==========================================
def get_root_index(public_id):
    """旧IDから連番(01等)を数値として抽出。記号等の混入に強い正規表現を使用"""
    match = re.search(r'_(\d{2})-1080_', public_id)
    return int(match.group(1)) if match else 999

def get_emaki_sort_key(public_id):
    """新IDの構造 [scroll]__[scene]__[suffix] を分解してソート用キーを生成"""
    parts = public_id.split('__')
    if len(parts) < 3: return (99, 99, 99)
    scene_id = parts[1]
    suffix = parts[2]
    # シーンID内の数字リスト化と、suffix(bg=0, 数字=1〜)の重み付け
    scene_nums = list(map(int, re.findall(r'\d+', scene_id)))
    suffix_order = 0 if suffix == 'bg' else int(re.sub(r'\D', '', suffix))
    return (*scene_nums, suffix_order)

def create_mapping(assets):
    """新旧データの並び順を数値ベースで整列させ、1:1のペアリストを作る"""
    print("🛡️ ステップ2: 厳格なフィルタリングでマッピングを作成中...")
    roots = [a for a in assets if a.get('folder') == '']
    emakis = [a for a in assets if a.get('folder') == 'emakimono']
    mapping_list = []

    for old_key, new_key in WORK_MAP.items():
        # 正規表現 ^(作品名)_\d{2} により、類似した別作品(eitaku版等)の混入を防ぐ
        pattern = rf"^{old_key}_\d{{2}}"

        source_ids = sorted(
            [a['public_id'] for a in roots if re.match(pattern, a['public_id'])],
            key=get_root_index
        )
        target_ids = sorted(
            [a['public_id'] for a in emakis if new_key in a['public_id']],
            key=get_emaki_sort_key
        )

        print(f"   - {new_key}: 原本({len(source_ids)}枚) ↔ ターゲット({len(target_ids)}枚)")

        for src, tgt in zip(source_ids, target_ids):
            mapping_list.append({"source": src, "target": tgt})

    with open("mapping_list.json", "w", encoding="utf-8") as f:
        json.dump(mapping_list, f, indent=2, ensure_ascii=False)

    print(f"✅ マッピング完了: {len(mapping_list)} ペアを確定しました。")
    return mapping_list

# ==========================================
# 3. 移行実行フェーズ (旧03_safe_migration.py)
# ==========================================
def execute_migration(mapping):
    """原本のURLをソースとして新IDへ上書き。原本を削除しない安全なリモートコピー"""
    if not mapping:
        print("⚠️ 実行可能なマッピングがないため、処理を中断します。")
        return

    print(f"🚀 ステップ3: リモートコピーによる高画質化を開始... (対象: {len(mapping)}件)")
    results = {"success": [], "error": []}

    for item in mapping:
        src_id, tgt_id = item['source'], item['target']
        # Public IDをCloudinaryのフルURLへ変換（アップロードソースとして利用）
        source_url = f"https://res.cloudinary.com/{cloud_name}/image/upload/{src_id}"

        try:
            cloudinary.uploader.upload(
                source_url,
                public_id=tgt_id,
                overwrite=True,
                invalidate=True, # CDNキャッシュもリフレッシュ
                resource_type="image"
            )
            print(f" ✅ 置換成功: {tgt_id}")
            results["success"].append(tgt_id)
        except Exception as e:
            print(f" ❌ 失敗: {tgt_id} | 理由: {e}")
            results["error"].append({"target": tgt_id, "error": str(e)})

    with open("migration_log.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n✨ 全工程が完了しました！ (成功: {len(results['success'])} / 失敗: {len(results['error'])})")

# ==========================================
# メイン実行処理
# ==========================================
if __name__ == "__main__":
    # 1. 資産を抽出
    assets = fetch_resources()
    # 2. 紐付けリストを作成
    mapping = create_mapping(assets)

    # 3. 実行確認
    if mapping:
        confirm = input(f"\n上記 {len(mapping)} 件の置換を実行しますか？ (y/n): ")
        if confirm.lower() == 'y':
            execute_migration(mapping)
        else:
            print("🛑 処理をキャンセルしました。mapping_list.json を確認してください。")
