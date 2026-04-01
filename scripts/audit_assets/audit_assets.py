import os
import yaml
import argparse
import cloudinary
import cloudinary.api
from dotenv import load_dotenv
from pathlib import Path

# プロジェクトルートの .env / .env.local を読み込みます
repo_root = Path(__file__).resolve().parent.parent
load_dotenv(repo_root / ".env.local")
load_dotenv(repo_root / ".env")

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

def audit_cloudinary_assets(folder_prefix, min_height=1080):
    print(f"🔍 Cloudinary 監査開始: {folder_prefix} (しきい値: {min_height}px)\n")

    # 1. Cloudinaryからアセット一覧を取得 (Search API)
    # ※ フォルダ指定で検索
    expression = f"folder:{folder_prefix}/*"
    result = cloudinary.Search().expression(expression).with_field("context").max_results(500).execute()

    assets = result.get("resources", [])
    total_found = len(assets)

    issues = []
    found_ids = set()

    print(f"📊 {total_found} 件のアセットを検出しました。\n")

    for asset in assets:
        public_id = asset['public_id']
        height = asset['height']
        width = asset['width']
        version = asset['version']
        created_at = asset['created_at']

        found_ids.add(public_id)

        # 判定：低解像度チェック
        if height < min_height:
            issues.append({
                "id": public_id,
                "reason": f"⚠️ 低解像度: {height}px (期待値: {min_height}px)",
                "url": asset['secure_url']
            })

    # 💡 結果表示
    if issues:
        print("❌ 以下の異常アセットが見つかりました:")
        for issue in issues:
            print(f"- {issue['id']}")
            print(f"  原因: {issue['reason']}")
            print(f"  URL: {issue['url']}\n")
    else:
        print("✅ すべてのアセットが解像度しきい値を満たしています。")

    return found_ids

def compare_with_yaml(yaml_path, found_ids):
    if not os.path.exists(yaml_path):
        print(f"❓ {yaml_path} が見つからないため、YAML比較をスキップします。")
        return

    with open(yaml_path, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    scroll_id = config.get("scroll_id")
    folder = config.get("folder", "emakimono")

    # YAMLから期待される ID リストを推測（簡易版）
    # 本来は scripts/sync_scroll.py と同じロジックで全IDを生成して比較
    print(f"📝 YAML ({scroll_id}) との整合性をチェック中...")

    # 幽霊データのチェック (Cloudinaryにはあるが、YAMLで意図していないもの)
    orphans = [pid for pid in found_ids if scroll_id not in pid]
    if orphans:
        print(f"👻 孤立したデータ（管理外）を {len(orphans)} 件検出しました:")
        for op in orphans:
            print(f"  - {op}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cloudinary Asset Auditor")
    parser.add_argument("--prefix", required=True, help="Cloudinaryのフォルダパス (例: emakimono/choju-giga)")
    parser.add_argument("--min-height", type=int, default=1080, help="最小解像度 (高さ)")
    parser.add_argument("--yaml", help="比較対象の scroll_config.yaml パス")

    args = parser.parse_args()

    found_ids = audit_cloudinary_assets(args.prefix, args.min_height)
    if args.yaml:
        compare_with_yaml(args.yaml, found_ids)
